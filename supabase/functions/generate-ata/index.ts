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

const TEMPLATE_PROMPTS: Record<string, string> = {
  geral: `Gere uma ATA completa e profissional com as seções:
    Resumo Executivo, Tópicos Discutidos, Decisões Tomadas, 
    Itens de Ação (com responsável e prazo quando mencionado) 
    e Próximos Passos. Use linguagem formal e objetiva.`,
  juridico_audiencia: `Gere uma ATA de Audiência Jurídica com as seções:
    Dados da Audiência (data, partes, advogados, juiz quando mencionado),
    Objeto da Audiência, Relato dos Fatos, Alegações das Partes,
    Decisões e Despachos, Encaminhamentos e Prazos.
    Use linguagem jurídica formal. Destaque prazos processuais.`,
  juridico_entrevista: `Gere uma ATA de Entrevista Jurídica com as seções:
    Dados da Entrevista (data, partes presentes, objetivo),
    Relato do Cliente, Fatos Relevantes, Documentos Mencionados,
    Orientações Prestadas, Próximas Providências e Prazos.
    Use linguagem jurídica formal. Mantenha confidencialidade.`,
  rh_entrevista: `Gere uma ATA de Entrevista de RH com as seções:
    Dados da Entrevista (candidato, cargo, entrevistador, data),
    Perfil do Candidato, Competências Avaliadas, Pontos Fortes,
    Pontos de Desenvolvimento, Alinhamento Cultural,
    Avaliação Geral e Recomendação (aprovado/reprovado/segunda fase).
    Use linguagem profissional e objetiva.`,
  rh_pdi: `Gere uma ATA de PDI (Plano de Desenvolvimento Individual) com:
    Dados do Colaborador (nome, cargo, gestor, data),
    Avaliação de Performance Atual, Objetivos de Desenvolvimento,
    Competências a Desenvolver, Ações e Iniciativas Planejadas,
    Recursos Necessários, Metas e Indicadores, Próxima Revisão.
    Use linguagem motivacional e orientada a crescimento.`,
  marketing_estrategia: `Gere uma ATA de Reunião de Estratégia de Marketing com:
    Contexto e Objetivos da Reunião, Análise de Performance (métricas mencionadas),
    Estratégias Discutidas, Decisões Aprovadas, Campanhas e Iniciativas,
    Budget e Recursos Alocados, Responsáveis e Prazos, KPIs e Metas.
    Destaque números, percentuais e metas mencionados.`,
  marketing_planejamento: `Gere uma ATA de Planejamento de Marketing com:
    Objetivo do Planejamento, Análise de Mercado e Concorrência,
    Público-Alvo Definido, Canais e Estratégias, Calendário de Ações,
    Orçamento Previsto, Responsáveis por Área, Próximos Marcos.
    Use linguagem orientada a resultados.`,
  engenharia_projetos: `Gere uma ATA de Reunião de Projeto de Engenharia com:
    Status do Projeto (cronograma, orçamento, escopo),
    Itens em Progresso, Bloqueios e Riscos Identificados,
    Decisões Técnicas Tomadas, Mudanças de Escopo,
    Ações e Responsáveis, Próximos Entregáveis e Prazos.
    Destaque riscos e bloqueios com clareza.`,
  engenharia_obra: `Gere uma ATA de Reunião de Obra com:
    Dados da Obra (nome, localização, data, participantes),
    Status de Execução por Frente de Trabalho, Ocorrências e Não-Conformidades,
    Medições e Avanço Físico, Pendências e Condicionantes,
    Decisões e Providências, Próxima Vistoria.
    Use linguagem técnica de engenharia civil.`,
  ti_sprint: `Gere uma ATA de Sprint/Cerimônia Ágil com:
    Tipo de Cerimônia (Planning/Review/Retrospective/Daily),
    Sprint Atual e Objetivo, Itens Discutidos/Demonstrados,
    Velocity e Métricas, Impedimentos Identificados,
    Decisões e Ajustes, Action Items para o Time,
    Comprometimento do Próximo Sprint.
    Use terminologia ágil (story points, backlog, etc.).`,
  financeiro: `Gere uma ATA de Reunião Financeira com:
    Pauta Financeira, Análise de Resultados (receita, despesas, margem),
    Indicadores Financeiros Discutidos (DRE, fluxo de caixa, EBITDA),
    Decisões de Investimento ou Corte, Previsões e Projeções,
    Aprovações Orçamentárias, Responsáveis e Prazos.
    Destaque todos os valores monetários e percentuais.`,
  comercial: `Gere uma ATA de Reunião Comercial com:
    Pipeline e Status das Oportunidades, Métricas de Vendas
    (conversão, ticket médio, CAC, metas x realizado),
    Contas Estratégicas Discutidas, Objeções e Como Superá-las,
    Estratégias de Abordagem Definidas, Metas por Vendedor,
    Próximas Ações e Follow-ups.
    Destaque números, percentuais e valores de negócio.`,
}

