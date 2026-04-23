import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendKey = Deno.env.get('RESEND_API_KEY')!;
const fromEmail = 'contato@agatatranscription.com';

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const now = new Date();
  const results = { sent: 0, errors: [] as string[] };

  // Fetch all active trial users with completed onboarding
  const { data: users } = await supabase
    .from('User')
    .select('id, email, name, createdAt, trialEndsAt, planId')
    .not('trialEndsAt', 'is', null)
    .is('stripeSubscriptionId', null)
    .eq('hasCompletedOnboarding', true)
    .neq('email', 'adm@agatatranscription.com');

  for (const user of users || []) {
    const daysSince = Math.floor(
      (now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysLeft = Math.ceil(
      (new Date(user.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const firstName = user.name?.split(' ')[0] || 'você';

    // Check which nurturing emails already sent
    const { data: sentEmails } = await supabase
      .from('NurturingLog')
      .select('emailType')
      .eq('userId', user.id);

    const sent = new Set(sentEmails?.map((e: any) => e.emailType) || []);

    let emailType: string | null = null;
    let subject = '';
    let html = '';

    // DAY 1: Welcome + first transcription CTA
    if (daysSince >= 1 && !sent.has('day1')) {
      emailType = 'day1';
      subject = `${firstName}, sua conta Ágata está pronta 🎙️`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #059669; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Ágata Transcription</h1>
          </div>
          <div style="padding: 32px; background: #ffffff; border: 1px solid #e5e7eb;">
            <h2 style="color: #059669;">Olá, ${firstName}! 👋</h2>
            <p>Sua conta está pronta. Você tem <strong>14 dias grátis</strong> para testar tudo.</p>
            <p>A primeira transcrição é a mais incrível — você vai ver o resultado em menos de 2 minutos.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://agatatranscription.com/upload"
                style="background: #059669; color: white; padding: 14px 28px;
                       border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Fazer minha primeira transcrição →
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Formatos aceitos: MP3, WAV, M4A, MP4 e mais.<br>
              Um áudio de 30 minutos é processado em cerca de 1 minuto.
            </p>
          </div>
          <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
            <a href="https://agatatranscription.com" style="color: #059669;">agatatranscription.com</a>
          </div>
        </div>`;
    }

    // DAY 3: Tips
    else if (daysSince >= 3 && !sent.has('day3')) {
      emailType = 'day3';
      subject = `Dica: como extrair o máximo do Ágata 💡`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #059669; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Ágata Transcription</h1>
          </div>
          <div style="padding: 32px; background: #ffffff; border: 1px solid #e5e7eb;">
            <h2 style="color: #059669;">Olá, ${firstName}!</h2>
            <p>Algumas dicas para aproveitar melhor o Ágata:</p>
            <ul style="line-height: 2;">
              <li>🎯 <strong>12 tipos de ATA</strong> — escolha o template certo para cada reunião</li>
              <li>📧 <strong>E-mail de follow-up</strong> — gere e envie automaticamente após a reunião</li>
              <li>📁 <strong>Projetos</strong> — organize reuniões por cliente ou projeto</li>
              <li>🖥️ <strong>App Desktop</strong> — grave qualquer app, incluindo Teams e Zoom nativos</li>
            </ul>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://agatatranscription.com/dashboard"
                style="background: #059669; color: white; padding: 14px 28px;
                       border-radius: 8px; text-decoration: none; font-weight: bold;">
                Explorar o painel →
              </a>
            </div>
          </div>
          <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
            <a href="https://agatatranscription.com" style="color: #059669;">agatatranscription.com</a>
          </div>
        </div>`;
    }

    // DAY 10: Urgency
    else if (daysSince >= 10 && !sent.has('day10') && daysLeft > 0) {
      emailType = 'day10';
      subject = `${firstName}, restam apenas ${daysLeft} dias do seu trial ⏳`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #059669; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Ágata Transcription</h1>
          </div>
          <div style="padding: 32px; background: #ffffff; border: 1px solid #e5e7eb;">
            <h2 style="color: #059669;">Olá, ${firstName}!</h2>
            <p>Seu período gratuito termina em <strong>${daysLeft} dias</strong>.</p>
            <p>Para continuar sem interrupção, assine agora a partir de <strong>R$ 53/mês</strong>.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #065f46;">
                ✅ Transcrições ilimitadas<br>
                ✅ Geração de ATA em PDF<br>
                ✅ E-mails de follow-up automáticos<br>
                ✅ Suporte por e-mail
              </p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://agatatranscription.com/plans"
                style="background: #059669; color: white; padding: 14px 28px;
                       border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Ver planos e assinar →
              </a>
            </div>
          </div>
          <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
            <a href="https://agatatranscription.com" style="color: #059669;">agatatranscription.com</a>
          </div>
        </div>`;
    }

    // DAY 13: Last warning
    else if (daysSince >= 13 && !sent.has('day13') && daysLeft > 0) {
      emailType = 'day13';
      subject = `Último aviso: seu trial expira amanhã ⚠️`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #dc2626; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Ágata Transcription</h1>
          </div>
          <div style="padding: 32px; background: #ffffff; border: 1px solid #e5e7eb;">
            <h2 style="color: #dc2626;">⚠️ Seu trial expira amanhã, ${firstName}!</h2>
            <p>Após o vencimento, você perderá acesso às suas transcrições e ATAs.</p>
            <p>Garanta sua assinatura agora e continue sem interrupção.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://agatatranscription.com/plans"
                style="background: #dc2626; color: white; padding: 16px 32px;
                       border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px;">
                Assinar agora →
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px; text-align: center;">
              Plano Essencial a partir de R$ 53/mês · Cancele quando quiser
            </p>
          </div>
          <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
            <a href="https://agatatranscription.com" style="color: #059669;">agatatranscription.com</a>
          </div>
        </div>`;
    }

    if (!emailType) continue;

    // Send email via Resend
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Ágata Transcription <${fromEmail}>`,
          to: user.email,
          subject,
          html,
        }),
      });

      if (res.ok) {
        // Log the email
        await supabase.from('NurturingLog').insert({
          userId: user.id,
          emailType,
          sentAt: new Date().toISOString(),
        });
        results.sent++;
      } else {
        results.errors.push(`${user.email}: ${res.status}`);
      }
    } catch (err: any) {
      results.errors.push(`${user.email}: ${err.message}`);
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
});
