import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_CHUNK_BYTES = 18 * 1024 * 1024

async function transcribeChunk(
  base64Data: string,
  mimeType: string,
  geminiApiKey: string,
  chunkIndex: number,
  totalChunks: number
): Promise<string> {
  const isLastChunk = chunkIndex === totalChunks - 1
  const prompt = totalChunks === 1
    ? `Transcreva este áudio completamente em português brasileiro.
       Inclua marcações de quem está falando quando possível.
       Mantenha a transcrição fiel ao que foi dito, sem resumir.
       Após a transcrição completa, adicione:
       ## Resumo
       (resumo executivo dos pontos principais)
       ## Itens de Ação
       (tarefas e compromissos mencionados, um por linha)`
    : isLastChunk
    ? `Este é o trecho ${chunkIndex + 1} de ${totalChunks} de uma reunião.
       Transcreva este trecho completamente em português brasileiro.
       Inclua marcações de quem está falando quando possível.
       IMPORTANTE: Este é o último trecho. Após a transcrição adicione:
       ## Resumo
       (resumo executivo de TODO o áudio, não só este trecho)
       ## Itens de Ação
       (todas as tarefas mencionadas ao longo de toda a reunião)`
    : `Este é o trecho ${chunkIndex + 1} de ${totalChunks} de uma reunião.
       Transcreva este trecho completamente em português brasileiro.
       Inclua marcações de quem está falando quando possível.
       NÃO adicione resumo nem itens de ação — apenas a transcrição.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: prompt }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Gemini API error (chunk ${chunkIndex + 1}/${totalChunks}):`, errorText)
    throw new Error(`Gemini error: ${response.status}`)
  }

  const result = await response.json()
  return result.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { meetingId, storagePath } = await req.json()
    if (!meetingId || !storagePath) {
      return new Response(JSON.stringify({ error: 'meetingId and storagePath are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('meetings')
      .download(storagePath)

    if (downloadError || !fileData) {
      await supabase.from('Meeting').update({
        status: 'failed',
        errorMessage: `Failed to download file: ${downloadError?.message}`,
        updatedAt: new Date().toISOString(),
      }).eq('id', meetingId)

      return new Response(JSON.stringify({ error: 'Failed to download file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!geminiApiKey) {
      await supabase.from('Meeting').update({
        status: 'failed',
        errorMessage: 'GOOGLE_GEMINI_API_KEY not configured',
        updatedAt: new Date().toISOString(),
      }).eq('id', meetingId)

      return new Response(JSON.stringify({ error: 'Transcription API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Determine MIME type
    const ext = storagePath.split('.').pop()?.toLowerCase() || ''
    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      ogg: 'audio/ogg',
      webm: 'audio/webm',
      mp4: 'video/mp4',
      caf: 'audio/x-caf',
    }
    const mimeType = mimeMap[ext] || 'audio/mpeg'

    // Chunked transcription for large files
    const arrayBuffer = await fileData.arrayBuffer()
    const totalBytes = arrayBuffer.byteLength
    const totalChunks = Math.ceil(totalBytes / MAX_CHUNK_BYTES)
    const chunkTranscriptions: string[] = []

    console.log(`Processing file: ${totalBytes} bytes, ${totalChunks} chunk(s)`)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * MAX_CHUNK_BYTES
      const end = Math.min(start + MAX_CHUNK_BYTES, totalBytes)
      const chunkBuffer = arrayBuffer.slice(start, end)

      const base64Chunk = btoa(
        new Uint8Array(chunkBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      console.log(`Transcribing chunk ${i + 1}/${totalChunks} (${end - start} bytes)`)

      const chunkText = await transcribeChunk(
        base64Chunk, mimeType, geminiApiKey, i, totalChunks
      )
      chunkTranscriptions.push(chunkText)
    }

    const fullTranscriptionText = chunkTranscriptions.join('\n\n')

    // Parse summary and action items from the transcription
    let transcription = fullTranscriptionText
    let summary = null
    let actionItems: string[] = []

    const summaryMatch = fullTranscriptionText.match(/## Resumo\s*\n([\s\S]*?)(?=## Itens de Ação|$)/)
    if (summaryMatch) {
      summary = summaryMatch[1].trim()
      transcription = fullTranscriptionText.split('## Resumo')[0].trim()
    }

    const actionMatch = fullTranscriptionText.match(/## Itens de Ação\s*\n([\s\S]*)$/)
    if (actionMatch) {
      actionItems = actionMatch[1]
        .split('\n')
        .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
        .filter((line: string) => line.length > 0)
    }

    // Update Meeting with transcription
    await supabase.from('Meeting').update({
      status: 'completed',
      transcription,
      summary,
      actionItems,
      updatedAt: new Date().toISOString(),
    }).eq('id', meetingId)

    console.log(`Transcription completed for meeting ${meetingId}`)

    return new Response(JSON.stringify({ success: true, meetingId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Transcription error:', error)

    // Try to mark meeting as failed
    try {
      const { meetingId } = await (async () => {
        // We can't re-read the body, so just extract from error context
        return { meetingId: null }
      })()
      // If we had the meetingId we'd update status, but since we're in catch
      // and body was already consumed, log the error
    } catch (_) {
      // ignore
    }

    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
