import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendKey = Deno.env.get('RESEND_API_KEY')!;
const fromEmail = 'contato@agatatranscription.com';

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const now = new Date();
  const results = { sent: 0, errors: [] as string[] };

  const { data: users } = await supabase
    .from('User')
    .select('id, email, name, createdAt, trialEndsAt, planId')
    .not('trialEndsAt', 'is', null)
    .is('stripeSubscriptionId', null)
    .eq('hasCompletedOnboarding', true)
    .neq('isInternal', true);

  for (const user of users || []) {
    const daysSince = Math.floor(
      (now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysLeft = Math.ceil(
      (new Date(user.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const firstName = user.name?.split(' ')[0] || 'você';

    const { data: sentEmails } = await supabase
      .from('NurturingLog')
      .select('emailType')
      .eq('userId', user.id);

    const sent = new Set(sentEmails?.map((e: any) => e.emailType) || []);

    let emailType: string | null = null;
    let subject = '';
    let html = '';

    // DAY 1 — sent between day 1 and day 2
    if (daysSince >= 1 && daysSince < 3 && !sent.has('day1')) {
      emailType = 'day1';
      subject = `${firstName}, sua conta Ágata está pronta 🎙️`;
      html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#059669;padding:24px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Ágata Transcription</h1>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #e5e7eb">
          <h2 style="color:#059669">Olá, ${firstName}! 👋</h2>
          <p>Sua conta está pronta. Você tem <strong>14 dias grátis</strong> para testar tudo.</p>
          <p>A primeira transcrição é a mais incrível — veja o resultado em menos de 2 minutos.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="https://agatatranscription.com/upload"
               style="background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
              Fazer minha primeira transcrição →
            </a>
          </div>
          <p style="color:#6b7280;font-size:14px">Formatos aceitos: MP3, WAV, M4A, MP4 e mais.</p>
        </div>
        <div style="padding:16px;text-align:center;color:#9ca3af;font-size:12px">
          <a href="https://agatatranscription.com" style="color:#059669">agatatranscription.com</a>
        </div>
      </div>`;
    }
    // DAY 3 — sent between day 3 and day 9
    else if (daysSince >= 3 && daysSince < 10 && !sent.has('day3')) {
      emailType = 'day3';
      subject = `Dica: como extrair o máximo do Ágata 💡`;
      html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#059669;padding:24px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Ágata Transcription</h1>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #e5e7eb">
          <h2 style="color:#059669">Olá, ${firstName}!</h2>
          <p>Dicas para aproveitar melhor o Ágata:</p>
          <ul style="line-height:2">
            <li>🎯 <strong>12 tipos de ATA</strong> — escolha o template certo para cada reunião</li>
            <li>📧 <strong>Follow-up automático</strong> — envie e-mail após a reunião</li>
            <li>📁 <strong>Projetos</strong> — organize por cliente ou projeto</li>
            <li>🖥️ <strong>App Desktop</strong> — grave Teams e Zoom nativos</li>
          </ul>
          <div style="text-align:center;margin:32px 0">
            <a href="https://agatatranscription.com/dashboard"
               style="background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
              Explorar o painel →
            </a>
          </div>
        </div>
        <div style="padding:16px;text-align:center;color:#9ca3af;font-size:12px">
          <a href="https://agatatranscription.com" style="color:#059669">agatatranscription.com</a>
        </div>
      </div>`;
    }
    // CATCH-ALL: user has active trial but missed day1/day3
    // (e.g. account older than 9 days but more than 4 days remaining)
    else if (daysSince >= 9 && daysLeft > 4 &&
             !sent.has('day1') && !sent.has('day3')) {
      emailType = 'day3'; // send day3 as the first contact
    }
    // DAY 10 — sent when 2-4 days remaining
    else if (daysLeft >= 2 && daysLeft <= 4 && !sent.has('day10')) {
      emailType = 'day10';
      subject = `${firstName}, restam apenas ${daysLeft} dias do seu trial ⏳`;
      html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#059669;padding:24px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Ágata Transcription</h1>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #e5e7eb">
          <h2 style="color:#059669">Olá, ${firstName}!</h2>
          <p>Seu período gratuito termina em <strong>${daysLeft} dias</strong>.</p>
          <p>Continue sem interrupção a partir de <strong>R$ 53/mês</strong>.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:24px 0">
            <p style="margin:0;font-size:14px;color:#065f46">
              ✅ Transcrições ilimitadas<br>
              ✅ Geração de ATA em PDF<br>
              ✅ Follow-up automático<br>
              ✅ Suporte por e-mail
            </p>
          </div>
          <div style="text-align:center;margin:32px 0">
            <a href="https://agatatranscription.com/plans"
               style="background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
              Ver planos e assinar →
            </a>
          </div>
        </div>
        <div style="padding:16px;text-align:center;color:#9ca3af;font-size:12px">
          <a href="https://agatatranscription.com" style="color:#059669">agatatranscription.com</a>
        </div>
      </div>`;
    }
    // DAY 13 — sent when exactly 1 day remaining
    else if (daysLeft === 1 && !sent.has('day13')) {
      emailType = 'day13';
      subject = `Último aviso: seu trial expira amanhã ⚠️`;
      html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#dc2626;padding:24px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Ágata Transcription</h1>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #e5e7eb">
          <h2 style="color:#dc2626">⚠️ Seu trial expira amanhã, ${firstName}!</h2>
          <p>Após o vencimento, você perderá acesso às suas transcrições e ATAs.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="https://agatatranscription.com/plans"
               style="background:#dc2626;color:white;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:18px">
              Assinar agora →
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px;text-align:center">
            Plano Essencial a partir de R$ 53/mês · Cancele quando quiser
          </p>
        </div>
        <div style="padding:16px;text-align:center;color:#9ca3af;font-size:12px">
          <a href="https://agatatranscription.com" style="color:#059669">agatatranscription.com</a>
        </div>
      </div>`;
    }

    // Skip users with expired trial who haven't received day1 yet
    if (daysLeft <= 0) continue;

    if (!emailType) continue;

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
