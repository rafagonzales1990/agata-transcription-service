import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ProviderStatus = {
  status: 'ok' | 'degraded' | 'down'
  latencyMs: number
}

async function checkGemini(apiKey: string): Promise<ProviderStatus> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'ok' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
        signal: controller.signal,
      }
    )
    clearTimeout(timeout)

    const latencyMs = Date.now() - start

    if (res.status === 429) return { status: 'degraded', latencyMs }
    if (res.status >= 500) return { status: 'down', latencyMs }
    if (!res.ok) return { status: 'degraded', latencyMs }
    if (latencyMs > 15000) return { status: 'down', latencyMs }
    if (latencyMs > 5000) return { status: 'degraded', latencyMs }
    return { status: 'ok', latencyMs }
  } catch (err: unknown) {
    const latencyMs = Date.now() - start
    if (latencyMs >= 14000) return { status: 'down', latencyMs }
    return { status: 'down', latencyMs }
  }
}

async function checkOpenAI(apiKey: string): Promise<ProviderStatus> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const latencyMs = Date.now() - start

    if (res.status === 429) return { status: 'degraded', latencyMs }
    if (res.status >= 500) return { status: 'down', latencyMs }
    if (!res.ok) return { status: 'degraded', latencyMs }
    if (latencyMs > 15000) return { status: 'down', latencyMs }
    if (latencyMs > 5000) return { status: 'degraded', latencyMs }
    return { status: 'ok', latencyMs }
  } catch (err: unknown) {
    const latencyMs = Date.now() - start
    if (latencyMs >= 14000) return { status: 'down', latencyMs }
    return { status: 'down', latencyMs }
  }
}

async function verifyDevRole(supabase: ReturnType<typeof createClient>, authHeader: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error } = await authClient.auth.getUser()
  if (error || !user) return false

  const { data: userData } = await supabase
    .from('User')
    .select('id, isAdmin, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!userData) return false
  return userData.isAdmin || userData.role === 'dev'
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

    const isDevUser = await verifyDevRole(supabase, authHeader)
    if (!isDevUser) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') || ''
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || ''

    const [gemini, openai] = await Promise.all([
      geminiApiKey ? checkGemini(geminiApiKey) : Promise.resolve({ status: 'down' as const, latencyMs: 0 }),
      openaiApiKey ? checkOpenAI(openaiApiKey) : Promise.resolve({ status: 'down' as const, latencyMs: 0 }),
    ])

    return new Response(JSON.stringify({
      gemini,
      openai,
      checkedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('health-check error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
