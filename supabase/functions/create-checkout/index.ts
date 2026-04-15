import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STRIPE_PRICES: Record<string, { monthly: string; annual: string; annual_upfront: string }> = {
  inteligente: {
    monthly:        'price_1TMZz0FadSjglwHIm3THKpZZ',
    annual:         'price_1TMZz4FadSjglwHIOr1pi7x9',
    annual_upfront: 'price_1TMZz8FadSjglwHIgaJHAA2u',
  },
  automacao: {
    monthly:        'price_1TMZzBFadSjglwHIKxVdb4y1',
    annual:         'price_1TMZzEFadSjglwHI3p7GhXRb',
    annual_upfront: 'price_1TMZzIFadSjglwHIUlksn0FY',
  },
  enterprise: {
    monthly:        'price_1TK4xaFadSjglwHIggSyDPti',
    annual:         'price_1TK4xdFadSjglwHIiK3NqTKL',
    annual_upfront: 'price_1TK4xgFadSjglwHIrHSkPiUH',
  },
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
      : billingCycle === 'yearly'
        ? planPrices.annual
        : planPrices.monthly

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

          return new Response(JSON.stringify({ success: true, type: 'upgrade' }), {
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
      success_url: `${origin}/plans?success=true&session_id={CHECKOUT_SESSION_ID}`,
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
