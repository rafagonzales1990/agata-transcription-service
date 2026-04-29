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
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 })
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  const { data: userData } = await serviceClient
    .from('User')
    .select('isAdmin, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!userData?.isAdmin && userData?.role !== 'dev') {
    return new Response('Forbidden', { status: 403 })
  }

  const supabase = serviceClient

  const timestamp = new Date().toISOString().slice(0, 10)
  const backupData: Record<string, any> = {}

  const tables = ['User', 'Plan', 'Meeting', 'Usage', 'Routine',
                  'Team', 'WorkGroup', 'WorkGroupMember', 'BlogPost']

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*')
    if (error) {
      console.error(`Error backing up ${table}:`, error)
      backupData[table] = { error: error.message }
    } else {
      backupData[table] = data
      console.log(`Backed up ${table}: ${data?.length} records`)
    }
  }

  const backupJson = JSON.stringify(backupData, null, 2)
  const backupBytes = new TextEncoder().encode(backupJson)

  await supabase.storage.createBucket('backups', { public: false }).catch(() => {})

  const fileName = `backup-${timestamp}.json`
  const { error: uploadError } = await supabase.storage
    .from('backups')
    .upload(fileName, backupBytes, {
      contentType: 'application/json',
      upsert: true,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return new Response(
      JSON.stringify({ error: uploadError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: files } = await supabase.storage
    .from('backups')
    .list('', { sortBy: { column: 'created_at', order: 'asc' } })

  if (files && files.length > 7) {
    const toDelete = files.slice(0, files.length - 7).map(f => f.name)
    await supabase.storage.from('backups').remove(toDelete)
    console.log(`Deleted old backups: ${toDelete.join(', ')}`)
  }

  const stats = Object.entries(backupData).map(([table, data]) => ({
    table,
    records: Array.isArray(data) ? data.length : 'error',
  }))

  console.log('Backup completed:', fileName)

  return new Response(
    JSON.stringify({ success: true, file: fileName, stats }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
