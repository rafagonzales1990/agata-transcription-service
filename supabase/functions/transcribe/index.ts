import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_CHUNK_BYTES = 4 * 1024 * 1024
const GEMINI_MODEL = 'gemini-2.0-flash'

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 3,
  retryDelayMs = 2000
): Promise<Response> {
  let lastError: unknown = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 90000)
      let response: Response
      try {
        response = await fetch(url, { ...init, signal: controller.signal })
        clearTimeout(timeout)
      } catch (err) {
        clearTimeout(timeout)
        throw err
      }
      if (response.status === 503 || response.status === 429) {
        if (attempt === maxRetries) return response
        console.warn(`Gemini ${response.status}, retry ${attempt + 1}/${maxRetries} in ${retryDelayMs}ms`)
        await new Promise(r => setTimeout(r, retryDelayMs))
        continue
      }
      return response
    } catch (err) {
      lastError = err
      if (attempt === maxRetries) throw err
      console.warn(`Gemini fetch error, retry ${attempt + 1}/${maxRetries}:`, err)
      await new Promise(r => setTimeout(r, retryDelayMs))
    }
  }
  throw lastError ?? new Error('fetchWithRetry exhausted')
}

const TRANSCRIPTION_PROMPT = `No início da sua resposta, antes da transcrição, adicione uma linha:
DURACAO_SEGUNDOS: [número inteiro de segundos do áudio]

Depois transcreva este áudio completamente em português brasileiro.
       Inclua marcações de quem está falando quando possível.
       Mantenha a transcrição fiel ao que foi dito, sem resumir.
       Após a transcrição completa, adicione:
       ## Resumo
       (resumo executivo dos pontos principais)
       ## Itens de Ação
       (tarefas e compromissos mencionados, um por linha)`

function removePromptLeaks(text: string): string {
  return text
    .replace(/DURACAO_SEGUNDOS:\s*\d+\n?/i, '')
    .replace(/^.*DURACAO_SEGUNDOS.*\n?/gim, '')
    .replace(/^No início da sua resposta, antes da transcrição, adicione uma linha:\s*\n?/gim, '')
    .replace(/^Depois transcreva este áudio completamente em português brasileiro\.?\s*\n?/gim, '')
    .replace(/^Transcreva este áudio completamente em português brasileiro\.?\s*\n?/gim, '')
    .replace(/^Inclua marcações de quem está falando quando possível\.?\s*\n?/gim, '')
    .replace(/^Mantenha a transcrição fiel ao que foi dito, sem resumir\.?\s*\n?/gim, '')
    .replace(/^Após a transcrição completa, adicione:\s*\n?/gim, '')
    .replace(/^\(resumo executivo dos pontos principais\)\s*\n?/gim, '')
    .replace(/^\(tarefas e compromissos mencionados, um por linha\)\s*\n?/gim, '')
    .trim()
}

async function transcribeChunk(
  base64Data: string,
  mimeType: string,
  geminiApiKey: string,
  chunkIndex: number,
  totalChunks: number
): Promise<string> {
  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: TRANSCRIPTION_PROMPT }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 16384 }
      })
    }
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`Gemini error ${response.status}:`, errorBody)
    throw new Error(`Gemini error ${response.status}: ${errorBody.substring(0, 500)}`)
  }

  const result = await response.json()
  return result.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function transcribeWithGroq(
  arrayBuffer: ArrayBuffer,
  mimeType: string,
  fileName: string,
  groqApiKey: string
): Promise<string> {
  const formData = new FormData()
  const blob = new Blob([arrayBuffer], { type: mimeType })
  formData.append('file', blob, fileName)
  formData.append('model', 'whisper-large-v3')
  formData.append('language', 'pt')
  formData.append('response_format', 'text')

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqApiKey}` },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq error ${response.status}: ${err.substring(0, 300)}`)
  }

  const text = await response.text()
  return `## Transcrição\n${text}\n\n## Resumo\n(Resumo não disponível — gerado via fallback Groq)\n\n## Itens de Ação\n`
}

