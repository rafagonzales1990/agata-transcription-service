import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifyAdmin(supabase: any, authHeader: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error } = await authClient.auth.getUser()
  if (error || !user) return null

    const { data: userData } = await supabase
      .from('User')
      .select('id, isAdmin, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!userData) return null
    if (!userData.isAdmin && userData.role !== 'dev') return null
    return user
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const admin = await verifyAdmin(supabase, authHeader)
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: logs } = await supabase
      .from('TranscriptionLog')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(100)

    const allLogs = logs || []
    const currentMonth = new Date().toISOString().slice(0, 7)

    // Normalize provider variants into canonical buckets
    function normalizeProvider(provider: string | null): string {
      if (provider && provider.includes('assembly')) return 'assemblyai'
      if (!provider || provider.includes('gemini') || provider.includes('groq')) return 'gemini'
      if (provider.includes('openai') || provider.includes('whisper') || provider.includes('gpt')) return 'openai'
      return provider
    }

    let totalTranscriptions = allLogs.length
    let totalMinutes = 0
    let totalCostCents = 0
    const providerStats: Record<string, { minutes: number; cost: number; count: number }> = {}
    const currentMonthProviders: Record<string, { minutes: number; cost: number; count: number }> = {}

    for (const log of allLogs) {
      totalMinutes += Math.round((log.durationSecs || 0) / 60)
      totalCostCents += log.costCents || 0

      const provider = normalizeProvider(log.provider)
      if (!providerStats[provider]) providerStats[provider] = { minutes: 0, cost: 0, count: 0 }
      providerStats[provider].minutes += Math.round((log.durationSecs || 0) / 60)
      providerStats[provider].cost += log.costCents || 0
      providerStats[provider].count += 1

      if (log.createdAt?.startsWith(currentMonth)) {
        if (!currentMonthProviders[provider]) currentMonthProviders[provider] = { minutes: 0, cost: 0, count: 0 }
        currentMonthProviders[provider].minutes += Math.round((log.durationSecs || 0) / 60)
        currentMonthProviders[provider].cost += log.costCents || 0
        currentMonthProviders[provider].count += 1
      }
    }

    // Count all Gemini-family requests today (covers 'gemini', 'gemini-2.5-flash', etc.)
    const todayStr = new Date().toISOString().slice(0, 10)
    const { count: dailyGeminiCount } = await supabase
      .from('TranscriptionLog')
      .select('*', { count: 'exact', head: true })
      .ilike('provider', '%gemini%')
      .gte('createdAt', todayStr + 'T00:00:00.000Z')
      .lte('createdAt', todayStr + 'T23:59:59.999Z')

    return new Response(JSON.stringify({
      totalTranscriptions,
      totalMinutes,
      totalCostCents,
      providerStats,
      currentMonthProviders,
      dailyGeminiCount: dailyGeminiCount || 0,
      recentLogs: allLogs.slice(0, 20),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('admin-costs error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
