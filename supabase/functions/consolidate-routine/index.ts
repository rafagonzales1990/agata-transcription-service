import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get user from token
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { routineId, meetingIds, type } = await req.json()
  if (!routineId || !meetingIds?.length || !type) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify routine ownership
  const { data: routine } = await supabase
    .from('Routine')
    .select('id, name, userId')
    .eq('id', routineId)
    .eq('userId', user.id)
    .maybeSingle()

  if (!routine) {
    return new Response(JSON.stringify({ error: 'Rotina não encontrada' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch selected meetings
  const { data: meetings } = await supabase
    .from('Meeting')
    .select('id, title, meetingDate, transcription, summary, actionItems')
    .in('id', meetingIds)
    .eq('userId', user.id)
    .eq('status', 'completed')
    .order('meetingDate', { ascending: true })

  if (!meetings || meetings.length === 0) {
    return new Response(JSON.stringify({ error: 'Nenhuma reunião válida selecionada' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const meetingsContext = meetings.map((m, i) => {
    const date = m.meetingDate
      ? new Date(m.meetingDate).toLocaleDateString('pt-BR')
      : `Reunião ${i + 1}`
    let content = ''
    if (m.summary) {
      content = m.summary.replace(/^<!--\s*depth:\w+\s*-->\n?/, '').trim()
    } else if (m.transcription) {
      content = m.transcription.slice(0, 3000)
    }
    const actions = Array.isArray(m.actionItems) && m.actionItems.length > 0
      ? `\nAções: ${m.actionItems.join('; ')}`
      : ''
    return `## Reunião ${i + 1}: ${m.title} (${date})\n${content}${actions}`
  }).join('\n\n---\n\n')

  const prompt = type === 'executivo'
    ? `Você é um assistente especializado em análise de reuniões corporativas em português brasileiro.

Analise as ${meetings.length} reuniões abaixo da rotina "${routine.name}" e gere um **Resumo Executivo Consolidado**:

## Visão Geral da Rotina
Breve contexto sobre o que esta série de reuniões representa.

## Evolução e Progresso
O que mudou entre as reuniões? Quais temas evoluíram?

## Decisões Acumuladas
Todas as decisões importantes tomadas ao longo das reuniões.

## Pendências em Aberto
O que ficou sem resolução ou precisa de atenção?

## Próximos Passos Consolidados
Os passos mais urgentes considerando todas as reuniões.

REUNIÕES:
${meetingsContext}`
    : `Você é um assistente especializado em análise de reuniões corporativas em português brasileiro.

Analise as ${meetings.length} reuniões abaixo da rotina "${routine.name}" e gere uma **Análise de Progresso Detalhada**:

## Linha do Tempo
Para cada reunião, um parágrafo descrevendo o estado naquele momento.

## Evolução por Tema
Agrupe os temas recorrentes e mostre como cada um evoluiu reunião a reunião.

## Decisões Acumuladas
Tabela markdown: | Data | Decisão | Status |
Marque como "Implementada", "Em andamento" ou "Pendente".

## Ações e Responsáveis (Consolidado)
Tabela markdown: | # | Ação | Responsável | Reunião de Origem | Status |
Agrupe ações de todas as reuniões.

## Padrões Identificados
Quais temas se repetem? Quais problemas persistem?

## Recomendações
Com base na evolução, o que deve ser priorizado?

REUNIÕES:
${meetingsContext}`

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
        }),
      }
    )

    if (!geminiResponse.ok) {
      console.error('Gemini error:', await geminiResponse.text())
      return new Response(JSON.stringify({ error: 'Erro ao gerar consolidação' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await geminiResponse.json()
    const consolidatedSummary = result.candidates?.[0]?.content?.parts?.[0]?.text || ''

    await supabase
      .from('Routine')
      .update({ consolidatedSummary, updatedAt: new Date().toISOString() })
      .eq('id', routineId)

    return new Response(
      JSON.stringify({ success: true, summary: consolidatedSummary }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Consolidation error:', error)
    return new Response(JSON.stringify({ error: 'Erro interno ao gerar consolidação' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
