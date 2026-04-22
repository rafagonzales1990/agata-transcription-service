import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STRIPE_PRICES: Record<string, { monthly: string; annual: string; annual_upfront: string }> = {
  inteligente: {
    monthly:        'price_1TP3mhFadSjglwHIiWU3TMcn',
    annual:         'price_1TP3moFadSjglwHIzMtLp79M',
    annual_upfront: 'price_1TP3mvFadSjglwHIumBHCZ2N',
  },
  automacao: {
    monthly:        'price_1TP3n0FadSjglwHIqmkA4etb',
    annual:         'price_1TP3n5FadSjglwHITmKUgjgN',
    annual_upfront: 'price_1TP3nBFadSjglwHIM52JMQv2',
  },
  enterprise: {
    monthly:        'price_1TK4xaFadSjglwHIggSyDPti',
    annual:         'price_1TK4xdFadSjglwHIiK3NqTKL',
    annual_upfront: 'price_1TK4xgFadSjglwHIrHSkPiUH',
  },
}

const PLAN_VALUES: Record<string, Record<string, number>> = {
  inteligente: { monthly: 53, annual: 37, annual_upfront: 408 },
  automacao:   { monthly: 196, annual: 137, annual_upfront: 1524 },
  enterprise:  { monthly: 0, yearly: 0, annual_upfront: 0 },
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
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { planId, billingCycle } = await req.json()
    if (!planId || !billingCycle) {
      return new Response(JSON.stringify({ error: 'planId and billingCycle required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Look up the fixed Stripe price ID
    const planPrices = STRIPE_PRICES[planId]
    if (!planPrices) {
      return new Response(JSON.stringify({ error: 'Plan not found or not subscribable' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const priceId = billingCycle === 'annual_upfront'
      ? planPrices.annual_upfront
      : billingCycle === 'annual'
        ? planPrices.annual
        : planPrices.monthly

    const planValue = PLAN_VALUES[planId]?.[billingCycle] ?? 0

    console.log(`Checkout: planId=${planId} billingCycle=${billingCycle} priceId=${priceId}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })

    // Get or create Stripe customer
    const { data: oldUser } = await supabase
      .from('User')
      .select('stripeCustomerId, stripeSubscriptionId')
      .eq('email', user.email)
      .maybeSingle()

    let customerId = oldUser?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { userId: user.id },
      })
      customerId = customer.id

      if (oldUser) {
        await supabase.from('User').update({ stripeCustomerId: customerId }).eq('email', user.email!)
      }
    }

    // Check if user has active subscription to upgrade
    if (oldUser?.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(oldUser.stripeSubscriptionId)
        if (sub.status === 'active' || sub.status === 'trialing') {
          await stripe.subscriptions.update(oldUser.stripeSubscriptionId, {
            items: [{ id: sub.items.data[0].id, price: priceId }],
            proration_behavior: 'create_prorations',
          })

          await supabase.from('profiles').update({
            plan_id: planId,
            billing_cycle: billingCycle,
          }).eq('user_id', user.id)

          await supabase.from('User').update({
            planId,
            billingCycle,
            stripePriceId: priceId,
          }).eq('email', user.email!)

          return new Response(JSON.stringify({ success: true, type: 'upgrade', planId, billingCycle, value: planValue }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } catch (e) {
        console.log('Subscription not found or expired, creating new checkout')
      }
    }

    // Create checkout session
    const origin = req.headers.get('origin') || 'https://agatatranscription.lovable.app'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/plans?success=true&plan=${planId}&billing=${billingCycle}&value=${planValue}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/plans?canceled=true`,
      subscription_data: {
        metadata: { userId: user.id, planId, billingCycle },
      },
    })

    return new Response(JSON.stringify({ url: session.url, type: 'checkout' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Create checkout error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
