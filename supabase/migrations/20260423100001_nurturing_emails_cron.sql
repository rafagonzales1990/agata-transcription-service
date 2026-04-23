SELECT cron.schedule(
  'nurturing-emails-daily',
  '0 10 * * *',  -- 10h UTC = 7h Brasília
  $$SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/nurturing-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  )$$
);
