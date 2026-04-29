import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: users } = await supabase
    .from('User')
    .select('id, email, name, trialEndsAt')
    .eq('planId', 'basic')
    .not('trialEndsAt', 'is', null)
    .gt('trialEndsAt', new Date().toISOString())
    .eq('isInternal', false)

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
