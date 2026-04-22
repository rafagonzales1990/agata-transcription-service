import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM = 'Ágata Transcription <noreply@agatatranscription.com>'
const BASE_URL = 'https://agatatranscription.com'

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
<tr><td style="background:#10B981;padding:24px;text-align:center">
<table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
<td style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;text-align:center;line-height:36px;color:#fff;font-weight:bold;font-size:18px">A</td>
<td style="padding-left:10px;color:#fff;font-size:20px;font-weight:600">Ágata Transcription</td>
</tr></table>
</td></tr>
<tr><td style="padding:32px 40px">${content}</td></tr>
<tr><td style="background:#f9fafb;padding:20px 40px;text-align:center">
<p style="margin:0;font-size:12px;color:#9ca3af">© 2026 Ágata Transcription · 
<a href="${BASE_URL}/privacy" style="color:#10B981;text-decoration:none">Privacidade</a> · 
<a href="${BASE_URL}/legal-terms" style="color:#10B981;text-decoration:none">Termos</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#10B981;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0">${text}</a>`
}

function welcomeTemplate(name: string): string {
  return baseLayout(`
<h1 style="margin:0 0 16px;font-size:22px;color:#111827">Olá, ${name}! 👋</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px">Sua conta na Ágata Transcription está pronta. Você tem <strong>14 dias de trial grátis</strong> para explorar tudo.</p>
<p style="color:#111827;font-weight:600;margin:0 0 12px">O que você pode fazer agora:</p>
<ul style="color:#4b5563;line-height:2;padding-left:20px;margin:0 0 20px">
<li>Transcrever reuniões em PT-BR automaticamente</li>
<li>Gerar resumos executivos com IA</li>
<li>Criar ATAs profissionais em PDF</li>
</ul>
${btn('Fazer minha primeira transcrição →', BASE_URL + '/upload')}`)
}

function trialExpiringTemplate(name: string): string {
  return baseLayout(`
<div style="text-align:center;margin-bottom:20px"><span style="font-size:40px">⏰</span></div>
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;text-align:center">Apenas 7 dias restantes, ${name}</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">Seu período de trial gratuito termina em 7 dias. Faça upgrade agora para continuar transcrevendo suas reuniões sem interrupção.</p>
<div style="background:#FEF3C7;border-radius:8px;padding:16px;margin:0 0 20px">
<p style="margin:0;color:#92400E;font-size:14px">⚠️ Após o trial: você será movido para o plano Gratuito com limite de 2 transcrições/mês e 5min por áudio.</p>
</div>
<div style="text-align:center">${btn('Ver planos e fazer upgrade →', BASE_URL + '/plans')}</div>`)
}

function trialExpiredTemplate(name: string): string {
  return baseLayout(`
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;text-align:center">Seu trial chegou ao fim, ${name}</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">Seu período de teste gratuito expirou. Suas transcrições e ATAs continuam salvas — faça upgrade para continuar criando novas.</p>
<div style="text-align:center">${btn('Escolher meu plano →', BASE_URL + '/plans')}</div>
<p style="text-align:center;color:#9ca3af;font-size:13px;margin-top:16px">Planos a partir de R$ 37/mês · Cancele quando quiser</p>`)
}

function transcriptionDoneTemplate(name: string, meetingTitle: string, meetingId: string): string {
  return baseLayout(`
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;text-align:center">Transcrição concluída! ✅</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">A transcrição de <strong>"${meetingTitle}"</strong> está pronta. Acesse para ver a transcrição completa e gerar o resumo com IA.</p>
<div style="text-align:center">${btn('Ver transcrição →', BASE_URL + '/meetings/' + meetingId)}</div>`)
}

function paymentConfirmedTemplate(name: string, planName: string): string {
  return baseLayout(`
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;text-align:center">Pagamento confirmado! 🎉</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">Obrigado, ${name}! Seu plano <strong>${planName}</strong> está ativo. Aproveite todos os recursos disponíveis.</p>
<div style="background:#F0FDF4;border-radius:8px;padding:16px;margin:0 0 20px">
<p style="margin:0;color:#166534;font-size:14px">Para gerenciar sua assinatura, acessar faturas ou cancelar, use o portal do cliente abaixo.</p>
</div>
<div style="text-align:center">${btn('Gerenciar assinatura →', BASE_URL + '/profile')}</div>`)
}

function upgradeSuggestionTemplate(name: string, used: number, max: number, nextPlan: string): string {
  return baseLayout(`
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;text-align:center">Você está aproveitando bem a Ágata, ${name}! 📈</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">Você já usou <strong>${used}</strong> de <strong>${max}</strong> transcrições este mês. Que tal fazer upgrade para o <strong>${nextPlan}</strong> e ter mais recursos?</p>
<div style="text-align:center">${btn('Conhecer o ' + nextPlan + ' →', BASE_URL + '/plans')}</div>`)
}

function demoReadyTemplate(name: string, summaryPreview: string): string {
  return baseLayout(`
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;text-align:center">Sua reunião já virou resumo com a Ágata ✅</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 16px;text-align:center">Olá, ${name}! O resumo da sua reunião foi gerado com sucesso.</p>
<div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:0 0 20px">
<p style="margin:0;color:#374151;font-size:13px;line-height:1.5"><em>"${summaryPreview}..."</em></p>
</div>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">Crie sua conta grátis para salvar suas transcrições, gerar ATAs em PDF/Word e aproveitar todos os recursos.</p>
<div style="text-align:center">${btn('Começar teste grátis →', BASE_URL + '/auth/signup')}</div>
<p style="text-align:center;color:#9ca3af;font-size:13px;margin-top:16px">14 dias grátis · Sem cartão de crédito</p>`)
}

