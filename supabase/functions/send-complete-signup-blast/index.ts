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
    .select('id, email, name, trialEndsAt, cpf, termsAcceptedAt')
    .eq('planId', 'basic')
    .not('trialEndsAt', 'is', null)
    .gt('trialEndsAt', new Date().toISOString())
    .eq('isInternal', false)

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const user of users || []) {
    const isIncomplete = !user.name || !user.cpf || !user.termsAcceptedAt
    if (!isIncomplete) { skipped++; continue }

    const { data: alreadySent } = await supabase
      .from('NurturingLog')
      .select('id')
      .eq('userId', user.id)
      .eq('emailType', 'complete_signup')
      .maybeSingle()

    if (alreadySent) { skipped++; continue }

    try {
      await supabase.functions.invoke('send-email', {
        body: {
          type: 'complete_signup',
          to: user.email,
          data: {
            name: user.name || null,
            trialEndsAt: user.trialEndsAt,
          }
        }
      })

      await supabase.from('NurturingLog').insert({
        userId: user.id,
        emailType: 'complete_signup',
        sentAt: new Date().toISOString(),
      })

      sent++
      console.log(`[blast] complete_signup sent to ${user.email}`)
    } catch (err: any) {
      errors.push(`${user.email}: ${err.message}`)
      console.error(`[blast] failed for ${user.email}:`, err)
    }
  }

  return new Response(JSON.stringify({ sent, skipped, errors }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
