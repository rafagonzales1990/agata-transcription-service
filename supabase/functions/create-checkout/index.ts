import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from('Plan')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get or create Stripe customer
    let stripeCustomerId = profile?.cpf // Reusing a field? No, use old_user_id logic
    // Check User table for stripeCustomerId
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

      // Save to User table if exists
      if (oldUser) {
        await supabase.from('User').update({ stripeCustomerId: customerId }).eq('email', user.email!)
      }
    }

    // Calculate price
    const interval = billingCycle === 'yearly' ? 'year' : 'month'
    const unitAmount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly

    // Search for existing price
    const existingPrices = await stripe.prices.search({
      query: `metadata["planId"]:"${planId}" AND metadata["interval"]:"${interval}" AND active:"true"`,
    })

    let priceId: string
    const matchingPrice = existingPrices.data.find(p => p.unit_amount === unitAmount)

    if (matchingPrice) {
      priceId = matchingPrice.id
    } else {
      // Create product if needed
      const products = await stripe.products.search({
        query: `metadata["planId"]:"${planId}" AND active:"true"`,
      })

      let productId: string
      if (products.data.length > 0) {
        productId = products.data[0].id
      } else {
        const product = await stripe.products.create({
          name: `Ágata - ${plan.name}`,
          metadata: { planId },
        })
        productId = product.id
      }

      const price = await stripe.prices.create({
        product: productId,
        unit_amount: unitAmount,
        currency: 'brl',
        recurring: { interval },
        metadata: { planId, interval },
      })
      priceId = price.id
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

          // Update DB
          await supabase.from('profiles').update({
            plan_id: planId,
            billing_cycle: billingCycle,
          }).eq('user_id', user.id)

          if (oldUser) {
            await supabase.from('User').update({
              planId,
              billingCycle,
              stripePriceId: priceId,
            }).eq('email', user.email!)
          }

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
