import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEMO_PROMPT = (title: string, text: string) => `Você é um assistente especializado em criar resumos de reuniões corporativas
em português brasileiro. A transcrição é de uma reunião intitulada "${title}".
Use formatação Markdown rica.

Crie um **Resumo Executivo** conciso (máximo 300 palavras):

## Resumo Executivo
Parágrafo resumindo contexto e objetivo.

### Decisões-Chave
3 a 5 decisões mais importantes em bullet points.

### Próximos Passos Críticos
2 a 3 próximos passos mais urgentes.

Transcrição:
${text}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { text, audioPath, title, leadId, fileName, fileSize } = await req.json()

    let transcriptionText = text

    // If audio was uploaded, transcribe it first
    if (audioPath && !text) {
      // Download audio from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('meetings')
        .download(audioPath)

      if (downloadError) throw new Error('Failed to download audio: ' + downloadError.message)

      // Use Gemini for transcription (simple approach for demo)
      const audioBytes = await fileData.arrayBuffer()
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBytes)))

      const mimeType = fileName?.endsWith('.mp3') ? 'audio/mp3'
        : fileName?.endsWith('.wav') ? 'audio/wav'
        : fileName?.endsWith('.m4a') ? 'audio/mp4'
        : 'audio/mpeg'

      const transcribeResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType, data: base64Audio } },
                { text: 'Transcreva este áudio em português brasileiro de forma completa e precisa. Retorne apenas a transcrição, sem comentários.' },
              ],
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 4000 },
          }),
        }
      )

      if (!transcribeResponse.ok) {
        const err = await transcribeResponse.text()
        console.error('Transcription error:', err)
        throw new Error('Transcription failed')
      }

      const transcribeResult = await transcribeResponse.json()
      transcriptionText = transcribeResult.candidates?.[0]?.content?.parts?.[0]?.text || ''

      if (!transcriptionText) throw new Error('Empty transcription')

      // Clean up demo audio file after transcription
      await supabase.storage.from('meetings').remove([audioPath])
    }

    if (!transcriptionText || transcriptionText.length < 30) {
      return new Response(JSON.stringify({ error: 'Text too short' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate summary with Gemini
    const prompt = DEMO_PROMPT(title || 'Demo', transcriptionText.slice(0, 5000))

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini error:', errText)
      throw new Error('Summary generation failed')
    }

    const geminiResult = await geminiResponse.json()
    const summaryText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Optionally create a demo Meeting record (not tied to any user)
    // This allows tracking and can be linked to lead
    let meetingId = null
    try {
      const { data: meeting } = await supabase.from('Meeting').insert({
        title: title || 'Demo Meeting',
        transcription: transcriptionText.slice(0, 5000),
        summary: `<!-- depth:executivo -->\n${summaryText}`,
        status: 'completed',
        userId: 'demo', // special marker for demo meetings
        cloudStoragePath: audioPath || 'demo-text',
        fileName: fileName || 'demo-text.txt',
        fileSize: fileSize || transcriptionText.length,
        visibility: 'private',
      }).select('id').single()
      meetingId = meeting?.id
    } catch (e) {
      console.error('Failed to create demo meeting record:', e)
      // Non-critical, continue
    }

    // Send demo-ready email if lead has email
    if (leadId) {
      try {
        const { data: lead } = await supabase.from('Lead').select('email, name').eq('id', leadId).single()
        if (lead?.email) {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'demo-ready',
              to: lead.email,
              data: { name: lead.name || 'Visitante', summaryPreview: summaryText.slice(0, 200) },
            }
          })
        }
      } catch (e) {
        console.error('Failed to send demo email:', e)
      }
    }

    return new Response(JSON.stringify({ status: 'completed', summary: summaryText, meetingId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Demo summary error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
