import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const PLAN_TO_GROUP_NAME: Record<string, string> = {
  basic: 'Plano Gratuito',
  inteligente: 'Plano Essencial',
  automacao: 'Plano Pro',
}

const TESTERS_GROUP_NAME = 'Testers'

const ok = (data: any) =>
  new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const fail = (status: number, error: string) =>
  new Response(JSON.stringify({ success: false, data: null, error }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

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

async function logAction(
  supabase: any,
  userId: string,
  action: string,
  affectedCount: number,
  result: any,
) {
  try {
    await supabase.from('AdminActionLog').insert({
      userId,
      action,
      affectedCount,
      result,
      executedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[admin-actions] log failed:', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW — count affected rows for each action without side effects
// ─────────────────────────────────────────────────────────────────────────────
async function preview(supabase: any) {
  const nowIso = new Date().toISOString()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString()

  const { count: resetTrials } = await supabase
    .from('User')
    .select('id', { count: 'exact', head: true })
    .eq('planId', 'basic')
    .or('isInternal.is.null,isInternal.eq.false')

  // assignGroups: basic users without an adminGroupId (rough proxy — full
  // mismatch detection would require fetching group names per user)
  const { count: assignGroups } = await supabase
    .from('User')
    .select('id', { count: 'exact', head: true })
    .eq('planId', 'basic')
    .is('adminGroupId', null)

  const { count: cleanLogs } = await supabase
    .from('NurturingLog')
    .select('id', { count: 'exact', head: true })
    .lt('sentAt', ninetyDaysAgo)

  const { data: trialBasicUsers } = await supabase
    .from('User')
    .select('id')
    .eq('planId', 'basic')
    .eq('isInternal', false)
    .not('trialEndsAt', 'is', null)
    .gt('trialEndsAt', nowIso)

  const trialUserIds = (trialBasicUsers || []).map((u: any) => u.id)
  let trialBonus = 0
  let completeSignup = 0
  if (trialUserIds.length > 0) {
    const { data: bonusLogs } = await supabase
      .from('NurturingLog')
      .select('userId')
      .eq('emailType', 'trial_bonus')
      .in('userId', trialUserIds)
    const bonusSet = new Set((bonusLogs || []).map((l: any) => l.userId))
    trialBonus = trialUserIds.filter((id: string) => !bonusSet.has(id)).length

    const { data: incompleteUsers } = await supabase
      .from('User')
      .select('id, name, cpf, termsAcceptedAt')
      .in('id', trialUserIds)
    const { data: completeLogs } = await supabase
      .from('NurturingLog')
      .select('userId')
      .eq('emailType', 'complete_signup')
      .in('userId', trialUserIds)
    const completeSet = new Set((completeLogs || []).map((l: any) => l.userId))
    completeSignup = (incompleteUsers || []).filter(
      (u: any) =>
        (!u.name || !u.cpf || !u.termsAcceptedAt) && !completeSet.has(u.id),
    ).length
  }

  const { data: allBasic } = await supabase
    .from('User')
    .select('id')
    .eq('planId', 'basic')
    .eq('isInternal', false)
    .not('trialEndsAt', 'is', null)
  const basicIds = (allBasic || []).map((u: any) => u.id)
  let reactivation = 0
  if (basicIds.length > 0) {
    const { data: reactLogs } = await supabase
      .from('NurturingLog')
      .select('userId')
      .eq('emailType', 'trial_reactivation')
      .in('userId', basicIds)
    const reactSet = new Set((reactLogs || []).map((l: any) => l.userId))
    reactivation = basicIds.filter((id: string) => !reactSet.has(id)).length
  }

  return {
    resetTrials: resetTrials || 0,
    assignGroups: assignGroups || 0,
    cleanLogs: cleanLogs || 0,
    trialBonus,
    completeSignup,
    reactivation,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA MANAGEMENT ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
async function resetTrials(supabase: any, userIds?: string[]) {
  if (userIds && userIds.length > 0) {
    const trialEndsAt = new Date(Date.now() + 14 * 86400000).toISOString()
    const { error } = await supabase
      .from('User')
      .update({ trialEndsAt })
      .in('id', userIds)
    if (error) throw new Error(`reset_trials (filtered) failed: ${error.message}`)
    return { affected: userIds.length }
  }
  const { data, error } = await supabase.rpc('reset_basic_trials_bulk')
  if (error) throw new Error(`reset_basic_trials_bulk failed: ${error.message}`)
  return { affected: data ?? 0 }
}

async function assignGroups(supabase: any, userIds?: string[]) {
  const { data: groups } = await supabase
    .from('AdminGroup')
    .select('id, name')

  const groupByName: Record<string, string> = {}
  for (const g of groups || []) groupByName[g.name] = g.id
  const testersId = groupByName[TESTERS_GROUP_NAME]

  let affected = 0
  for (const planId of Object.keys(PLAN_TO_GROUP_NAME)) {
    const targetGroupId = groupByName[PLAN_TO_GROUP_NAME[planId]]
    if (!targetGroupId) continue

    let query = supabase
      .from('User')
      .select('id, adminGroupId')
      .eq('planId', planId)
    if (testersId) query = query.or(`adminGroupId.is.null,adminGroupId.neq.${testersId}`)
    if (userIds && userIds.length > 0) query = query.in('id', userIds)

    const { data: candidates } = await query
    const toUpdate = (candidates || []).filter(
      (u: any) =>
        u.adminGroupId !== targetGroupId &&
        (!testersId || u.adminGroupId !== testersId),
    )

    if (toUpdate.length === 0) continue

    const ids = toUpdate.map((u: any) => u.id)
    const { error } = await supabase
      .from('User')
      .update({ adminGroupId: targetGroupId })
      .in('id', ids)
    if (error) throw new Error(`assign_groups (${planId}) failed: ${error.message}`)
    affected += toUpdate.length
  }
  return { affected }
}

async function cleanLogs(supabase: any) {
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString()
  const { data, error } = await supabase
    .from('NurturingLog')
    .delete()
    .lt('sentAt', cutoff)
    .select('id')
  if (error) throw new Error(`clean_logs failed: ${error.message}`)
  return { deleted: data?.length || 0 }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNICATION BLASTS — invoke existing blast functions
// ─────────────────────────────────────────────────────────────────────────────
async function invokeBlast(supabase: any, fnName: string, userIds?: string[]) {
  const body = userIds && userIds.length > 0 ? { userIds } : {}
  const { data, error } = await supabase.functions.invoke(fnName, { body })
  if (error) throw new Error(`${fnName} failed: ${error.message}`)
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL MARKETING
// ─────────────────────────────────────────────────────────────────────────────
async function sendTestEmail(supabase: any, params: { type: string; subject: string }) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      type: params.type,
      to: 'adm@agatatranscription.com',
      data: { name: 'Admin Test', subject: params.subject },
    },
  })
  if (error) throw new Error(`send_test_email failed: ${error.message}`)
  return { success: true, response: data }
}

async function blastMarketing(
  supabase: any,
  params: { type: string; subject: string; audience: string },
) {
  const nowIso = new Date().toISOString()
  let query = supabase.from('User').select('id, email, name, cpf, termsAcceptedAt, planId, trialEndsAt')

  switch (params.audience) {
    case 'all':
      query = query
        .eq('isInternal', false)
        .in('planId', ['basic', 'inteligente', 'automacao', 'enterprise'])
      break
    case 'trial_active':
      query = query
        .eq('planId', 'basic')
        .eq('isInternal', false)
        .gt('trialEndsAt', nowIso)
      break
    case 'paid':
      query = query
        .eq('isInternal', false)
        .in('planId', ['inteligente', 'automacao', 'enterprise'])
      break
    case 'incomplete':
      query = query.eq('isInternal', false)
      break
    default:
      throw new Error(`Unknown audience: ${params.audience}`)
  }

  const { data: users, error } = await query
  if (error) throw new Error(`fetch users failed: ${error.message}`)

  let recipients = users || []
  if (params.audience === 'incomplete') {
    recipients = recipients.filter(
      (u: any) => !u.name || !u.cpf || !u.termsAcceptedAt,
    )
  }

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const user of recipients) {
    if (!user.email) { skipped++; continue }
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          type: params.type,
          to: user.email,
          data: { name: user.name || 'usuário', subject: params.subject },
        },
      })
      await supabase.from('NurturingLog').insert({
        userId: user.id,
        emailType: params.type,
        sentAt: new Date().toISOString(),
      })
      sent++
    } catch (err: any) {
      errors.push(`${user.email}: ${err.message}`)
    }
  }

  return { sent, skipped, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return fail(401, 'Unauthorized')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const admin = await verifyAdmin(supabase, authHeader)
    if (!admin) return fail(403, 'Forbidden')

    if (req.method !== 'POST') return fail(405, 'Method not allowed')

    const body = await req.json().catch(() => ({}))
    const action: string = body.action
    const params = body.params || {}

    if (!action) return fail(400, 'action is required')

    let result: any
    let affectedCount = 0
    const dataActions = new Set([
      'reset_trials',
      'assign_groups',
      'clean_logs',
      'blast_trial_bonus',
      'blast_complete_signup',
      'blast_reactivation',
      'blast_marketing',
      'send_test_email',
    ])

    switch (action) {
      case 'preview':
        result = await preview(supabase)
        return ok(result)

      case 'last_runs': {
        const { data: runs } = await supabase
          .from('AdminActionLog')
          .select('action, executedAt')
          .order('executedAt', { ascending: false })

        const lastRunMap: Record<string, { executedAt: string; affectedCount: number }> = {}
        for (const run of runs || []) {
          if (!lastRunMap[run.action]) {
            lastRunMap[run.action] = { executedAt: run.executedAt, affectedCount: 0 }
          }
        }
        return ok(lastRunMap)
      }

      case 'list_affected_users': {
        const actionType = params?.actionType
        const audience = params?.audience || 'all'

        let query = supabase
          .from('User')
          .select('id, email, name, planId, trialEndsAt, cpf, termsAcceptedAt, createdAt')
          .eq('isInternal', false)

        if (actionType === 'reset_trials' || actionType === 'blast_reactivation') {
          query = query.eq('planId', 'basic')
        } else if (actionType === 'blast_trial_bonus') {
          query = query
            .eq('planId', 'basic')
            .not('trialEndsAt', 'is', null)
            .gt('trialEndsAt', new Date().toISOString())
        } else if (actionType === 'blast_complete_signup') {
          query = query
            .eq('planId', 'basic')
            .not('trialEndsAt', 'is', null)
            .gt('trialEndsAt', new Date().toISOString())
        } else if (actionType === 'assign_groups') {
          query = query
            .eq('planId', 'basic')
            .is('adminGroupId', null)
        } else if (actionType === 'blast_marketing') {
          if (audience === 'trial_active') {
            query = query
              .eq('planId', 'basic')
              .not('trialEndsAt', 'is', null)
              .gt('trialEndsAt', new Date().toISOString())
          } else if (audience === 'paid') {
            query = query.in('planId', ['inteligente', 'automacao', 'enterprise'])
          } else if (audience === 'incomplete') {
            query = query
              .eq('planId', 'basic')
              .or('name.is.null,cpf.is.null,termsAcceptedAt.is.null')
          }
        }

        const { data: users } = await query.order('createdAt', { ascending: false })

        const mapped = (users || []).map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name || '—',
          planId: u.planId,
          status: !u.name || !u.cpf || !u.termsAcceptedAt
            ? 'Cadastro incompleto'
            : u.trialEndsAt && new Date(u.trialEndsAt) > new Date()
            ? 'Trial ativo'
            : u.trialEndsAt && new Date(u.trialEndsAt) <= new Date()
            ? 'Trial expirado'
            : 'Gratuito',
          trialEndsAt: u.trialEndsAt,
        }))

        return ok({ users: mapped, total: mapped.length })
      }

      case 'preview_audience': {
        const audience = params?.audience || 'all'
        let query = supabase
          .from('User')
          .select('id', { count: 'exact', head: true })
          .eq('isInternal', false)

        if (audience === 'trial_active') {
          query = query
            .eq('planId', 'basic')
            .not('trialEndsAt', 'is', null)
            .gt('trialEndsAt', new Date().toISOString())
        } else if (audience === 'paid') {
          query = query.in('planId', ['inteligente', 'automacao', 'enterprise'])
        } else if (audience === 'incomplete') {
          query = query
            .eq('planId', 'basic')
            .or('name.is.null,cpf.is.null,termsAcceptedAt.is.null')
        }

        const { count } = await query
        return ok({ count: count || 0 })
      }

      case 'reset_trials':
        result = await resetTrials(supabase, params?.userIds)
        affectedCount = result.affected
        break
      case 'assign_groups':
        result = await assignGroups(supabase, params?.userIds)
        affectedCount = result.affected
        break
      case 'clean_logs':
        result = await cleanLogs(supabase)
        affectedCount = result.deleted
        break

      case 'blast_trial_bonus':
        result = await invokeBlast(supabase, 'send-trial-bonus-blast', params?.userIds)
        affectedCount = result?.sent || 0
        break
      case 'blast_complete_signup':
        result = await invokeBlast(supabase, 'send-complete-signup-blast', params?.userIds)
        affectedCount = result?.sent || 0
        break
      case 'blast_reactivation':
        result = await invokeBlast(supabase, 'send-reactivation-blast', params?.userIds)
        affectedCount = result?.sent || 0
        break

      case 'send_test_email':
        if (!params.type || !params.subject) return fail(400, 'type and subject required')
        result = await sendTestEmail(supabase, params)
        break
      case 'blast_marketing':
        if (!params.type || !params.subject || !params.audience) {
          return fail(400, 'type, subject, audience required')
        }
        result = await blastMarketing(supabase, params)
        affectedCount = result?.sent || 0
        break

      default:
        return fail(400, `Unknown action: ${action}`)
    }

    if (dataActions.has(action)) {
      await logAction(supabase, admin.id, action, affectedCount, result)
    }

    return ok(result)
  } catch (err) {
    console.error('[admin-actions] error:', err)
    return fail(500, (err as Error).message)
  }
})
