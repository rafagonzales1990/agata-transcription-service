import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ProviderStatus = {
  status: 'ok' | 'error'
  latency: number
  detail?: string
}

async function checkGeminiModel(apiKey: string, model: string): Promise<ProviderStatus> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

    const latency = Date.now() - start

    if (!res.ok) return { status: 'error', latency, detail: `HTTP ${res.status}` }
    return { status: 'ok', latency }
  } catch (err: unknown) {
    return {
      status: 'error',
      latency: Date.now() - start,
      detail: (err as Error).message ?? 'timeout',
    }
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

    const latency = Date.now() - start

    if (!res.ok) return { status: 'error', latency, detail: `HTTP ${res.status}` }
    return { status: 'ok', latency }
  } catch (err: unknown) {
    return {
      status: 'error',
      latency: Date.now() - start,
      detail: (err as Error).message ?? 'timeout',
    }
  }
}

async function verifyDevRole(supabase: any, authHeader: string): Promise<boolean> {
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
    const body = await req.json().catch(() => ({}))
    const isCron = body?.mode === 'cron'

    const authHeader = req.headers.get('Authorization')
    if (!isCron) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabaseForAuth = createClient(supabaseUrl, supabaseServiceKey)

      const isDevUser = await verifyDevRole(supabaseForAuth, authHeader)
      if (!isDevUser) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY') || ''
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || ''

    const noKey: ProviderStatus = { status: 'error', latency: 0, detail: 'API key not configured' }

    const [gemini_2_5, gemini_2_0, openai] = await Promise.all([
      geminiApiKey ? checkGeminiModel(geminiApiKey, 'gemini-2.5-flash') : Promise.resolve(noKey),
      geminiApiKey ? checkGeminiModel(geminiApiKey, 'gemini-2.0-flash') : Promise.resolve(noKey),
      openaiApiKey ? checkOpenAI(openaiApiKey) : Promise.resolve(noKey),
    ])

    const result = { gemini_2_5, gemini_2_0, openai, checkedAt: new Date().toISOString() }

    if (isCron && gemini_2_5.status !== 'ok' && gemini_2_0.status !== 'ok') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'custom',
          to: 'adm@agatatranscription.com',
          subject: `⚠️ Alerta Ágata: Gemini API DOWN (2.5 e 2.0)`,
          html: `
            <h2>Alerta de Instabilidade — Gemini API</h2>
            <p><strong>gemini-2.5-flash:</strong> ${gemini_2_5.status} (${gemini_2_5.latency}ms) ${gemini_2_5.detail ?? ''}</p>
            <p><strong>gemini-2.0-flash:</strong> ${gemini_2_0.status} (${gemini_2_0.latency}ms) ${gemini_2_0.detail ?? ''}</p>
            <p><strong>OpenAI:</strong> ${openai.status} (${openai.latency}ms)</p>
            <p><strong>Verificado em:</strong> ${result.checkedAt}</p>
            <p>O fallback OpenAI está ${openai.status === 'ok' ? '✅ ativo e funcionando' : '❌ também com problemas'}.</p>
            <hr>
            <p><small>Acesse o painel DEV → Status IAs para mais detalhes.</small></p>
          `
        }
      })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    console.error('health-check error:', err)
    return new Response(
      JSON.stringify({
        gemini_2_5: { status: 'error', latency: 0, detail: (err as Error).message ?? 'internal error' },
        gemini_2_0: { status: 'error', latency: 0, detail: (err as Error).message ?? 'internal error' },
        openai: { status: 'unknown', latency: 0 },
        checkedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