// Section prompts for custom template AI generation
const SECTION_PROMPTS: Record<string, string> = {
  identificacao: '', // handled as info table
  pauta: 'Liste os principais tópicos e assuntos discutidos na reunião.',
  decisoes: 'Liste todas as decisões tomadas e aprovações realizadas.',
  acoes: 'Liste todos os itens de ação com responsável e prazo quando mencionados. Use formato de tabela markdown com colunas: Ação, Responsável, Prazo.',
  riscos: 'Liste os riscos, impedimentos e problemas identificados.',
  resumo: 'Faça um resumo executivo com os pontos mais importantes.',
  transcricao: '', // handled as raw text
  proximos: 'Liste os próximos passos, reuniões agendadas e entregas futuras.',
  insights: 'Liste insights, ideias e oportunidades levantadas.',
  observacoes: 'Registre observações gerais relevantes mencionadas.',
}

interface AtaSection {
  id: string
  key: string
  label: string
  enabled: boolean
  order: number
  instruction?: string | null
  isFixed: boolean
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
        const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean)
        const isSeparator = cells.every(c => /^[-:]+$/.test(c))
        if (!isSeparator) {
          tableRows.push(cells)
        }
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

// Build AI prompt for custom template sections
function buildCustomPrompt(
  sections: AtaSection[],
  transcription: string | null,
  summaryContent: string | null,
): string {
  const sectionInstructions = sections
    .filter(s => !s.isFixed && s.key !== 'transcricao')
    .map(s => {
      const baseInstruction = SECTION_PROMPTS[s.key] || `Gere o conteúdo para a seção "${s.label}".`
      const customInstruction = s.instruction ? ` Instrução adicional: ${s.instruction}` : ''
      return `## ${s.label}\n${baseInstruction}${customInstruction}`
    })
    .join('\n\n')

  return `Você é um assistente especialista em documentação de reuniões.
Com base na transcrição e no resumo da reunião abaixo, gere o conteúdo para cada seção solicitada em português brasileiro.
Para cada seção, use o cabeçalho ## exatamente como especificado abaixo.
Seja objetivo e profissional. Use listas com - para itens múltiplos.
Para itens de ação, use tabela markdown com colunas: | Ação | Responsável | Prazo |

TRANSCRIÇÃO:
${transcription?.slice(0, 8000) || '(não disponível)'}

RESUMO EXISTENTE:
${summaryContent?.slice(0, 4000) || '(não disponível)'}

SEÇÕES SOLICITADAS:
${sectionInstructions}`
}

// Call Gemini to generate custom section content
async function generateCustomContent(
  sections: AtaSection[],
  transcription: string | null,
  summaryContent: string | null,
): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
  if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY not configured')

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  const prompt = buildCustomPrompt(sections, transcription, summaryContent)

  let ataText = ''
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini error:', errText)
      throw new Error('Erro ao gerar conteúdo com IA')
    }

    const result = await response.json()
    ataText = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (geminiErr) {
    console.warn('Gemini falhou no generate-ata (custom), usando OpenAI:', (geminiErr as Error).message)
    if (!openaiApiKey) throw geminiErr
    ataText = await generateAtaWithOpenAI(prompt, openaiApiKey)
    console.log('OpenAI fallback para ATA custom concluído')
  }

  return ataText
}

