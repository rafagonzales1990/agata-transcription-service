import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// docx via esm.sh
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat, Header, ImageRun,
} from 'https://esm.sh/docx@8.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PAID_PLANS = ['inteligente', 'automacao', 'enterprise']

const AGATA_LOGO_URL = 'https://hblczvmpyaznbxvdcaze.supabase.co/storage/v1/object/public/assets/logo_transparent.png'

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

// Colors
const GREEN_DARK = '065F46'
const GREEN_MID = '059669'
const GREEN_LIGHT = 'D1FAE5'
const GREEN_PALE = 'F0FDF4'
const GREEN_BORDER = 'A7F3D0'
const WHITE = 'FFFFFF'

const border = { style: BorderStyle.SINGLE, size: 1, color: GREEN_BORDER }
const borders = { top: border, bottom: border, left: border, right: border }
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 }

// Page content width A4 with 2cm margins: 11906 - 2268 - 2268 = 7370 DXA
const PAGE_WIDTH = 7370

function applyInlineRuns(text: string): TextRun[] {
  const runs: TextRun[] = []
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, color: GREEN_DARK }))
    } else if (part) {
      runs.push(new TextRun({ text: part }))
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text: '' })]
}

function makeInfoTable(rows: { label: string; value: string }[]): Table {
  const labelWidth = 1800
  const valueWidth = PAGE_WIDTH - labelWidth
  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: [labelWidth, valueWidth],
    rows: rows.map(({ label, value }) =>
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: labelWidth, type: WidthType.DXA },
            margins: cellMargins,
            shading: { fill: GREEN_LIGHT, type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: GREEN_DARK, size: 18 })] })],
          }),
          new TableCell({
            borders,
            width: { size: valueWidth, type: WidthType.DXA },
            margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 18 })] })],
          }),
        ],
      })
    ),
  })
}

function makeActionsTable(headers: string[], rows: string[][]): Table {
  const colCount = headers.length
  const colWidth = Math.floor(PAGE_WIDTH / colCount)
  const lastColWidth = PAGE_WIDTH - colWidth * (colCount - 1)
  const colWidths = headers.map((_, i) => (i === colCount - 1 ? lastColWidth : colWidth))

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        borders,
        width: { size: colWidths[i], type: WidthType.DXA },
        margins: cellMargins,
        shading: { fill: GREEN_MID, type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: WHITE, size: 18 })] })],
      })
    ),
  })

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) =>
        new TableCell({
          borders,
          width: { size: colWidths[ci], type: WidthType.DXA },
          margins: cellMargins,
          shading: { fill: ri % 2 === 0 ? WHITE : GREEN_PALE, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: applyInlineRuns(cell) })],
        })
      ),
    })
  )

  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  })
}

function makeCardParagraphs(lines: string[]): Paragraph[] {
  return lines
    .filter(l => l.trim())
    .map(line => {
      const content = line.replace(/^[-*] /, '')
      return new Paragraph({
        indent: { left: 280 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: GREEN_MID, space: 4 } },
        spacing: { before: 40, after: 40 },
        children: applyInlineRuns(content),
      })
    })
}

