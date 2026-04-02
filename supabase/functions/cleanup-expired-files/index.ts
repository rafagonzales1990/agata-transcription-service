import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date().toISOString()
  let deleted = 0
  const errors: string[] = []

  const { data: meetings, error: fetchError } = await supabase
    .from('Meeting')
    .select('id, cloudStoragePath, userId')
    .lt('fileExpiresAt', now)
    .eq('fileDeleted', false)
    .not('cloudStoragePath', 'is', null)

  if (fetchError) {
    return new Response(
      JSON.stringify({ error: fetchError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  for (const meeting of meetings || []) {
    try {
      const { error: storageError } = await supabase.storage
        .from('meetings')
        .remove([meeting.cloudStoragePath])

      if (storageError) {
        errors.push(`Meeting ${meeting.id}: ${storageError.message}`)
        continue
      }

      await supabase
        .from('Meeting')
        .update({
          fileDeleted: true,
          cloudStoragePath: null,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', meeting.id)

      deleted++
    } catch (err) {
      errors.push(`Meeting ${meeting.id}: ${String(err)}`)
    }
  }

  console.log(`Cleanup completed: ${deleted} files deleted, ${errors.length} errors`)

  return new Response(
    JSON.stringify({ deleted, errors, total: meetings?.length || 0 }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