async function waitForFileActive(fileUri: string, geminiApiKey: string): Promise<void> {
  const fileName = fileUri.split('/').pop()
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000))
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileName}?key=${geminiApiKey}`)
      if (res.ok) {
        const data = await res.json()
        console.log(`File state (attempt ${i + 1}): ${data?.state}`)
        if (data?.state === 'ACTIVE') return
        if (data?.state === 'FAILED') throw new Error('Gemini file processing failed')
      }
    } catch (err) { console.warn(`Polling error attempt ${i+1}:`, err) }
  }
  console.warn('File polling timed out, proceeding anyway')
}

async function transcribeWithOpenAI(
  arrayBuffer: ArrayBuffer,
  mimeType: string,
  fileName: string,
  openaiApiKey: string
): Promise<string> {
  const formData = new FormData()
  const blob = new Blob([arrayBuffer], { type: mimeType })
  formData.append('file', blob, fileName)
  formData.append('model', 'whisper-1')
  formData.append('language', 'pt')
  formData.append('response_format', 'text')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiApiKey}` },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI Whisper error ${response.status}: ${err.substring(0, 300)}`)
  }

  const text = await response.text()
  return `## Transcrição\n${text}\n\n## Resumo\n(Resumo gerado via OpenAI Whisper — fallback automático)\n\n## Itens de Ação\n`
}

