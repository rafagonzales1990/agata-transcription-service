import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifyAdmin(supabase: any, authHeader: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error } = await authClient.auth.getUser()
  if (error || !user) return null

  const { data: userData } = await supabase
    .from('User')
    .select('id, isAdmin')
    .eq('id', user.id)
    .single()

  if (!userData?.isAdmin) return null
  return user
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const admin = await verifyAdmin(supabase, authHeader)
    if (!admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const userId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null

    if (req.method === 'GET') {
      const { data: users, error } = await supabase
        .from('User')
        .select('id, name, email, planId, billingCycle, isAdmin, isInternal, createdAt, trialEndsAt, stripeCustomerId, stripeSubscriptionId, stripePriceId, adminGroupId, teamId')
        .order('createdAt', { ascending: false })

      if (error) throw error

      const userIds = (users || []).map((u: any) => u.id)
      
      const [meetingCounts, usageData, groups] = await Promise.all([
        supabase.from('Meeting').select('userId, id').in('userId', userIds),
        supabase.from('Usage').select('userId, transcriptionsUsed, totalMinutesTranscribed, currentMonth'),
        supabase.from('AdminGroup').select('*'),
      ])

      const meetingCountMap: Record<string, number> = {}
      for (const m of meetingCounts.data || []) {
        meetingCountMap[m.userId] = (meetingCountMap[m.userId] || 0) + 1
      }

      const usageMap: Record<string, any> = {}
      for (const u of usageData.data || []) {
        usageMap[u.userId] = u
      }

      const groupMap: Record<string, any> = {}
      for (const g of groups.data || []) {
        groupMap[g.id] = g
      }

      const enriched = (users || []).map((u: any) => ({
        ...u,
        meetingCount: meetingCountMap[u.id] || 0,
        usage: usageMap[u.id] || null,
        group: u.adminGroupId ? groupMap[u.adminGroupId] || null : null,
      }))

      return new Response(JSON.stringify({ users: enriched, groups: groups.data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { name, email, password, planId, billingCycle, isAdmin: makeAdmin } = body

      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email and password required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { name: name || email.split('@')[0] },
      })

      if (authError) throw authError

      await supabase.from('User').insert({
        id: authUser.user.id,
        email,
        name: name || email.split('@')[0],
        planId: planId || 'basic',
        billingCycle: billingCycle || 'monthly',
        isAdmin: makeAdmin || false,
      })

      return new Response(JSON.stringify({ success: true, userId: authUser.user.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'PATCH') {
      const body = await req.json()
      const targetId = body.userId || userId
      if (!targetId) {
        return new Response(JSON.stringify({ error: 'userId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const updates: Record<string, any> = {}
      if (body.planId !== undefined) updates.planId = body.planId
      if (body.billingCycle !== undefined) updates.billingCycle = body.billingCycle
      if (body.isAdmin !== undefined) updates.isAdmin = body.isAdmin
      if (body.adminGroupId !== undefined) updates.adminGroupId = body.adminGroupId
      if (body.name !== undefined) updates.name = body.name

      const { error } = await supabase.from('User').update(updates).eq('id', targetId)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'DELETE') {
      const body = await req.json()
      const targetId = body.userId || userId
      if (!targetId) {
        return new Response(JSON.stringify({ error: 'userId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await supabase.from('User').delete().eq('id', targetId)
      await supabase.auth.admin.deleteUser(targetId)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('admin-users error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
