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

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, teamId } = await req.json()
    if (!email || !teamId) {
      return new Response(JSON.stringify({ error: 'Email e teamId são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Verify caller is team owner or admin
    const { data: callerUser } = await supabaseAdmin
      .from('User')
      .select('id, name, email, teamId, isTeamOwner, isAdmin')
      .eq('id', user.id)
      .maybeSingle()

    if (!callerUser) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isAuthorized = callerUser.isAdmin || (callerUser.teamId === teamId && callerUser.isTeamOwner)
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Sem permissão para convidar membros neste time' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get team info
    const { data: team } = await supabaseAdmin
      .from('Team')
      .select('id, name, companyName, ownerId')
      .eq('id', teamId)
      .maybeSingle()

    if (!team) {
      return new Response(JSON.stringify({ error: 'Time não encontrado' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if email already a member of this team
    const { data: existingMember } = await supabaseAdmin
      .from('User')
      .select('id, email, name, teamId')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingMember && existingMember.teamId === teamId) {
      return new Response(JSON.stringify({ error: 'Usuário já é membro deste time' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create invite record
    const inviteStatus = existingMember && !existingMember.teamId ? 'accepted' : 'pending'
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('TeamInvite')
      .insert({
        teamId,
        invitedBy: user.id,
        email: normalizedEmail,
        status: inviteStatus,
        acceptedAt: inviteStatus === 'accepted' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (inviteError) {
      // Unique constraint violation = duplicate pending invite
      if (inviteError.code === '23505') {
        return new Response(JSON.stringify({ error: 'Já existe um convite pendente para este email' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw inviteError
    }

    const teamName = team.companyName || team.name
    const inviterName = callerUser.name || callerUser.email

    if (existingMember && !existingMember.teamId) {
      // Associate existing user to team
      await supabaseAdmin.from('User').update({
        teamId,
        planId: 'enterprise',
      }).eq('id', existingMember.id)

      // Send "you were added" email
      await supabaseAdmin.functions.invoke('send-email', {
        body: {
          type: 'team_member_added',
          to: normalizedEmail,
          data: {
            name: existingMember.name || normalizedEmail.split('@')[0],
            teamName,
            inviterName,
            dashboardUrl: 'https://agatatranscription.lovable.app/dashboard',
          }
        }
      })

      return new Response(JSON.stringify({ success: true, type: 'existing_user_added' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (!existingMember) {
      // Send invitation email with signup link
      const signupUrl = `https://agatatranscription.lovable.app/auth/signup?invite=${invite.token}&email=${encodeURIComponent(normalizedEmail)}&team=${teamId}`

      await supabaseAdmin.functions.invoke('send-email', {
        body: {
          type: 'team_invite',
          to: normalizedEmail,
          data: {
            teamName,
            inviterName,
            signupUrl,
            expiresIn: '7 dias',
          }
        }
      })

      return new Response(JSON.stringify({ success: true, type: 'invite_sent' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else {
      return new Response(JSON.stringify({ error: 'Usuário já é membro de outro time' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Invite error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
