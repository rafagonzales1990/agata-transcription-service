import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMBED_MODEL = 'gemini-embedding-001'
const CHAT_MODEL = 'gemini-2.5-flash'

async function embedText(text: string, apiKey: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: 768,
      }),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini embedding error ${res.status}: ${errText}`)
  }
  const json = await res.json()
  const values = json?.embedding?.values
  if (!Array.isArray(values)) throw new Error('Gemini embedding returned no values')
  return values
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Authenticate
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsErr } = await authClient.auth.getClaims(token)
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const authUserId = claims.claims.sub as string

    const body = await req.json()
    const question = (body.question || '').toString().trim()
    const userId = (body.userId || authUserId).toString()
    const meetingIdFilter = body.meetingId ? body.meetingId.toString() : null
    const routineIdFilter = body.routineId ? body.routineId.toString() : null

    if (!question) {
      return new Response(JSON.stringify({ error: 'question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Only allow querying own embeddings
    if (userId !== authUserId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1) Embed the question
    const qEmbedding = await embedText(question, geminiApiKey)
    console.log(`[ask-meeting] question embedding length: ${qEmbedding.length} | user: ${userId}`)

    // 2) Resolve meetingId filter (single meeting or first from routine)
    const supabase = createClient(supabaseUrl, serviceKey)
    let resolvedMeetingId: string | null = meetingIdFilter

    // If routineId provided but no specific meeting, search across all meetings of that routine.
    // Since the RPC supports a single meeting filter, we fetch matches per meeting and merge.
    let matches: Array<{
      chunkText: string
      meetingId: string
      title: string
      createdAt: string
      similarity: number
    }> = []
    let rpcErr: { message: string } | null = null

    if (routineIdFilter && !meetingIdFilter) {
      const { data: routineMeetings, error: rmErr } = await supabase
        .from('Meeting')
        .select('id')
        .eq('userId', userId)
        .eq('routineId', routineIdFilter)
        .eq('status', 'completed')
      if (rmErr) {
        rpcErr = { message: rmErr.message }
      } else {
        const ids = (routineMeetings || []).map((m: { id: string }) => m.id)
        const aggregated: typeof matches = []
        for (const mid of ids) {
          const { data: m, error: e } = await supabase.rpc('match_meeting_embeddings', {
            query_embedding: qEmbedding as unknown as string,
            match_user_id: userId,
            match_count: 3,
            filter_meeting_id: mid,
          })
          if (e) continue
          if (Array.isArray(m)) aggregated.push(...(m as typeof matches))
        }
        // sort desc by similarity, keep top 5
        matches = aggregated
          .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
          .slice(0, 5)
      }
    } else {
      const { data, error } = await supabase.rpc('match_meeting_embeddings', {
        query_embedding: qEmbedding as unknown as string,
        match_user_id: userId,
        match_count: 5,
        filter_meeting_id: resolvedMeetingId,
      })
      if (error) rpcErr = { message: error.message }
      matches = (data || []) as typeof matches
    }

    console.log(`[ask-meeting] RPC returned ${matches?.length ?? 0} matches`)
    if (matches && matches.length > 0) {
      console.log(
        `[ask-meeting] similarities:`,
        (matches as Array<{ similarity: number; meetingId: string }>).map(
          (m) => `${m.meetingId.slice(0, 8)}=${m.similarity.toFixed(4)}`
        )
      )
    }

    if (rpcErr) {
      console.error('RPC error:', rpcErr)
      return new Response(JSON.stringify({ error: 'Search failed', details: rpcErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const chunks = (matches || []) as Array<{
      chunkText: string
      meetingId: string
      title: string
      createdAt: string
      similarity: number
    }>

    if (chunks.length === 0) {
      return new Response(
        JSON.stringify({
          answer:
            'Não encontrei essa informação nas reuniões disponíveis. Verifique se há reuniões transcritas no seu histórico.',
          sources: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3) Fetch conflicts for this meeting (single-meeting mode only)
    let conflictContext = ''
    if (meetingIdFilter) {
      const { data: conflicts } = await supabase
        .from('MeetingConflict')
        .select('conflictDescription, severity, conflictType, conflictingMeetingId')
        .eq('meetingId', meetingIdFilter)

      if (conflicts && conflicts.length > 0) {
        conflictContext = `
CONFLITOS DETECTADOS COM OUTRAS REUNIÕES:
${conflicts.map((c: any) => `- [${c.severity.toUpperCase()}] ${c.conflictDescription} (Reunião: ${c.conflictingMeetingId})`).join('\n')}

Quando o usuário perguntar sobre decisões, estratégias ou compromissos,
considere esses conflitos na sua resposta e mencione-os quando relevante.
`
      }
    }

    // 4) Build context
    const context = chunks
      .map((c, i) => {
        const date = formatDate(c.createdAt)
        return `[Trecho ${i + 1} - Reunião: "${c.title}" - Data: ${date}]\n${c.chunkText}`
      })
      .join('\n\n---\n\n')

    const prompt = `Você é um assistente que responde perguntas sobre reuniões transcritas.
${conflictContext}
Contexto das reuniões:
${context}

Pergunta: ${question}

Responda em português brasileiro de forma clara e direta.
Se a informação não estiver no contexto, diga que não encontrou essa informação nas reuniões disponíveis.
Sempre cite o nome e a data da reunião de onde veio a informação.`

    // 4) Call Gemini chat
    const chatRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
      }
    )

    if (!chatRes.ok) {
      const errText = await chatRes.text()
      console.error('Gemini chat error:', errText)
      return new Response(JSON.stringify({ error: `Gemini error: ${chatRes.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const chatJson = await chatRes.json()
    const answer =
      chatJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      'Não foi possível gerar uma resposta.'

    // Dedupe sources by meetingId
    const seen = new Set<string>()
    const sources = chunks
      .filter((c) => {
        if (seen.has(c.meetingId)) return false
        seen.add(c.meetingId)
        return true
      })
      .map((c) => ({ meetingId: c.meetingId, title: c.title, date: c.createdAt }))

    return new Response(JSON.stringify({ answer, sources }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('ask-meeting error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
