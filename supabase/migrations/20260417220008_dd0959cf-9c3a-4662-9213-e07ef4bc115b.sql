-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job with same name if it exists (idempotent)
DO $$
BEGIN
  PERFORM cron.unschedule('reset-stuck-meetings');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule job to reset meetings stuck in 'processing' state for >15 minutes
SELECT cron.schedule(
  'reset-stuck-meetings',
  '*/30 * * * *',
  $$
  UPDATE public."Meeting"
  SET status = 'failed',
      "errorMessage" = 'Timeout: transcrição excedeu o tempo limite',
      "updatedAt" = NOW()
  WHERE status = 'processing'
    AND "updatedAt" < NOW() - INTERVAL '15 minutes';
  $$
);