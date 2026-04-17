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
    // ============================================================
    // 1) Trial expiring in 3-5 days (warn ~day 10 of 14-day trial)
    // ============================================================
    const in3days = new Date(now)
    in3days.setDate(in3days.getDate() + 3)
    const in5days = new Date(now)
    in5days.setDate(in5days.getDate() + 5)

    // Read from profiles.trial_ends_at (source of truth from handle_new_user)
    const { data: expiringProfiles } = await supabase
      .from('profiles')
      .select('user_id, email, name, trial_ends_at')
      .gte('trial_ends_at', in3days.toISOString())
      .lt('trial_ends_at', in5days.toISOString())

    for (const profile of expiringProfiles || []) {
      try {
        // Check if warning already sent (still tracked in User table)
        const { data: user } = await supabase
          .from('User')
          .select('id, trialWarningEmailSent')
          .eq('id', profile.user_id)
          .maybeSingle()

        if (!user || user.trialWarningEmailSent) continue

        await supabase.functions.invoke('send-email', {
          body: {
            type: 'trial_expiring',
            to: profile.email,
            data: { name: profile.name || 'Usuário' },
          },
        })
        await supabase.from('User').update({ trialWarningEmailSent: true }).eq('id', user.id)
        emailsSent++
      } catch (err) {
        errors.push(`trial_expiring ${profile.user_id}: ${String(err)}`)
      }
    }

    // ============================================================
    // 2) Trial expired — send email + auto-downgrade to basic
    // ============================================================
    const { data: expiredProfiles } = await supabase
      .from('profiles')
      .select('user_id, email, name, trial_ends_at, plan_id')
      .lt('trial_ends_at', now.toISOString())
      .not('trial_ends_at', 'is', null)

    for (const profile of expiredProfiles || []) {
      try {
        const { data: user } = await supabase
          .from('User')
          .select('id, trialExpiredEmailSent, planId')
          .eq('id', profile.user_id)
          .maybeSingle()

        if (!user || user.trialExpiredEmailSent) continue

        await supabase.functions.invoke('send-email', {
          body: {
            type: 'trial_expired',
            to: profile.email,
            data: { name: profile.name || 'Usuário' },
          },
        })

        // Mark email as sent
        await supabase
          .from('User')
          .update({ trialExpiredEmailSent: true })
          .eq('id', user.id)

        // Auto-downgrade to basic in BOTH tables for consistency
        // Only downgrade if user is not on a paid plan already
        if (!user.planId || user.planId === 'basic' || user.planId === 'inteligente') {
          await supabase.from('User').update({ planId: 'basic' }).eq('id', user.id)
          await supabase.from('profiles').update({ plan_id: 'basic' }).eq('user_id', profile.user_id)
        }

        emailsSent++
      } catch (err) {
        errors.push(`trial_expired ${profile.user_id}: ${String(err)}`)
      }
    }

    // ============================================================
    // 3) Upgrade suggestion (at 80% of limit) — once per month
    // ============================================================
    const currentMonth = now.toISOString().slice(0, 7)
    const { data: usages } = await supabase
      .from('Usage')
      .select('userId, transcriptionsUsed, upgradeSuggestionSentMonth')
      .eq('currentMonth', currentMonth)

    const planLimits: Record<string, number> = {
      basic: 5, inteligente: 15, automacao: 30, enterprise: 100,
    }
    const nextPlanNames: Record<string, string> = {
      basic: 'Inteligente', inteligente: 'Automação', automacao: 'Enterprise',
    }

    for (const usage of usages || []) {
      try {
        // Skip if already sent this month
        if (usage.upgradeSuggestionSentMonth === currentMonth) continue

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
              },
            },
          })

          // Mark as sent for this month
          await supabase
            .from('Usage')
            .update({ upgradeSuggestionSentMonth: currentMonth })
            .eq('userId', usage.userId)
            .eq('currentMonth', currentMonth)

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