async function processTranscription(
  meetingId: string,
  storagePath: string,
  supabase: any,
  geminiApiKey: string
): Promise<void> {
  try {
    // Rate limiting: max 10 transcription attempts per user per hour
    const { data: meetingOwner } = await supabase
      .from('Meeting')
      .select('userId')
      .eq('id', meetingId)
      .maybeSingle()

    if (meetingOwner?.userId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('Meeting')
        .select('*', { count: 'exact', head: true })
        .eq('userId', meetingOwner.userId)
        .in('status', ['processing', 'completed', 'failed'])
        .gte('createdAt', oneHourAgo)

      if ((count || 0) >= 10) {
        await supabase.from('Meeting').update({
          status: 'failed',
          errorMessage: 'Limite de transcrições por hora atingido',
          updatedAt: new Date().toISOString(),
        }).eq('id', meetingId)
        await supabase.channel('meeting-status').send({
          type: 'broadcast',
          event: 'transcription_update',
          payload: { meetingId, status: 'failed' },
        })
        return
      }

      // Plan limit enforcement: check minutes used vs plan limit
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: usageData } = await supabase
        .from('Usage')
        .select('totalMinutesTranscribed, currentMonth')
        .eq('userId', meetingOwner.userId)
        .maybeSingle()

      const { data: userData } = await supabase
        .from('User')
        .select('planId')
        .eq('id', meetingOwner.userId)
        .maybeSingle()

      const planId = userData?.planId || 'basic'
      const { data: planData } = await supabase
        .from('Plan')
        .select('maxDurationMinutes')
        .eq('id', planId)
        .maybeSingle()

      // null maxDurationMinutes = unlimited (Enterprise)
      if (planData?.maxDurationMinutes != null) {
        const minutesUsed = (usageData?.currentMonth === currentMonth)
          ? (usageData?.totalMinutesTranscribed || 0)
          : 0

        if (minutesUsed >= planData.maxDurationMinutes) {
          await supabase.from('Meeting').update({
            status: 'failed',
            errorMessage: 'Limite de minutos do plano atingido',
            updatedAt: new Date().toISOString(),
          }).eq('id', meetingId)
          await supabase.channel('meeting-status').send({
            type: 'broadcast',
            event: 'transcription_update',
            payload: { meetingId, status: 'failed' },
          })
          return
        }
      }
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

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
      await supabase.channel('meeting-status').send({
        type: 'broadcast',
        event: 'transcription_update',
        payload: { meetingId, status: 'failed' },
      })
      return
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
      mkv: 'video/x-matroska',
      avi: 'video/x-msvideo',
    }
    const mimeType = mimeMap[ext] || 'audio/mpeg'
    // Para arquivos webm do app desktop, forçar como video/webm
    // pois o Gemini rejeita audio/webm com codec de vídeo
    const effectiveMimeType = (ext === 'webm') ? 'video/webm' : mimeType

    // Transcribe based on file size
    const arrayBuffer = await fileData.arrayBuffer()
    const totalBytes = arrayBuffer.byteLength
    let fullTranscriptionText = ''

    if (totalBytes <= MAX_CHUNK_BYTES) {
      console.log(`Small file (${totalBytes} bytes), using inline_data`)
      const base64Data = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
      try {
        fullTranscriptionText = await transcribeChunk(
          base64Data, effectiveMimeType, geminiApiKey, 0, 1
        )
      } catch (geminiErr) {
        console.warn('Gemini falhou para arquivo pequeno, usando OpenAI Whisper:', (geminiErr as Error).message)
        if (!openaiApiKey) throw geminiErr
        const fileName = storagePath.split('/').pop() || 'audio'
        fullTranscriptionText = await transcribeWithOpenAI(arrayBuffer, effectiveMimeType, fileName, openaiApiKey)
        console.log('OpenAI Whisper fallback concluído com sucesso')
      }
    } else {
      console.log(`Large file (${totalBytes} bytes), using Gemini Files API`)

      try {
        const uploadResponse = await fetch(
          `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': effectiveMimeType,
              'X-Goog-Upload-Protocol': 'raw',
              'X-Goog-Upload-Header-Content-Length': totalBytes.toString(),
              'X-Goog-Upload-Header-Content-Type': effectiveMimeType,
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

        await waitForFileActive(fileUri, geminiApiKey)

        const geminiResponse = await fetchWithRetry(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { file_data: { mime_type: effectiveMimeType, file_uri: fileUri } },
                  { text: TRANSCRIPTION_PROMPT }
                ]
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 16384 }
            })
          }
        )

        if (!geminiResponse.ok) {
          const errText = await geminiResponse.text()
          console.error(`Gemini transcription error ${geminiResponse.status}:`, errText)
          throw new Error(`Gemini transcription failed ${geminiResponse.status}: ${errText.substring(0, 500)}`)
        }

        const geminiResult = await geminiResponse.json()
        fullTranscriptionText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || ''
      } catch (geminiErr) {
        console.warn('Gemini falhou para arquivo grande, usando OpenAI Whisper:', (geminiErr as Error).message)
        if (!openaiApiKey) throw geminiErr
        const fileName = storagePath.split('/').pop() || 'audio'
        fullTranscriptionText = await transcribeWithOpenAI(arrayBuffer, effectiveMimeType, fileName, openaiApiKey)
        console.log('OpenAI Whisper fallback concluído com sucesso')
      }
    }

    // Parse real duration from Gemini response
    let realDurationSeconds = 0
    const durationMatch = fullTranscriptionText.match(/DURACAO_SEGUNDOS:\s*(\d+)/)
    if (durationMatch) {
      realDurationSeconds = parseInt(durationMatch[1], 10)
    }

    fullTranscriptionText = removePromptLeaks(
      fullTranscriptionText
        .replace(/DURACAO_SEGUNDOS:\s*\d+\n?/i, '')
        .replace(/^.*DURACAO_SEGUNDOS.*\n?/gim, '')
        .trim()
    )

    const actualMinutes = realDurationSeconds > 0
      ? Math.max(1, Math.ceil(realDurationSeconds / 60))
      : Math.max(1, Math.round(totalBytes / 16000 / 60))

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
    const { data: meetingData } = await supabase.from('Meeting').select('userId').eq('id', meetingId).maybeSingle()

    await supabase.from('Meeting').update({
      status: 'completed',
      transcription,
      summary,
      actionItems,
      fileDuration: realDurationSeconds > 0 ? realDurationSeconds : null,
      updatedAt: new Date().toISOString(),
    }).eq('id', meetingId)

    // Update usage counter (single source of truth)
    if (meetingData?.userId) {
      const currentMonth = new Date().toISOString().slice(0, 7)

      const { data: existingUsage } = await supabase
        .from('Usage')
        .select('id, transcriptionsUsed, totalMinutesTranscribed, currentMonth')
        .eq('userId', meetingData.userId)
        .maybeSingle()

      if (existingUsage) {
        if (existingUsage.currentMonth === currentMonth) {
          await supabase.from('Usage').update({
            transcriptionsUsed: (existingUsage.transcriptionsUsed || 0) + 1,
            totalMinutesTranscribed: (existingUsage.totalMinutesTranscribed || 0) + actualMinutes,
            updatedAt: new Date().toISOString(),
          }).eq('id', existingUsage.id)
        } else {
          await supabase.from('Usage').update({
            transcriptionsUsed: 1,
            totalMinutesTranscribed: actualMinutes,
            currentMonth: currentMonth,
            updatedAt: new Date().toISOString(),
          }).eq('id', existingUsage.id)
        }
      } else {
        await supabase.from('Usage').insert({
          userId: meetingData.userId,
          transcriptionsUsed: 1,
          currentMonth: currentMonth,
          totalMinutesTranscribed: actualMinutes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
    }

    // Log transcription to TranscriptionLog
    if (meetingData?.userId) {
      try {
        await supabase.from('TranscriptionLog').insert({
          meetingId,
          userId: meetingData.userId,
          provider: 'gemini',
          durationSecs: realDurationSeconds > 0 ? realDurationSeconds : Math.round(totalBytes / 16000),
          fileSizeBytes: totalBytes,
          chunks: 1,
          costCents: 0,
          success: true,
          createdAt: new Date().toISOString(),
        })
      } catch (logErr) {
        console.error('Failed to insert TranscriptionLog:', logErr)
      }
    }

    // Send transcription done email
    if (meetingData?.userId) {
      try {
        const { data: userData } = await supabase
          .from('User')
          .select('email, name')
          .eq('id', meetingData.userId)
          .maybeSingle()

        if (userData) {
          const { data: meetingInfo } = await supabase
            .from('Meeting')
            .select('title')
            .eq('id', meetingId)
            .maybeSingle()

          await supabase.functions.invoke('send-email', {
            body: {
              type: 'transcription_done',
              to: userData.email,
              data: {
                name: userData.name || 'Usuário',
                meetingTitle: meetingInfo?.title || 'Reunião',
                meetingId,
              }
            }
          })
        }
      } catch (emailErr) {
        console.error('Failed to send transcription email:', emailErr)
      }
    }

    console.log(`Transcription completed for meeting ${meetingId}`)

    // Fire-and-forget: generate embeddings for semantic search ("Ask Me Anything")
    if (meetingData?.userId) {
      supabase.functions
        .invoke('generate-embeddings', {
          body: { meetingId, userId: meetingData.userId },
        })
        .catch((embedErr) => {
          console.error('Failed to invoke generate-embeddings:', embedErr)
        })
    }

    await supabase.channel('meeting-status').send({
      type: 'broadcast',
      event: 'transcription_update',
      payload: { meetingId, status: 'completed' },
    })
  } catch (error) {
    console.error('Transcription error:', error)
    try {
      await supabase.from('Meeting').update({
        status: 'failed',
        errorMessage: (error as Error).message,
        updatedAt: new Date().toISOString(),
      }).eq('id', meetingId)
      await supabase.channel('meeting-status').send({
        type: 'broadcast',
        event: 'transcription_update',
        payload: { meetingId, status: 'failed' },
      })
    } catch (_) {
      console.error('Failed to update meeting status to failed')
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json()
  const meetingId = body.meetingId
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

  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: 'Transcription API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  await supabase.from('Meeting').update({
    status: 'processing',
    updatedAt: new Date().toISOString(),
  }).eq('id', meetingId)

  EdgeRuntime.waitUntil(processTranscription(meetingId, storagePath, supabase, geminiApiKey))

  return new Response(
    JSON.stringify({ success: true, status: 'processing', meetingId }),
    { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
