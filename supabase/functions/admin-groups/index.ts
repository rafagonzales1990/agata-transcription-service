import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
    .select('id, isAdmin, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!userData?.isAdmin && userData?.role !== 'dev') return null
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

    if (req.method === 'GET') {
      const { data: groups } = await supabase
        .from('AdminGroup')
        .select('*, isGift, isInternal, companyName, companyCNPJ')
        .order('createdAt', { ascending: false })

      const { data: users } = await supabase
        .from('User')
        .select('adminGroupId')

      const countMap: Record<string, number> = {}
      for (const u of users || []) {
        if (u.adminGroupId) {
          countMap[u.adminGroupId] = (countMap[u.adminGroupId] || 0) + 1
        }
      }

      const enriched = (groups || []).map((g: any) => ({
        ...g,
        memberCount: countMap[g.id] || 0,
      }))

      return new Response(JSON.stringify({ groups: enriched }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()

      // Gift action: apply gift plan to all users in a group
      if (body.action === 'gift') {
        const { groupId, giftPlanId, days } = body
        if (!groupId || !giftPlanId || !days) {
          return new Response(JSON.stringify({ error: 'groupId, giftPlanId, days required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const giftExpiresAt = new Date(Date.now() + days * 86400000).toISOString()

        const { data: users } = await supabase
          .from('User')
          .select('id')
          .eq('adminGroupId', groupId)

        for (const user of users || []) {
          await supabase.from('User').update({ giftPlanId, giftEndsAt: giftExpiresAt, planId: giftPlanId })
            .eq('id', user.id)
        }

        return new Response(JSON.stringify({ success: true, usersUpdated: users?.length || 0, giftExpiresAt }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Create group
      const { name, description, color, tier, usersBase, maxTranscriptions, maxDurationMinutes,
              maxTotalMinutesMonth, audioDurationAddon, isGift, isInternal, companyName, companyCNPJ } = body
      if (!name) {
        return new Response(JSON.stringify({ error: 'Name required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data, error } = await supabase
        .from('AdminGroup')
        .insert({
          name, description: description || null, color: color || '#10B981',
          tier: tier || null, usersBase: usersBase || null,
          maxTranscriptions: maxTranscriptions || null,
          maxDurationMinutes: maxDurationMinutes || null,
          maxTotalMinutesMonth: maxTotalMinutesMonth || null,
          audioDurationAddon: audioDurationAddon || null,
          isGift: isGift ?? false,
          isInternal: isInternal ?? false,
          companyName: companyName || null,
          companyCNPJ: companyCNPJ || null,
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({ group: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'PATCH') {
      const body = await req.json()
      const { groupId, name, description, color,
              tier, usersBase, maxTranscriptions,
              maxDurationMinutes, maxTotalMinutesMonth,
              audioDurationAddon, isGift, isInternal, companyName, companyCNPJ } = body
      if (!groupId) {
        return new Response(JSON.stringify({ error: 'groupId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const updates: Record<string, any> = {}
      if (name !== undefined) updates.name = name
      if (description !== undefined) updates.description = description
      if (color !== undefined) updates.color = color
      if (tier !== undefined) updates.tier = tier
      if (usersBase !== undefined) updates.usersBase = usersBase
      if (maxTranscriptions !== undefined) updates.maxTranscriptions = maxTranscriptions
      if (maxDurationMinutes !== undefined) updates.maxDurationMinutes = maxDurationMinutes
      if (maxTotalMinutesMonth !== undefined) updates.maxTotalMinutesMonth = maxTotalMinutesMonth
      if (audioDurationAddon !== undefined) updates.audioDurationAddon = audioDurationAddon
      if (isGift !== undefined) updates.isGift = isGift
      if (isInternal !== undefined) updates.isInternal = isInternal
      if (companyName !== undefined) updates.companyName = companyName
      if (companyCNPJ !== undefined) updates.companyCNPJ = companyCNPJ

      const { error } = await supabase.from('AdminGroup').update(updates).eq('id', groupId)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'DELETE') {
      const body = await req.json()
      const { groupId } = body
      if (!groupId) {
        return new Response(JSON.stringify({ error: 'groupId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: usersInGroup } = await supabase
        .from('User')
        .select('id')
        .eq('adminGroupId', groupId)

      if (usersInGroup && usersInGroup.length > 0) {
        return new Response(JSON.stringify({ error: 'Grupo possui membros. Remova-os primeiro.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error } = await supabase.from('AdminGroup').delete().eq('id', groupId)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('admin-groups error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