// Build markdown content for custom template (combining AI output + special sections)
function buildCustomMarkdown(
  sections: AtaSection[],
  aiContent: string,
  transcription: string | null,
): string {
  const lines: string[] = []

  for (const section of sections) {
    if (section.isFixed) continue // identificacao handled separately as info table

    if (section.key === 'transcricao') {
      lines.push(`## ${section.label}`)
      lines.push('')
      lines.push(transcription?.slice(0, 10000) || '(Transcrição não disponível)')
      lines.push('')
      continue
    }

    // Extract this section from AI content using ## header matching
    const sectionRegex = new RegExp(`## ${escapeRegex(section.label)}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`)
    const match = aiContent.match(sectionRegex)
    if (match) {
      lines.push(`## ${section.label}`)
      lines.push('')
      lines.push(match[1].trim())
      lines.push('')
    }
  }

  return lines.join('\n')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function generateAtaWithOpenAI(
  prompt: string,
  openaiApiKey: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8192,
      temperature: 0.2,
    })
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI error ${response.status}: ${err.substring(0, 300)}`)
  }
  const result = await response.json()
  return result.choices?.[0]?.message?.content || ''
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

    const { meetingId, template, ataTemplateId } = await req.json()
    if (!meetingId) {
      return new Response(JSON.stringify({ error: 'meetingId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!ataTemplateId && (!template || !templateLabels[template])) {
      return new Response(JSON.stringify({ error: 'valid template or ataTemplateId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Load custom template if ataTemplateId provided
    let customSections: AtaSection[] | null = null
    let customTemplateName: string | null = null

    if (ataTemplateId) {
      const { data: ataTemplate } = await supabase
        .from('AtaTemplate')
        .select('name, sections, userId')
        .eq('id', ataTemplateId)
        .maybeSingle()

      if (ataTemplate && ataTemplate.userId === user.id) {
        customSections = (ataTemplate.sections as AtaSection[])
          .filter((s: AtaSection) => s.enabled)
          .sort((a: AtaSection, b: AtaSection) => a.order - b.order)
        customTemplateName = ataTemplate.name
      }
    }

    const { data: profile } = await supabase
      .from('profiles').select('plan_id').eq('user_id', user.id).single()
    const planId = profile?.plan_id || 'basic'
    const isPaid = PAID_PLANS.includes(planId)

    let brandFooter = 'Documento gerado automaticamente por Ágata Transcription | agatatranscription.com'
    let isEnterprise = false
    let enterpriseName = ''

    const { data: userData } = await supabase
      .from('User').select('planId, teamId').eq('id', user.id).maybeSingle()

    let teamLogoUrl: string | null = null

    if (userData?.planId === 'enterprise' && userData?.teamId) {
      const { data: team } = await supabase
        .from('Team').select('name, companyName, logoUrl').eq('id', userData.teamId).maybeSingle()
      if (team) {
        isEnterprise = true
        enterpriseName = team.companyName || team.name || ''
        teamLogoUrl = team.logoUrl || null
        brandFooter = `Documento gerado por ${enterpriseName} | powered by Ágata Transcription`
      }
    }

    const { data: meeting, error: meetingError } = await supabase
      .from('Meeting')
      .select('title, summary, transcription, userId, meetingDate, meetingTime, location, responsible, participants')
      .eq('id', meetingId).maybeSingle()

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
    if (!meeting.summary && !meeting.transcription) {
      return new Response(JSON.stringify({ error: 'No summary or transcription available.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let summaryContent = meeting.summary || ''
    const metaMatch = summaryContent.match(/^<!-- depth:\w+ -->\n/)
    if (metaMatch) summaryContent = summaryContent.slice(metaMatch[0].length)

    // Generate content based on custom template, type-specific prompt, or legacy flow
    let finalMarkdown: string
    if (customSections) {
      // Generate AI content for custom sections
      const aiContent = await generateCustomContent(customSections, meeting.transcription, summaryContent)
      finalMarkdown = buildCustomMarkdown(customSections, aiContent, meeting.transcription)
    } else if (template && TEMPLATE_PROMPTS[template]) {
      // Generate AI content using type-specific prompt
      const templatePrompt = TEMPLATE_PROMPTS[template]

      // Format meeting metadata for the prompt (so the model uses real values)
      const meetingDateForPrompt = meeting.meetingDate
        ? new Date(meeting.meetingDate).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR')
      const meetingTimeForPrompt = meeting.meetingTime
        || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const meetingLocationForPrompt = meeting.location || 'Reunião Online'
      const meetingResponsibleForPrompt = meeting.responsible || 'Não especificado'
      const meetingParticipantsForPrompt = meeting.participants?.length
        ? meeting.participants.join(', ')
        : 'Não especificados'

      const geminiPrompt = `Você é um especialista em documentação de reuniões.

