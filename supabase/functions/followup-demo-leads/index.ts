import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const h72ago = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()

    // 24h followup: demo completed > 24h ago, no trial, not sent yet
    const { data: leads24h } = await supabase
      .from('Lead')
      .select('id, email, name, persona')
      .eq('status', 'demo_completed')
      .is('userId', null)
      .is('trialStartedAt', null)
      .eq('demoFollowup24hSent', false)
      .lt('demoCompletedAt', h24ago)
      .not('email', 'is', null)
      .limit(50)

    let sent24 = 0
    for (const lead of leads24h || []) {
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'demo-followup-24h',
            to: lead.email!,
            data: { name: lead.name || 'Visitante', persona: lead.persona },
          }
        })
        await supabase.from('Lead').update({ demoFollowup24hSent: true }).eq('id', lead.id)
        sent24++
      } catch (e) {
        console.error(`Failed 24h followup for lead ${lead.id}:`, e)
      }
    }

    // 72h followup: demo completed > 72h ago, no trial, not sent yet
    const { data: leads72h } = await supabase
      .from('Lead')
      .select('id, email, name, persona')
      .eq('status', 'demo_completed')
      .is('userId', null)
      .is('trialStartedAt', null)
      .eq('demoFollowup72hSent', false)
      .eq('demoFollowup24hSent', true) // must have received 24h first
      .lt('demoCompletedAt', h72ago)
      .not('email', 'is', null)
      .limit(50)

    let sent72 = 0
    for (const lead of leads72h || []) {
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'demo-followup-72h',
            to: lead.email!,
            data: { name: lead.name || 'Visitante', persona: lead.persona },
          }
        })
        await supabase.from('Lead').update({ demoFollowup72hSent: true }).eq('id', lead.id)
        sent72++
      } catch (e) {
        console.error(`Failed 72h followup for lead ${lead.id}:`, e)
      }
    }

    console.log(`Followup complete: ${sent24} x 24h, ${sent72} x 72h`)

    return new Response(JSON.stringify({ sent24, sent72 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Followup error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
