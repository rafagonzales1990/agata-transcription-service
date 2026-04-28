import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GEMINI_MODEL = 'gemini-2.5-flash'

interface ConflictResult {
  conflictingMeetingId: string
  conflictDescription: string
  severity: 'low' | 'medium' | 'high'
  conflictType: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { meetingId, userId } = await req.json()

    if (!meetingId || !userId) {
      return new Response(JSON.stringify({ error: 'meetingId and userId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch current meeting
    const { data: currentMeeting, error: currentErr } = await supabase
      .from('Meeting')
      .select('id, title, summary, transcription')
      .eq('id', meetingId)
      .maybeSingle()

    if (currentErr || !currentMeeting) {
      console.error('[detect-conflicts] Current meeting not found:', currentErr?.message)
      return new Response(JSON.stringify({ error: 'Meeting not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Fetch last 50 completed meetings from same user (excluding current)
    const { data: previousMeetings } = await supabase
      .from('Meeting')
      .select('id, title, "createdAt", summary, transcription')
      .eq('userId', userId)
      .eq('status', 'completed')
      .neq('id', meetingId)
      .order('"createdAt"', { ascending: false })
      .limit(50)

    if (!previousMeetings || previousMeetings.length === 0) {
      // No previous meetings to compare — insert empty and return
      await supabase
        .from('MeetingConflict')
        .delete()
        .eq('meetingId', meetingId)

      return new Response(JSON.stringify({ success: true, conflictsFound: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Build Gemini prompt
    const prompt = `
Você é um agente de governança corporativa. Analise a reunião atual e
compare com as reuniões anteriores para detectar conflitos, contradições
ou inconsistências importantes.

REUNIÃO ATUAL (ID: ${meetingId}):
Título: ${currentMeeting.title}
Transcrição/Resumo: ${currentMeeting.summary || currentMeeting.transcription?.slice(0, 3000)}

REUNIÕES ANTERIORES:
${previousMeetings.map((m: any) => `
ID: ${m.id}
Título: ${m.title}
Data: ${m.createdAt}
Resumo: ${m.summary?.slice(0, 500) || m.transcription?.slice(0, 500)}
`).join('---')}

Identifique conflitos REAIS e IMPORTANTES como:
- Decisões contraditórias (ex: "vamos aumentar preço" vs "vamos manter preço")
- Compromissos não cumpridos mencionados novamente
- Estratégias incompatíveis entre reuniões
- Mudanças de posição significativas

Para cada conflito encontrado, responda SOMENTE em JSON válido:
{
  "conflicts": [
    {
      "conflictingMeetingId": "uuid da reunião anterior",
      "conflictDescription": "Descrição clara do conflito em PT-BR (máx 200 chars)",
      "severity": "low|medium|high",
      "conflictType": "decisão|estratégia|compromisso|posição"
    }
  ]
}

Se não houver conflitos reais e importantes, retorne: {"conflicts": []}
Retorne APENAS o JSON, sem texto adicional.
`

    // 4. Call Gemini 2.5 Flash
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
        }),
        signal: AbortSignal.timeout(60000),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('[detect-conflicts] Gemini error:', geminiRes.status, errText.slice(0, 300))
      return new Response(JSON.stringify({ error: `Gemini error: ${geminiRes.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiJson = await geminiRes.json()
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // 5. Parse JSON response
    let conflicts: ConflictResult[] = []
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText)
      conflicts = Array.isArray(parsed?.conflicts) ? parsed.conflicts : []
    } catch (parseErr) {
      console.warn('[detect-conflicts] JSON parse failed, assuming no conflicts:', (parseErr as Error).message)
      conflicts = []
    }

    // 6. Delete existing conflicts for this meetingId (handles retranscription)
    await supabase
      .from('MeetingConflict')
      .delete()
      .eq('meetingId', meetingId)

    // 7. Insert new conflicts
    if (conflicts.length > 0) {
      const rows = conflicts.map((c) => ({
        meetingId,
        userId,
        conflictingMeetingId: c.conflictingMeetingId,
        conflictDescription: (c.conflictDescription || '').slice(0, 200),
        severity: ['low', 'medium', 'high'].includes(c.severity) ? c.severity : 'low',
        conflictType: c.conflictType || 'decisão',
        createdAt: new Date().toISOString(),
      }))

      const { error: insertErr } = await supabase.from('MeetingConflict').insert(rows)
      if (insertErr) {
        console.error('[detect-conflicts] Insert error:', insertErr.message)
      }
    }

    console.log(`[detect-conflicts] Meeting ${meetingId}: ${conflicts.length} conflict(s) found`)
    return new Response(JSON.stringify({ success: true, conflictsFound: conflicts.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('[detect-conflicts] Unexpected error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
