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

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  console.log('Stripe webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.subscription
          ? (await stripe.subscriptions.retrieve(session.subscription as string)).metadata
          : session.metadata

        const userId = metadata?.userId
        const planId = metadata?.planId
        const billingCycle = metadata?.billingCycle

        if (userId && planId) {
          // Update profiles
          await supabase.from('profiles').update({
            plan_id: planId,
            billing_cycle: billingCycle || 'monthly',
            trial_ends_at: null,
          }).eq('user_id', userId)

          // Update User table
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', userId)
            .single()

          if (profile?.email) {
            await supabase.from('User').update({
              planId,
              billingCycle: billingCycle || 'monthly',
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: null, // will be set by subscription.updated
              trialEndsAt: null,
            }).eq('email', profile.email)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: oldUser } = await supabase
          .from('User')
          .select('id, email')
          .eq('stripeCustomerId', customerId)
          .maybeSingle()

        if (oldUser && (subscription.status === 'active' || subscription.status === 'trialing')) {
          const priceId = subscription.items.data[0]?.price?.id
          const planId = subscription.items.data[0]?.price?.metadata?.planId
          const interval = subscription.items.data[0]?.price?.recurring?.interval
          const billingCycle = interval === 'year' ? 'yearly' : 'monthly'

          if (planId) {
            await supabase.from('User').update({
              planId,
              billingCycle,
              stripeSubscriptionId: subscription.id,
              stripePriceId: priceId,
            }).eq('id', oldUser.id)

            // Also update profiles
            await supabase.from('profiles').update({
              plan_id: planId,
              billing_cycle: billingCycle,
            }).eq('email', oldUser.email)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: oldUser } = await supabase
          .from('User')
          .select('id, email')
          .eq('stripeCustomerId', customerId)
          .maybeSingle()

        if (oldUser) {
          await supabase.from('User').update({
            planId: 'basic',
            billingCycle: 'monthly',
            stripeSubscriptionId: null,
            stripePriceId: null,
          }).eq('id', oldUser.id)

          await supabase.from('profiles').update({
            plan_id: 'basic',
            billing_cycle: 'monthly',
          }).eq('email', oldUser.email)
        }
        break
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ error: 'Processing failed' }), { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
