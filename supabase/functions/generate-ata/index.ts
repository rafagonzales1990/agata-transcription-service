import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PAID_PLANS = ['inteligente', 'automacao', 'enterprise']

const templateLabels: Record<string, string> = {
  geral: 'Ata Geral',
  juridico_audiencia: 'Ata de Audiência',
  juridico_entrevista: 'Ata Jurídica - Entrevista',
  rh_entrevista: 'Ata RH - Entrevista',
  rh_pdi: 'Ata RH - PDI',
  marketing_estrategia: 'Ata Marketing - Estratégia',
  marketing_planejamento: 'Ata Marketing - Planejamento',
  engenharia_projetos: 'Ata Engenharia - Projetos',
  engenharia_obra: 'Ata Engenharia - Obra',
  ti_sprint: 'Ata TI - Sprint',
  financeiro: 'Ata Financeiro',
  comercial: 'Ata Comercial',
}

const CSS = `
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333; padding: 20px; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
.main-title { font-size: 16pt; font-weight: bold; color: #065F46; }
.header-line { border-top: 3px solid #10B981; margin: 10px 0 15px 0; }
.info-table td { padding: 6px 10px; border: 1px solid #10B981; }
.info-table td:first-child { background: #D1FAE5; font-weight: bold; color: #065F46; width: 140px; }
h2 { color: #10B981; font-size: 11pt; border-bottom: 1px solid #10B981; padding-bottom: 3px; }
h3 { color: #065F46; font-size: 10pt; }
.ata-table th { background: #D1FAE5; color: #065F46; font-weight: bold; }
.ata-table th, .ata-table td { border: 1px solid #10B981; padding: 6px 8px; }
.ata-table tr:nth-child(even) td { background: #F0FDF4; }
.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-45deg); font-size: 80pt; color: rgba(16,185,129,0.15); font-weight: bold; z-index: -1; }
table { border-collapse: collapse; width: 100%; margin: 10px 0; }
ul, ol { padding-left: 20px; }
li { margin-bottom: 4px; }
strong { color: #065F46; }
`

function markdownToHtml(md: string): string {
  let html = md
    // Tables
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_match, header, body) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean)
      const rows = body.trim().split('\n').map((row: string) =>
        row.split('|').map((c: string) => c.trim()).filter(Boolean)
      )
      let table = '<table class="ata-table"><thead><tr>'
      headers.forEach((h: string) => { table += `<th>${h}</th>` })
      table += '</tr></thead><tbody>'
      rows.forEach((row: string[]) => {
        table += '<tr>'
        row.forEach((c: string) => { table += `<td>${c}</td>` })
        table += '</tr>'
      })
      table += '</tbody></table>'
      return table
    })
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Paragraphs for remaining lines
    .replace(/^(?!<[hultro])(.+)$/gm, '<p>$1</p>')
    // Clean up
    .replace(/\n{2,}/g, '\n')

  return html
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

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { meetingId, template } = await req.json()
    if (!meetingId || !template || !templateLabels[template]) {
      return new Response(JSON.stringify({ error: 'meetingId and valid template required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check plan + branding
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_id')
      .eq('user_id', user.id)
      .single()

    const planId = profile?.plan_id || 'basic'
    const showWatermark = !PAID_PLANS.includes(planId)

    let brandName = 'Ágata Transcription'
    let brandColor = '#10B981'
    let brandSecondaryColor = '#065F46'

    // Enterprise branding
    const { data: userData } = await supabase
      .from('User')
      .select('planId, teamId')
      .eq('id', user.id)
      .single()

    if (userData?.planId === 'enterprise' && userData?.teamId) {
      const { data: team } = await supabase
        .from('Team')
        .select('name, companyName, primaryColor, secondaryColor')
        .eq('id', userData.teamId)
        .single()

      if (team) {
        brandName = team.companyName || team.name || 'Ágata Transcription'
        brandColor = team.primaryColor || '#10B981'
        brandSecondaryColor = team.secondaryColor || '#065F46'
      }
    }

    // Fetch meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('Meeting')
      .select('title, summary, userId, meetingDate, meetingTime, location, responsible, participants')
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

    if (!meeting.summary) {
      return new Response(JSON.stringify({ error: 'No summary available. Generate a summary first.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Strip metadata prefix
    let summaryContent = meeting.summary
    const metaMatch = summaryContent.match(/^<!-- depth:\w+ -->\n/)
    if (metaMatch) {
      summaryContent = summaryContent.slice(metaMatch[0].length)
    }

    const date = meeting.meetingDate
      ? new Date(meeting.meetingDate).toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR')

    const contentHtml = markdownToHtml(summaryContent)

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>${CSS}</style>
</head>
<body>
${showWatermark ? '<div class="watermark">ÁGATA</div>' : ''}
<div class="header">
  <div class="main-title">${templateLabels[template]}</div>
  <div style="font-size:9pt;color:#666;">${brandName}</div>
</div>
<div class="header-line"></div>
<table class="info-table">
  <tr><td>Título</td><td>${meeting.title}</td></tr>
  <tr><td>Data</td><td>${date}${meeting.meetingTime ? ' · ' + meeting.meetingTime : ''}</td></tr>
  ${meeting.location ? `<tr><td>Local</td><td>${meeting.location}</td></tr>` : ''}
  ${meeting.responsible ? `<tr><td>Responsável</td><td>${meeting.responsible}</td></tr>` : ''}
  ${meeting.participants?.length ? `<tr><td>Participantes</td><td>${meeting.participants.join(', ')}</td></tr>` : ''}
</table>
${contentHtml}
</body>
</html>`

    // Update meeting with template
    await supabase.from('Meeting').update({
      ataTemplate: template,
      updatedAt: new Date().toISOString(),
    }).eq('id', meetingId)

    return new Response(JSON.stringify({ html }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Generate ATA error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
