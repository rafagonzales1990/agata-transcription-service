import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { token } = await req.json()
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token é obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: invite } = await supabaseAdmin
      .from('TeamInvite')
      .select('id, teamId, email, status, expiresAt')
      .eq('token', token)
      .maybeSingle()

    if (!invite) {
      return new Response(JSON.stringify({ error: 'Convite não encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (invite.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Convite já utilizado ou expirado' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (new Date(invite.expiresAt) < new Date()) {
      await supabaseAdmin.from('TeamInvite').update({ status: 'expired' }).eq('id', invite.id)
      return new Response(JSON.stringify({ error: 'Convite expirado. Solicite um novo convite ao administrador.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Associate user to team
    await supabaseAdmin.from('User').update({
      teamId: invite.teamId,
      planId: 'enterprise',
    }).eq('email', invite.email)

    // Mark invite as accepted
    await supabaseAdmin.from('TeamInvite').update({
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    }).eq('id', invite.id)

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Accept invite error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
