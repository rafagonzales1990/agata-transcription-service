import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { meetingId, transcription } = await req.json()
    if (!meetingId || !transcription) {
      return new Response(JSON.stringify({ error: 'meetingId and transcription required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = `Extraia os itens de ação (tarefas, compromissos, próximos passos)
mencionados nesta transcrição de reunião em português brasileiro.

Responda APENAS com um JSON array de strings, sem markdown, sem explicação, sem texto antes ou depois.
Se não houver nenhum item de ação claro, responda com: []

Exemplo de resposta válida:
["Enviar proposta comercial até sexta", "Validar contrato com jurídico"]

Transcrição:
${transcription.slice(0, 30000)}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    let items: string[] = []

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
          }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeout)

      if (response.ok) {
        const result = await response.json()
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
        const cleaned = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(cleaned)
        if (Array.isArray(parsed)) items = parsed.filter((i) => typeof i === 'string' && i.trim())
      } else {
        console.warn('[extract-action-items] Gemini falhou:', response.status)
      }
    } catch (err) {
      clearTimeout(timeout)
      console.warn('[extract-action-items] Erro ou timeout:', (err as Error).message)
    }

    const actionItemsData = items.map((text) => ({
      id: crypto.randomUUID(),
      text,
      completed: false,
    }))

    await supabase.from('Meeting').update({
      actionItemsData,
      updatedAt: new Date().toISOString(),
    }).eq('id', meetingId)

    console.log(`[extract-action-items] ${items.length} itens extraídos para meeting ${meetingId}`)

    return new Response(JSON.stringify({ success: true, count: items.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[extract-action-items] Erro:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
