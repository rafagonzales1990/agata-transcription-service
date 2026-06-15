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

        const subscription = session.subscription
          ? await stripe.subscriptions.retrieve(session.subscription as string)
          : null

        const metadata = subscription?.metadata ?? session.metadata
        const userId  = metadata?.userId
        const planId  = metadata?.planId
        const billingCycle = metadata?.billingCycle || 'monthly'
        const customerId   = session.customer as string

        console.log('checkout.session.completed — userId:', userId, 'planId:', planId)

        if (!userId || !planId) {
          console.error('Metadata ausente — userId ou planId não encontrado')
          break
        }

        // Buscar usuário direto na tabela User (sem profiles)
        const { data: user, error: userErr } = await supabase
          .from('User')
          .select('id, email, name')
          .eq('id', userId)
          .maybeSingle()

        if (userErr || !user) {
          console.error('Usuário não encontrado para userId:', userId, userErr)
          break
        }

        // Atualizar User (service_role bypassa o trigger agora)
        const { error: updateErr } = await supabase.from('User').update({
          planId,
          billingCycle,
          stripeCustomerId:     customerId,
          stripeSubscriptionId: session.subscription as string,
          stripePriceId:        subscription?.items.data[0]?.price?.id ?? null,
          trialEndsAt:          null,
        }).eq('id', userId)

        if (updateErr) {
          console.error('Erro ao atualizar User:', updateErr)
          break
        }

        console.log('User atualizado com sucesso:', user.email, '→', planId)

        // E-mail de confirmação de pagamento
        const planNames: Record<string, string> = {
          inteligente: 'Essencial',
          automacao:   'Pro',
          enterprise:  'Enterprise',
        }

        try {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'payment_confirmed',
              to:   user.email,
              data: {
                name:     user.name || 'Usuário',
                planName: planNames[planId] || planId,
              },
            },
          })
          console.log('E-mail payment_confirmed enviado para:', user.email)
        } catch (emailErr) {
          console.error('Erro ao enviar e-mail de confirmação:', emailErr)
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
          const metaBillingCycle = subscription.metadata?.billingCycle
          const billingCycle = metaBillingCycle || (interval === 'year' ? 'yearly' : 'monthly')

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