function parseMarkdownToDocx(md: string): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = []
  const lines = md.split('\n')
  let i = 0

  const CARD_SECTIONS = ['pauta', 'tópicos discutidos', 'decisões tomadas', 'decisoes tomadas']

  while (i < lines.length) {
    const line = lines[i]

    if (/^# (?!#)(.+)$/.test(line)) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: line.replace(/^# /, ''), bold: true, size: 28, color: '111111' })],
      }))
      i++
      continue
    }

    if (/^## (.+)$/.test(line)) {
      const title = line.replace(/^## /, '')
      const isCardSection = CARD_SECTIONS.some(s => title.toLowerCase().includes(s))
      children.push(new Paragraph({
        spacing: { before: 280, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN_MID, space: 1 } },
        children: [new TextRun({ text: title, bold: true, size: 22, color: GREEN_MID })],
      }))
      i++

      if (isCardSection) {
        while (i < lines.length && !/^## /.test(lines[i])) {
          if (/^### (.+)$/.test(lines[i])) {
            const cardTitle = lines[i].replace(/^### /, '')
            children.push(new Paragraph({
              spacing: { before: 120, after: 40 },
              indent: { left: 280 },
              border: { left: { style: BorderStyle.SINGLE, size: 12, color: GREEN_MID, space: 4 } },
              children: [new TextRun({ text: cardTitle, bold: true, size: 20, color: GREEN_DARK })],
            }))
            i++
            while (i < lines.length && !/^##/.test(lines[i])) {
              if (lines[i].trim()) {
                children.push(...makeCardParagraphs([lines[i]]))
              }
              i++
            }
            children.push(new Paragraph({ spacing: { before: 60, after: 0 }, children: [] }))
          } else {
            if (lines[i].trim()) {
              children.push(new Paragraph({
                spacing: { before: 40, after: 40 },
                children: applyInlineRuns(lines[i].replace(/^[-*] /, '')),
              }))
            }
            i++
          }
        }
      }
      continue
    }

    if (/^### (.+)$/.test(line)) {
      children.push(new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [new TextRun({ text: line.replace(/^### /, ''), bold: true, size: 20, color: GREEN_DARK })],
      }))
      i++
      continue
    }

    if (/^\|.+\|$/.test(line) && i + 1 < lines.length && /^\|[-| :]+\|$/.test(lines[i + 1])) {
      const headers = line.split('|').map(h => h.trim()).filter(Boolean)
      i += 2
      const tableRows: string[][] = []
      while (i < lines.length && /^\|.+\|$/.test(lines[i])) {
        tableRows.push(lines[i].split('|').map(c => c.trim()).filter(Boolean))
        i++
      }
      children.push(makeActionsTable(headers, tableRows))
      children.push(new Paragraph({ spacing: { before: 120, after: 0 }, children: [] }))
      continue
    }

    if (/^[-*] (.+)$/.test(line)) {
      while (i < lines.length && /^[-*] (.+)$/.test(lines[i])) {
        children.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          spacing: { before: 40, after: 40 },
          children: applyInlineRuns(lines[i].replace(/^[-*] /, '')),
        }))
        i++
      }
      continue
    }

    if (/^\d+\. (.+)$/.test(line)) {
      while (i < lines.length && /^\d+\. (.+)$/.test(lines[i])) {
        children.push(new Paragraph({
          numbering: { reference: 'numbers', level: 0 },
          spacing: { before: 40, after: 40 },
          children: applyInlineRuns(lines[i].replace(/^\d+\. /, '')),
        }))
        i++
      }
      continue
    }

    if (line.trim() === '') { i++; continue }

    children.push(new Paragraph({
      spacing: { before: 40, after: 40 },
      children: applyInlineRuns(line),
    }))
    i++
  }

  return children
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

    const { data: profile } = await supabase
      .from('profiles').select('plan_id').eq('user_id', user.id).single()
    const planId = profile?.plan_id || 'basic'
    const isPaid = PAID_PLANS.includes(planId)

    let brandFooter = 'Documento gerado automaticamente por Ágata Transcription | agatatranscription.com'
    let isEnterprise = false
    let enterpriseName = ''

    const { data: userData } = await supabase
      .from('User').select('planId, teamId').eq('id', user.id).single()

    if (userData?.planId === 'enterprise' && userData?.teamId) {
      const { data: team } = await supabase
        .from('Team').select('name, companyName').eq('id', userData.teamId).single()
      if (team) {
        isEnterprise = true
        enterpriseName = team.companyName || team.name || ''
        brandFooter = `Documento gerado por ${enterpriseName} | powered by Ágata Transcription`
      }
    }

    const { data: meeting, error: meetingError } = await supabase
      .from('Meeting')
      .select('title, summary, userId, meetingDate, meetingTime, location, responsible, participants')
      .eq('id', meetingId).single()

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
      return new Response(JSON.stringify({ error: 'No summary available.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let summaryContent = meeting.summary
    const metaMatch = summaryContent.match(/^<!-- depth:\w+ -->\n/)
    if (metaMatch) summaryContent = summaryContent.slice(metaMatch[0].length)

    const date = meeting.meetingDate
      ? new Date(meeting.meetingDate).toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR')

    const infoRows = [
      { label: 'Título', value: meeting.title },
      { label: 'Data', value: `${date}${meeting.meetingTime ? ' · ' + meeting.meetingTime : ''}` },
    ]
    if (meeting.location) infoRows.push({ label: 'Local', value: meeting.location })
    if (meeting.responsible) infoRows.push({ label: 'Responsável', value: meeting.responsible })
    if (meeting.participants?.length) infoRows.push({ label: 'Participantes', value: meeting.participants.join(', ') })

    // Fetch logo
    let logoImageRun: ImageRun | null = null
    try {
      const logoRes = await fetch(AGATA_LOGO_URL)
      if (logoRes.ok) {
        const logoBuffer = await logoRes.arrayBuffer()
        logoImageRun = new ImageRun({
          data: logoBuffer,
          transformation: { width: 40, height: 40 },
          type: 'png',
        })
      }
    } catch (_) { /* logo optional */ }

    const contentChildren = parseMarkdownToDocx(summaryContent)

    const headerChildren: (TextRun | ImageRun)[] = []
    if (logoImageRun) headerChildren.push(logoImageRun)
    if (isEnterprise) {
      headerChildren.push(new TextRun({ text: `  ${enterpriseName}`, bold: true, color: GREEN_DARK, size: 24 }))
    }

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'bullets',
            levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
          },
          {
            reference: 'numbers',
            levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
          },
        ],
      },
      styles: {
        default: { document: { run: { font: 'Segoe UI', size: 20 } } },
      },
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                spacing: { after: 60 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN_MID, space: 4 } },
                children: headerChildren.length > 0 ? headerChildren : [new TextRun({ text: '' })],
              }),
            ],
          }),
        },
        children: [
          ...(!isPaid ? [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 120 },
            children: [new TextRun({ text: '\u26A0 Vers\u00E3o gratuita \u2014 fa\u00E7a upgrade para remover esta marca', color: 'AAAAAA', size: 16, italics: true })],
          })] : []),

          makeInfoTable(infoRows),
          new Paragraph({ spacing: { before: 160, after: 0 }, children: [] }),

          ...contentChildren,

          new Paragraph({ spacing: { before: 480, after: 0 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB', space: 4 } },
            children: [new TextRun({ text: brandFooter, color: 'AAAAAA', size: 16 })],
          }),
        ],
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))

    const filename = `ATA_${meeting.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}_${date.replace(/\//g, '-')}.docx`

    // Update meeting with template
    await supabase.from('Meeting').update({
      ataTemplate: template,
      updatedAt: new Date().toISOString(),
    }).eq('id', meetingId)

    return new Response(JSON.stringify({ base64, filename }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Generate ATA Word error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})