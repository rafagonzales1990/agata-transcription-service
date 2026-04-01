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
  const prompt = `Transcreva este áudio completamente em português brasileiro.
       Inclua marcações de quem está falando quando possível.
       Mantenha a transcrição fiel ao que foi dito, sem resumir.
       Após a transcrição completa, adicione:
       ## Resumo
       (resumo executivo dos pontos principais)
       ## Itens de Ação
       (tarefas e compromissos mencionados, um por linha)`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-002:generateContent?key=${geminiApiKey}`,
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
    console.error(`Gemini API error:`, errorText)
    throw new Error(`Gemini error: ${response.status}`)
  }

  const result = await response.json()
  return result.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let meetingId: string | null = null

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    meetingId = body.meetingId
    const storagePath = body.storagePath

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

    // TEMPORARY: List available models
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`
    )
    const modelsData = await modelsResponse.json()
    console.log('Available models:', JSON.stringify(modelsData.models?.map((m: any) => m.name)))

    return new Response(JSON.stringify({ models: modelsData.models?.map((m: any) => m.name) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

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

    // Transcribe based on file size
    const arrayBuffer = await fileData.arrayBuffer()
    const totalBytes = arrayBuffer.byteLength
    let fullTranscriptionText = ''

    if (totalBytes <= MAX_CHUNK_BYTES) {
      // Small file: use inline_data
      console.log(`Small file (${totalBytes} bytes), using inline_data`)
      const base64Data = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
      fullTranscriptionText = await transcribeChunk(
        base64Data, mimeType, geminiApiKey, 0, 1
      )
    } else {
      // Large file: upload via Gemini Files API
      console.log(`Large file (${totalBytes} bytes), using Gemini Files API`)

      const uploadResponse = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': mimeType,
            'X-Goog-Upload-Protocol': 'raw',
            'X-Goog-Upload-Header-Content-Length': totalBytes.toString(),
            'X-Goog-Upload-Header-Content-Type': mimeType,
          },
          body: new Uint8Array(arrayBuffer),
        }
      )

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text()
        console.error('Gemini file upload error:', errText)
        throw new Error(`Gemini file upload failed: ${uploadResponse.status}`)
      }

      const uploadResult = await uploadResponse.json()
      const fileUri = uploadResult.file?.uri
      if (!fileUri) throw new Error('Gemini file upload did not return a URI')

      console.log(`File uploaded to Gemini: ${fileUri}`)

      // Wait for file to be processed
      await new Promise(resolve => setTimeout(resolve, 3000))

      const prompt = `Transcreva este áudio completamente em português brasileiro.
         Inclua marcações de quem está falando quando possível.
         Mantenha a transcrição fiel ao que foi dito, sem resumir.
         Após a transcrição completa, adicione:
         ## Resumo
         (resumo executivo dos pontos principais)
         ## Itens de Ação
         (tarefas e compromissos mencionados, um por linha)`

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-002:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { file_data: { mime_type: mimeType, file_uri: fileUri } },
                { text: prompt }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
          })
        }
      )

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text()
        console.error('Gemini transcription error:', errText)
        throw new Error(`Gemini transcription failed: ${geminiResponse.status}`)
      }

      const geminiResult = await geminiResponse.json()
      fullTranscriptionText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    // Parse summary and action items
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

    if (meetingId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase.from('Meeting').update({
          status: 'failed',
          errorMessage: (error as Error).message,
          updatedAt: new Date().toISOString(),
        }).eq('id', meetingId)
      } catch (_) {
        console.error('Failed to update meeting status to failed')
      }
    }

    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
