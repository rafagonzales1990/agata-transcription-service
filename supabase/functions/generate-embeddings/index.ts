import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHUNK_SIZE = 500       // words per chunk
const CHUNK_OVERLAP = 50     // word overlap between chunks
const EMBED_MODEL = 'gemini-embedding-001'

function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const chunks: string[] = []
  const step = Math.max(1, size - overlap)
  for (let i = 0; i < words.length; i += step) {
    const slice = words.slice(i, i + size).join(' ')
    if (slice.trim().length > 0) chunks.push(slice)
    if (i + size >= words.length) break
  }
  return chunks
}

async function embedChunk(text: string, apiKey: string): Promise<number[]> {
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
        taskType: 'RETRIEVAL_DOCUMENT',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { meetingId, userId } = await req.json()
    if (!meetingId || !userId) {
      return new Response(
        JSON.stringify({ error: 'meetingId and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch transcription
    const { data: meeting, error: meetingErr } = await supabase
      .from('Meeting')
      .select('id, transcription, userId')
      .eq('id', meetingId)
      .maybeSingle()

    if (meetingErr || !meeting) {
      return new Response(
        JSON.stringify({ error: 'Meeting not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const transcription = (meeting.transcription || '').trim()
    if (!transcription) {
      return new Response(
        JSON.stringify({ success: true, chunks: 0, message: 'Empty transcription' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete any existing embeddings for this meeting (upsert behavior)
    await supabase.from('MeetingEmbedding').delete().eq('meetingId', meetingId)

    const chunks = chunkText(transcription)
    console.log(`Generating embeddings for meeting ${meetingId}: ${chunks.length} chunks`)

    let inserted = 0
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await embedChunk(chunks[i], geminiApiKey)
        const { error: insertErr } = await supabase.from('MeetingEmbedding').insert({
          meetingId,
          userId,
          chunkIndex: i,
          chunkText: chunks[i],
          embedding: embedding as unknown as string,
        })
        if (insertErr) {
          console.error(`Insert error chunk ${i}:`, insertErr)
        } else {
          inserted++
        }
      } catch (chunkErr) {
        console.error(`Embedding error chunk ${i}:`, chunkErr)
      }
    }

    console.log(`Embeddings done for ${meetingId}: ${inserted}/${chunks.length}`)

    return new Response(
      JSON.stringify({ success: true, chunks: inserted, total: chunks.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('generate-embeddings error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
