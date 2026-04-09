import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { meetingId, tone = 'formal' } = await req.json()
    if (!meetingId) return new Response(JSON.stringify({ error: 'meetingId required' }), { status: 400, headers: corsHeaders })

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: meeting, error: meetingError } = await supabase
      .from('Meeting')
      .select('id, title, summary, transcription, actionItems, participants, meetingDate, meetingTime, responsible, userId')
      .eq('id', meetingId)
      .maybeSingle()

    if (meetingError || !meeting) return new Response(JSON.stringify({ error: 'Meeting not found' }), { status: 404, headers: corsHeaders })
    if (meeting.userId !== user.id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: corsHeaders })
    if (!meeting.summary && !meeting.transcription) return new Response(JSON.stringify({ error: 'Reunião sem conteúdo para gerar follow-up' }), { status: 400, headers: corsHeaders })

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')!
    const content = meeting.summary || meeting.transcription || ''

    const toneInstruction = tone === 'formal'
      ? 'Use linguagem formal e profissional, tratamento "você" ou nome.'
      : 'Use linguagem mais próxima e informal, mas ainda profissional.'

    const dateStr = meeting.meetingDate
      ? new Date(meeting.meetingDate).toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR')

    const prompt = `Você é um assistente especialista em comunicação corporativa brasileira.

Com base no conteúdo da reunião abaixo, gere um e-mail de follow-up profissional em português brasileiro.

INFORMAÇÕES DA REUNIÃO:
- Título: ${meeting.title}
- Data: ${dateStr}
- Participantes: ${(meeting.participants || []).join(', ') || 'não informado'}
- Responsável: ${meeting.responsible || 'não informado'}

CONTEÚDO DA REUNIÃO:
${content.slice(0, 6000)}

${toneInstruction}

Retorne APENAS um JSON válido com esta estrutura exata (sem markdown, sem texto antes ou depois):
{
  "subject": "assunto do e-mail aqui",
  "body": "corpo completo do e-mail aqui, usando \\n para quebras de linha",
  "recipients": ["email1@exemplo.com"]
}

REGRAS para o corpo do e-mail:
1. Comece com saudação: "Olá [nome/time],"
2. Parágrafo introdutório referenciando a reunião e data
3. Seção "✅ Decisões tomadas:" com lista de decisões (use - para cada item)
4. Seção "📋 Action items:" com cada tarefa, responsável e prazo quando mencionado
5. Seção "📅 Próximos passos:" com encaminhamentos
6. Fechamento profissional
7. Assinatura genérica: "Atenciosamente,"
8. Máximo 400 palavras
9. NÃO invente informações — use apenas o que está no conteúdo
10. Se não houver decisões claras, omita a seção
11. Para recipients: use os e-mails dos participantes se mencionados, senão retorne array vazio`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        })
      }
    )

    if (!geminiRes.ok) throw new Error(`Gemini error: ${geminiRes.status}`)

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    let followupData: { subject: string; body: string; recipients: string[] }

    try {
      followupData = JSON.parse(cleanText)
    } catch {
      followupData = {
        subject: `Follow-up: ${meeting.title} — ${dateStr}`,
        body: cleanText,
        recipients: []
      }
    }

    const draft = {
      subject: followupData.subject || `Follow-up: ${meeting.title}`,
      body: followupData.body || '',
      recipients: followupData.recipients || [],
      generatedAt: new Date().toISOString(),
      tone,
    }

    await supabase.from('Meeting').update({
      followupDraft: draft,
      updatedAt: new Date().toISOString(),
    }).eq('id', meetingId)

    return new Response(JSON.stringify({ success: true, draft }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Generate followup error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
