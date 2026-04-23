import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')!;
const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const ALERT_EMAIL = 'adm@agatatranscription.com';

async function checkGeminiModel(model: string): Promise<{ status: 'ok' | 'error'; latencyMs: number; detail?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
        signal: AbortSignal.timeout(10000),
      }
    );
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { status: 'error', latencyMs, detail: `HTTP ${res.status}: ${body.slice(0, 120)}` };
    }
    return { status: 'ok', latencyMs };
  } catch (err: any) {
    return { status: 'error', latencyMs: Date.now() - start, detail: err.message };
  }
}

async function checkOpenAI(): Promise<{ status: 'ok' | 'error'; latencyMs: number; detail?: string }> {
  const start = Date.now();
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${OPENAI_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { status: 'error', latencyMs, detail: `HTTP ${res.status}` };
    return { status: 'ok', latencyMs };
  } catch (err: any) {
    return { status: 'error', latencyMs: Date.now() - start, detail: err.message };
  }
}

async function getLastState(): Promise<Record<string, 'ok' | 'error' | undefined>> {
  const { data } = await supabase
    .from('HealthCheckLog')
    .select('provider, status')
    .order('createdAt', { ascending: false })
    .limit(10);

  const last: Record<string, 'ok' | 'error'> = {};
  const seen = new Set<string>();
  for (const row of (data || [])) {
    if (!seen.has(row.provider)) {
      last[row.provider] = row.status;
      seen.add(row.provider);
    }
  }
  return last;
}

async function sendAlert(
  downProviders: string[],
  recoveredProviders: string[],
  results: Record<string, { status: string; latencyMs: number; detail?: string }>
) {
  if (downProviders.length === 0 && recoveredProviders.length === 0) return;

  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const isAlert = downProviders.length > 0;
  const headerColor = isAlert ? '#dc2626' : '#059669';
  const emoji = isAlert ? '🚨' : '✅';
  const title = isAlert
    ? `${emoji} ALERTA: ${downProviders.join(', ')} fora do ar`
    : `${emoji} RECUPERADO: ${recoveredProviders.join(', ')} voltou`;

  const providerRows = Object.entries(results).map(([provider, r]) => {
    const statusColor = r.status === 'ok' ? '#059669' : '#dc2626';
    const statusIcon = r.status === 'ok' ? '🟢' : '🔴';
    return `<tr>
      <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f3f4f6">${provider}</td>
      <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f3f4f6;color:${statusColor};font-weight:600">${statusIcon} ${r.status === 'ok' ? 'Operacional' : 'Fora do ar'}</td>
      <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f3f4f6;color:#6b7280">${r.latencyMs}ms</td>
      <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #f3f4f6;color:#9ca3af;font-size:11px">${r.detail || '—'}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:16px;background:#f3f4f6;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto">
    <div style="background:${headerColor};border-radius:8px 8px 0 0;padding:18px 24px">
      <div style="color:white;font-size:18px;font-weight:700">${title}</div>
      <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px">${now} (Horário de Brasília)</div>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:20px 24px">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f9fafb">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Provedor</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Status</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Latência</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280">Detalhe</th>
        </tr></thead>
        <tbody>${providerRows}</tbody>
      </table>
      ${isAlert
        ? `<div style="margin-top:16px;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;font-size:13px;color:#991b1b">
            ⚠️ O sistema de fallback está ativo. Transcrições continuam funcionando via provedores alternativos.
           </div>`
        : `<div style="margin-top:16px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:13px;color:#065f46">
            ✅ Serviço restaurado. O sistema voltará a usar o provedor principal automaticamente.
           </div>`
      }
      <div style="text-align:center;margin-top:16px">
        <a href="https://agatatranscription.com/admin" style="color:#059669;font-weight:700;text-decoration:none;font-size:13px">Abrir Painel DEV →</a>
      </div>
    </div>
  </div>
  </body></html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Ágata Alerts <adm@agatatranscription.com>',
      to: ALERT_EMAIL,
      subject: title,
      html,
    }),
  });
}

Deno.serve(async () => {
  const [g25, g20, openai] = await Promise.all([
    checkGeminiModel('gemini-2.5-flash'),
    checkGeminiModel('gemini-2.0-flash'),
    checkOpenAI(),
  ]);

  const results = {
    'Gemini 2.5 Flash': g25,
    'Gemini 2.0 Flash': g20,
    'OpenAI Whisper': openai,
  };

  // Get previous state to detect changes
  const lastState = await getLastState();
  const downProviders: string[] = [];
  const recoveredProviders: string[] = [];

  for (const [provider, result] of Object.entries(results)) {
    const prev = lastState[provider];
    if (result.status === 'error' && prev !== 'error') downProviders.push(provider);
    if (result.status === 'ok' && prev === 'error') recoveredProviders.push(provider);
  }

  // Log to DB
  await supabase.from('HealthCheckLog').insert(
    Object.entries(results).map(([provider, r]) => ({
      provider,
      status: r.status,
      latencyMs: r.latencyMs,
      detail: r.detail || null,
      createdAt: new Date().toISOString(),
    }))
  );

  // Send alert only on status change
  await sendAlert(downProviders, recoveredProviders, results);

  return new Response(JSON.stringify({
    gemini_2_5: g25,
    gemini_2_0: g20,
    openai,
    bothGeminiDown: g25.status === 'error' && g20.status === 'error',
    alertSent: downProviders.length > 0 || recoveredProviders.length > 0,
    downProviders,
    recoveredProviders,
  }), { headers: { 'Content-Type': 'application/json' } });
});
