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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Bind invocation to the authenticated caller — prevents anyone from
    // creating User rows for other auth.users IDs.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: authUser }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !authUser) {
      console.error('initialize-user auth failed:', authErr)
      return new Response(JSON.stringify({ error: 'invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const { name, email, id } = body as { name?: string; email?: string; id?: string }

    if (!id || !email || !name) {
      return new Response(JSON.stringify({ error: 'id, email and name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (id !== authUser.id) {
      return new Response(JSON.stringify({ error: 'id does not match authenticated user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: existing, error: selectErr } = await admin
      .from('User')
      .select('id, name, trialEndsAt')
      .eq('id', id)
      .maybeSingle()

    if (selectErr) {
      console.error('initialize-user select failed:', selectErr)
      return new Response(
        JSON.stringify({ error: 'select failed', detail: selectErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    // 1) Row inexistente — INSERT com todos os campos obrigatorios
    if (!existing) {
      const { error: insertErr } = await admin.from('User').insert({
        id,
        email,
        name,
        planId: 'basic',
        role: 'user',
        trialEndsAt,
      })

      if (insertErr) {
        console.error('initialize-user insert failed:', insertErr)
        return new Response(
          JSON.stringify({ error: 'insert failed', detail: insertErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      return new Response(JSON.stringify({ success: true, created: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const existingRow = existing as { name: string | null; trialEndsAt: string | null }

    // 2) Row existente — patch apenas dos campos null (equivalente a
    //    SET name = COALESCE(name, $newName),
    //        trialEndsAt = COALESCE(trialEndsAt, now() + interval '14 days'))
    const patch: Record<string, string> = {}
    if (!existingRow.name && name) patch.name = name
    if (!existingRow.trialEndsAt) patch.trialEndsAt = trialEndsAt

    if (Object.keys(patch).length > 0) {
      const { error: updateErr } = await admin
        .from('User')
        .update(patch)
        .eq('id', id)

      if (updateErr) {
        console.error('initialize-user update failed:', updateErr)
        return new Response(
          JSON.stringify({ error: 'update failed', detail: updateErr.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      return new Response(JSON.stringify({ success: true, updated: true, patched: Object.keys(patch) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3) Row existente com name e trialEndsAt preenchidos — no-op
    return new Response(JSON.stringify({ success: true, created: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('initialize-user error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