${templatePrompt}

DADOS REAIS DA REUNIÃO (use EXATAMENTE estes valores quando precisar referenciar data, hora, local, responsável ou participantes — NÃO use placeholders como "[Data da Reunião - Não especificada]"):
- Título: ${meeting.title}
- Data: ${meetingDateForPrompt}
- Horário: ${meetingTimeForPrompt}
- Local: ${meetingLocationForPrompt}
- Responsável: ${meetingResponsibleForPrompt}
- Participantes: ${meetingParticipantsForPrompt}

Baseie-se EXCLUSIVAMENTE no conteúdo da transcrição/resumo abaixo para o conteúdo substantivo.
Não invente informações que não foram mencionadas.
Formate em Markdown com títulos ## para cada seção.
Seja objetivo e profissional.

CONTEÚDO DA REUNIÃO:
${meeting.transcription?.slice(0, 8000) || summaryContent?.slice(0, 4000) || '(não disponível)'}`

      const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
      if (!apiKey) throw new Error('GOOGLE_GEMINI_API_KEY not configured')

      const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

      let ataText = ''
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: geminiPrompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
            }),
          }
        )

        if (!response.ok) {
          const errText = await response.text()
          console.error('Gemini error:', errText)
          throw new Error('Erro ao gerar conteúdo com IA')
        }

        const result = await response.json()
        ataText = result.candidates?.[0]?.content?.parts?.[0]?.text || summaryContent
      } catch (geminiErr) {
        console.warn('Gemini falhou no generate-ata, usando OpenAI:', (geminiErr as Error).message)
        if (!openaiApiKey) throw geminiErr
        ataText = await generateAtaWithOpenAI(geminiPrompt, openaiApiKey)
        console.log('OpenAI fallback para ATA concluído')
      }

      finalMarkdown = ataText
    } else {
      finalMarkdown = summaryContent
    }

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
    const logoUrlToFetch = (isEnterprise && teamLogoUrl) ? teamLogoUrl : AGATA_LOGO_URL
    try {
      const logoRes = await fetch(logoUrlToFetch)
      if (logoRes.ok) {
        const logoBuffer = await logoRes.arrayBuffer()
        logoImageRun = new ImageRun({
          data: logoBuffer,
          transformation: { width: 40, height: 40 },
        })
      }
    } catch (_) { /* logo optional */ }

    const contentChildren = parseMarkdownToDocx(finalMarkdown)

    const headerChildren: (TextRun | ImageRun)[] = []
    if (logoImageRun) headerChildren.push(logoImageRun)
    if (isEnterprise) {
      headerChildren.push(new TextRun({ text: `  ${enterpriseName}`, bold: true, color: GREEN_DARK, size: 24 }))
    }

    const docTitle = customTemplateName || templateLabels[template] || 'Ata'

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

    // Update meeting with template info
    await supabase.from('Meeting').update({
      ataTemplate: template || 'custom',
      ataTemplateId: ataTemplateId || null,
      ataSections: customSections || null,
      updatedAt: new Date().toISOString(),
    }).eq('id', meetingId)

    return new Response(JSON.stringify({ base64, filename }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Generate ATA Word error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
