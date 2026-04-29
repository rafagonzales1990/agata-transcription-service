import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let userIds: string[] | null = null
  try {
    const body = await req.json()
    if (Array.isArray(body?.userIds) && body.userIds.length > 0) userIds = body.userIds
  } catch (_) { /* no body */ }

  let query = supabase
    .from('User')
    .select('id, email, name, trialEndsAt')
    .eq('isInternal', false)

  if (userIds) {
    query = query.in('id', userIds)
  } else {
    query = query
      .eq('planId', 'basic')
      .not('trialEndsAt', 'is', null)
      .gt('trialEndsAt', new Date().toISOString())
  }

  const { data: users } = await query

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const user of users || []) {
    const { data: alreadySent } = await supabase
      .from('NurturingLog')
      .select('id')
      .eq('userId', user.id)
      .eq('emailType', 'trial_bonus')
      .maybeSingle()

    if (alreadySent) { skipped++; continue }

    try {
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'trial_bonus',
          to: user.email,
          data: {
            name: user.name || 'usuário',
            trialEndsAt: user.trialEndsAt,
          },
        },
      })

      await supabase.from('NurturingLog').insert({
        userId: user.id,
        emailType: 'trial_bonus',
        sentAt: new Date().toISOString(),
      })

      sent++
      console.log(`[blast] trial_bonus sent to ${user.email}`)
    } catch (err: any) {
      errors.push(`${user.email}: ${err.message}`)
    }
  }

  return new Response(JSON.stringify({ sent, skipped, errors }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
