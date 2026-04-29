import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: users } = await supabase
    .from('User')
    .select('id, email, name, trialEndsAt')
    .eq('planId', 'basic')
    .eq('isInternal', false)
    .not('trialEndsAt', 'is', null)

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const user of users || []) {
    const { data: alreadySent } = await supabase
      .from('NurturingLog')
      .select('id')
      .eq('userId', user.id)
      .eq('emailType', 'trial_reactivation')
      .maybeSingle()

    if (alreadySent) { skipped++; continue }

    try {
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'trial_reactivation',
          to: user.email,
          data: {
            name: user.name || null,
            trialEndsAt: user.trialEndsAt,
          }
        }
      })

      await supabase.from('NurturingLog').insert({
        userId: user.id,
        emailType: 'trial_reactivation',
        sentAt: new Date().toISOString(),
      })

      sent++
      console.log(`[blast] trial_reactivation sent to ${user.email}`)
    } catch (err: any) {
      errors.push(`${user.email}: ${err.message}`)
    }
  }

  return new Response(JSON.stringify({ sent, skipped, errors }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
