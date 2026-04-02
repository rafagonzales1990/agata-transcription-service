import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const now = new Date()
  let emailsSent = 0
  const errors: string[] = []

  try {
    // Trial expiring in 7 days
    const in7days = new Date(now)
    in7days.setDate(in7days.getDate() + 7)
    const in8days = new Date(now)
    in8days.setDate(in8days.getDate() + 8)

    const { data: expiring } = await supabase
      .from('User')
      .select('id, email, name, trialEndsAt')
      .eq('trialWarningEmailSent', false)
      .gte('trialEndsAt', in7days.toISOString())
      .lt('trialEndsAt', in8days.toISOString())

    for (const user of expiring || []) {
      try {
        await supabase.functions.invoke('send-email', {
          body: { type: 'trial_expiring', to: user.email, data: { name: user.name || 'Usuário' } }
        })
        await supabase.from('User').update({ trialWarningEmailSent: true }).eq('id', user.id)
        emailsSent++
      } catch (err) {
        errors.push(`trial_expiring ${user.id}: ${String(err)}`)
      }
    }

    // Trial expired today
    const { data: expired } = await supabase
      .from('User')
      .select('id, email, name')
      .eq('trialExpiredEmailSent', false)
      .lt('trialEndsAt', now.toISOString())
      .not('trialEndsAt', 'is', null)

    for (const user of expired || []) {
      try {
        await supabase.functions.invoke('send-email', {
          body: { type: 'trial_expired', to: user.email, data: { name: user.name || 'Usuário' } }
        })
        await supabase.from('User').update({ trialExpiredEmailSent: true }).eq('id', user.id)
        emailsSent++
      } catch (err) {
        errors.push(`trial_expired ${user.id}: ${String(err)}`)
      }
    }

    // Upgrade suggestion (at 80% of limit)
    const currentMonth = now.toISOString().slice(0, 7)
    const { data: usages } = await supabase
      .from('Usage')
      .select('userId, transcriptionsUsed')
      .eq('currentMonth', currentMonth)

    const planLimits: Record<string, number> = {
      basic: 5, inteligente: 15, automacao: 30, enterprise: 100
    }
    const nextPlanNames: Record<string, string> = {
      basic: 'Inteligente', inteligente: 'Automação', automacao: 'Enterprise'
    }

    for (const usage of usages || []) {
      try {
        const { data: user } = await supabase
          .from('User')
          .select('email, name, planId')
          .eq('id', usage.userId)
          .maybeSingle()

        if (!user || user.planId === 'enterprise') continue
        const limit = planLimits[user.planId || 'basic'] || 5
        const pct = (usage.transcriptionsUsed / limit) * 100
        if (pct >= 80 && pct < 100) {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'upgrade_suggestion',
              to: user.email,
              data: {
                name: user.name || 'Usuário',
                used: usage.transcriptionsUsed,
                max: limit,
                nextPlan: nextPlanNames[user.planId || 'basic'] || 'Inteligente',
              }
            }
          })
          emailsSent++
        }
      } catch (err) {
        errors.push(`upgrade ${usage.userId}: ${String(err)}`)
      }
    }

    console.log(`Check-trials completed: ${emailsSent} emails sent, ${errors.length} errors`)

    return new Response(
      JSON.stringify({ emailsSent, errors }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Check-trials error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
