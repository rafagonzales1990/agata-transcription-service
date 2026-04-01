import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i])
    }
    const base64Data = btoa(binary)

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

    // Call Gemini API for transcription
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: `Transcreva este áudio/vídeo completamente em português brasileiro. 
Inclua marcações de quem está falando quando possível (ex: "Participante 1:", "Participante 2:").
Mantenha a transcrição fiel ao que foi dito, sem resumir.
Após a transcrição completa, adicione uma seção "## Resumo" com um resumo executivo dos pontos principais.
Depois adicione uma seção "## Itens de Ação" listando as tarefas e compromissos mencionados.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      await supabase.from('Meeting').update({
        status: 'failed',
        errorMessage: `Transcription API error: ${geminiResponse.status}`,
        updatedAt: new Date().toISOString(),
      }).eq('id', meetingId)

      return new Response(JSON.stringify({ error: 'Transcription failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiResult = await geminiResponse.json()
    const transcriptionText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse summary and action items from the transcription
    let transcription = transcriptionText
    let summary = null
    let actionItems: string[] = []

    const summaryMatch = transcriptionText.match(/## Resumo\s*\n([\s\S]*?)(?=## Itens de Ação|$)/)
    if (summaryMatch) {
      summary = summaryMatch[1].trim()
      transcription = transcriptionText.split('## Resumo')[0].trim()
    }

    const actionMatch = transcriptionText.match(/## Itens de Ação\s*\n([\s\S]*)$/)
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

    return new Response(JSON.stringify({ success: true, meetingId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
