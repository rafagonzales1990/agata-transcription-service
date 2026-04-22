import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PAID_PLANS = ['inteligente', 'automacao', 'enterprise']

const prompts: Record<string, (title: string, transcription: string) => string> = {
  executivo: (meetingTitle, transcription) => `Você é um assistente especializado em criar resumos de reuniões corporativas
em português brasileiro. A transcrição é de uma reunião intitulada "${meetingTitle}".
Use formatação Markdown rica.

Crie um **Resumo Executivo** conciso (máximo 300 palavras):

## Resumo Executivo
Parágrafo resumindo contexto e objetivo.

### Decisões-Chave
3 a 5 decisões mais importantes em bullet points.

### Próximos Passos Críticos
2 a 3 próximos passos mais urgentes.

Transcrição:
${transcription}`,

  detalhado: (meetingTitle, transcription) => `Você é um assistente especializado em criar resumos de reuniões corporativas
em português brasileiro. A transcrição é de uma reunião intitulada "${meetingTitle}".
Use formatação Markdown rica.

Crie um **Resumo Detalhado** estruturado:

## Resumo Executivo
Visão geral da reunião.

## Tópicos Discutidos
### [Nome do Tópico] para cada tópico principal.

## Decisões Tomadas
Lista de todas as decisões em bullet points com contexto.

## Ações e Responsáveis
Tabela markdown: | Ação | Responsável | Prazo |
Inclua TODAS as ações. Prazo não mencionado = "A definir".

## Próximos Passos
Lista priorizada.

Transcrição:
${transcription}`,

  ata_completa: (meetingTitle, transcription) => `Você é um assistente especializado em criar resumos de reuniões corporativas
em português brasileiro. A transcrição é de uma reunião intitulada "${meetingTitle}".
Use formatação Markdown rica.

Crie uma **ATA Completa** extremamente detalhada:

## Resumo Executivo
Parágrafo abrangente com contexto e objetivos.

## Participantes Identificados
Nomes mencionados e papéis.

## Pauta / Tópicos Discutidos
### [Nome do Tópico]
- **Contexto**: motivação
- **Discussão**: pontos levantados
- **Conclusão**: resultado

## Decisões Tomadas
- **Decisão**: descrição
- **Justificativa**: motivo
- **Impacto**: quem é afetado

## Ações e Responsáveis
| # | Ação | Responsável | Prazo | Prioridade |
|---|------|-------------|-------|------------|

## Riscos e Pendências
Questões em aberto.

## Próximos Passos
Lista priorizada.

## Observações Adicionais
Informações extras relevantes.

Transcrição:
${transcription}`,
}

const maxTokens: Record<string, number> = {
  executivo: 4000,
  detalhado: 8192,
  ata_completa: 8192,
}

async function generateSummaryWithOpenAI(
  transcription: string,
  summaryType: string,
  openaiApiKey: string
): Promise<string> {
  const openaiPrompts: Record<string, string> = {
    executivo: `Você é um assistente especializado em resumos executivos.
Gere um resumo executivo conciso da seguinte transcrição de reunião em português brasileiro.
Inclua: principais decisões, pontos-chave e próximos passos.
Transcrição: ${transcription}`,
    detalhado: `Você é um assistente especializado em análise de reuniões.
Gere um resumo detalhado da seguinte transcrição em português brasileiro.
Inclua: todos os tópicos discutidos, decisões tomadas, responsáveis e prazos mencionados.
Transcrição: ${transcription}`,
    ata_completa: `Você é um assistente especializado em atas de reunião.
Gere uma ATA completa e profissional da seguinte transcrição em português brasileiro.
Inclua: identificação da reunião, pauta, decisões, itens de ação com responsáveis e prazos, próximos passos.
Transcrição: ${transcription}`
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: openaiPrompts[summaryType] || openaiPrompts.executivo }],
      max_tokens: 4096,
      temperature: 0.3,
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI error ${response.status}: ${err.substring(0, 300)}`)
  }

  const result = await response.json()
  return result.choices?.[0]?.message?.content || ''
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
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { meetingId, depth } = await req.json()
    if (!meetingId || !depth || !prompts[depth]) {
      return new Response(JSON.stringify({ error: 'meetingId and valid depth required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Rate limiting: max 20 summary generations per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: summaryCount } = await supabase
      .from('Meeting')
      .select('*', { count: 'exact', head: true })
      .eq('userId', user.id)
      .not('summary', 'is', null)
      .gte('updatedAt', oneHourAgo)

    if ((summaryCount || 0) >= 20) {
      return new Response(
        JSON.stringify({ error: 'Limite de resumos por hora atingido.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check plan permissions
    if (depth !== 'executivo') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_id')
        .eq('user_id', user.id)
        .single()

      const planId = profile?.plan_id || 'basic'
      if (!PAID_PLANS.includes(planId)) {
        return new Response(JSON.stringify({ error: 'Recurso disponível apenas para planos pagos' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Fetch meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('Meeting')
      .select('title, transcription, userId')
      .eq('id', meetingId)
      .single()

    if (meetingError || !meeting) {
      return new Response(JSON.stringify({ error: 'Meeting not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (meeting.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!meeting.transcription) {
      return new Response(JSON.stringify({ error: 'No transcription available' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = prompts[depth](meeting.title, meeting.transcription)

    // Call Gemini with OpenAI fallback
    let summaryText = ''
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens[depth] },
          }),
        }
      )

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text()
        console.error('Gemini error:', errText)
        throw new Error(`Gemini API error: ${geminiResponse.status}`)
      }

      const geminiResult = await geminiResponse.json()
      summaryText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } catch (geminiErr) {
      console.warn('Gemini falhou no generate-summary, usando OpenAI:', (geminiErr as Error).message)
      if (!openaiApiKey) throw geminiErr
      summaryText = await generateSummaryWithOpenAI(meeting.transcription, depth, openaiApiKey)
      console.log('OpenAI fallback para summary concluído')
    }

    // Save to meeting
    const fullSummary = `<!-- depth:${depth} -->\n${summaryText}`
    await supabase.from('Meeting').update({
      summary: fullSummary,
      updatedAt: new Date().toISOString(),
    }).eq('id', meetingId)

    return new Response(JSON.stringify({ status: 'completed', summary: summaryText, depth }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Generate summary error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