function demoFollowup24hTemplate(name: string, persona: string | null): string {
  const personaText = persona === 'juridico' ? ' para equipes jurídicas'
    : persona === 'rh' ? ' para times de RH'
    : persona === 'marketing' ? ' para equipes de marketing'
    : ''
  return baseLayout(`
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;text-align:center">Seu resumo está esperando, ${name}</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">Você testou a Ágata e viu como funciona${personaText}. Agora crie sua conta para salvar reuniões, gerar ATAs em PDF e acompanhar o histórico do seu time.</p>
<div style="text-align:center">${btn('Criar conta grátis →', BASE_URL + '/auth/signup')}</div>
<p style="text-align:center;color:#9ca3af;font-size:13px;margin-top:16px">14 dias grátis · 5 transcrições incluídas · Sem cartão</p>`)
}

function demoFollowup72hTemplate(name: string, persona: string | null): string {
  let useCases = ''
  if (persona === 'juridico') useCases = '<li>Transcrição de audiências e alinhamentos</li><li>ATAs formais para processos</li>'
  else if (persona === 'rh') useCases = '<li>Registro de entrevistas e feedbacks</li><li>Documentação de reuniões de desenvolvimento</li>'
  else if (persona === 'marketing') useCases = '<li>Atas de reuniões de campanha</li><li>Registro de brainstormings e alinhamentos</li>'
  else useCases = '<li>Documentação automática de reuniões</li><li>Resumos com IA e ATA em PDF</li>'

  return baseLayout(`
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;text-align:center">Última chamada, ${name} 🔔</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 16px;text-align:center">Times como o seu estão usando a Ágata para:</p>
<ul style="color:#4b5563;line-height:2;padding-left:20px;margin:0 0 20px">${useCases}</ul>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">Comece seu teste grátis de 14 dias e veja a diferença na produtividade.</p>
<div style="text-align:center">${btn('Começar teste grátis →', BASE_URL + '/auth/signup')}</div>`)
}

function teamInviteTemplate(teamName: string, inviterName: string, signupUrl: string, expiresIn: string): string {
  return baseLayout(`
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;text-align:center">Você foi convidado! 🎉</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center"><strong>${inviterName}</strong> convidou você para fazer parte do time <strong>${teamName}</strong> no Ágata Transcription.</p>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">Com o Ágata você grava e transcreve reuniões automaticamente com IA, gera ATAs em PDF e Word, e muito mais.</p>
<div style="text-align:center">${btn('Aceitar convite →', signupUrl)}</div>
<p style="text-align:center;color:#9ca3af;font-size:13px;margin-top:16px">Este convite expira em ${expiresIn}.</p>`)
}

function teamMemberAddedTemplate(name: string, teamName: string, inviterName: string, dashboardUrl: string): string {
  return baseLayout(`
<h1 style="margin:0 0 16px;font-size:22px;color:#111827;text-align:center">Você foi adicionado a um time! 🎉</h1>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">Olá, ${name}! <strong>${inviterName}</strong> adicionou você ao time <strong>${teamName}</strong> no Ágata Transcription.</p>
<p style="color:#4b5563;line-height:1.6;margin:0 0 20px;text-align:center">Você agora tem acesso às funcionalidades Enterprise. Acesse sua conta para começar.</p>
<div style="text-align:center">${btn('Ir para o Dashboard →', dashboardUrl)}</div>`)
}


async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
  return res.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, data } = await req.json()

    let subject = ''
    let html = ''

    switch (type) {
      case 'welcome':
        subject = 'Bem-vindo à Ágata! Sua conta está pronta 🎉'
        html = welcomeTemplate(data.name)
        break
      case 'trial_expiring':
        subject = 'Seu trial expira em 7 dias — não perca seu progresso'
        html = trialExpiringTemplate(data.name)
        break
      case 'trial_expired':
        subject = 'Seu trial expirou — continue com um plano pago'
        html = trialExpiredTemplate(data.name)
        break
      case 'transcription_done':
        subject = 'Sua transcrição está pronta! ✅'
        html = transcriptionDoneTemplate(data.name, data.meetingTitle, data.meetingId)
        break
      case 'payment_confirmed':
        subject = `Pagamento confirmado — bem-vindo ao plano ${data.planName}! 🎉`
        html = paymentConfirmedTemplate(data.name, data.planName)
        break
      case 'upgrade_suggestion':
        subject = 'Você está quase no limite — conheça o próximo plano'
        html = upgradeSuggestionTemplate(data.name, data.used, data.max, data.nextPlan)
        break
      case 'demo-ready':
        subject = 'Sua reunião já virou resumo com a Ágata ✅'
        html = demoReadyTemplate(data.name, data.summaryPreview || '')
        break
      case 'demo-followup-24h':
        subject = 'Seu resumo está esperando — crie sua conta grátis'
        html = demoFollowup24hTemplate(data.name, data.persona)
        break
      case 'demo-followup-72h':
        subject = 'Última chamada — comece seu teste grátis na Ágata'
        html = demoFollowup72hTemplate(data.name, data.persona)
        break
      case 'team_invite':
        subject = `Você foi convidado para o time ${data.teamName} no Ágata`
        html = teamInviteTemplate(data.teamName, data.inviterName, data.signupUrl, data.expiresIn)
        break
      case 'team_member_added':
        subject = `Você foi adicionado ao time ${data.teamName} no Ágata`
        html = teamMemberAddedTemplate(data.name, data.teamName, data.inviterName, data.dashboardUrl)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid email type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const result = await sendEmail(to, subject, html)
    console.log(`Email sent: type=${type}, to=${to}`)

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Email error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
