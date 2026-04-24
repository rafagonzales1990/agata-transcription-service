import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')!

    const supabase = createClient(supabaseUrl, serviceKey)

    const { userId, deviceId } = await req.json()
    if (!userId || !deviceId) {
      return new Response(JSON.stringify({ error: 'userId and deviceId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user email from auth
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
    const userEmail = authUser?.email

    // Find all OTHER active sessions for this user
    const { data: otherSessions } = await supabase
      .from('UserSession')
      .select('id, deviceId, deviceName')
      .eq('userId', userId)
      .eq('isActive', true)
      .neq('deviceId', deviceId)

    if (!otherSessions || otherSessions.length === 0) {
      return new Response(JSON.stringify({ success: true, displaced: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Deactivate all other sessions
    await supabase
      .from('UserSession')
      .update({ isActive: false })
      .eq('userId', userId)
      .neq('deviceId', deviceId)

    // Send security alert email if we have user email
    if (userEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Ágata Segurança <adm@agatatranscription.com>',
          to: userEmail,
          subject: '⚠️ Novo acesso detectado na sua conta Ágata',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#d97706;padding:20px;border-radius:8px 8px 0 0">
                <h2 style="color:white;margin:0">⚠️ Novo acesso detectado</h2>
              </div>
              <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
                <p style="margin:0 0 16px">Detectamos um novo login na sua conta Ágata Transcription.</p>
                <p style="margin:0 0 16px"><strong>Dispositivo(s) anterior(es) foram desconectados automaticamente.</strong></p>
                <p style="margin:0 0 24px">Se não foi você, troque sua senha imediatamente:</p>
                <div style="text-align:center;margin:24px 0">
                  <a href="https://agatatranscription.com/settings/security"
                     style="background:#dc2626;color:white;padding:12px 24px;
                            border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
                    Trocar senha agora
                  </a>
                </div>
                <p style="font-size:12px;color:#6b7280;margin:0">
                  Se foi você quem fez este login, pode ignorar este e-mail.
                </p>
              </div>
            </div>
          `,
        }),
      })
    }

    return new Response(
      JSON.stringify({ success: true, displaced: otherSessions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('enforce-single-session error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
