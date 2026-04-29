-- AdminActionLog: track every dev/admin data-management action
CREATE TABLE IF NOT EXISTS "AdminActionLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID,
  action TEXT NOT NULL,
  "affectedCount" INTEGER NOT NULL DEFAULT 0,
  result JSONB,
  "executedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AdminActionLog_executedAt_idx"
  ON "AdminActionLog" ("executedAt" DESC);

ALTER TABLE "AdminActionLog" ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write; admin UI goes through edge function
CREATE POLICY "AdminActionLog_block_all" ON "AdminActionLog"
  FOR ALL USING (false);

-- Reset trials with triggers disabled (avoids audit/notification triggers firing
-- on bulk back-office updates). SECURITY DEFINER is required because
-- session_replication_role can only be set by superuser/owner.
CREATE OR REPLACE FUNCTION public.reset_basic_trials_bulk()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER;
BEGIN
  SET LOCAL session_replication_role = 'replica';

  UPDATE "User"
     SET "trialEndsAt" = NOW() + INTERVAL '14 days'
   WHERE "planId" = 'basic'
     AND ("isInternal" = false OR "isInternal" IS NULL);

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_basic_trials_bulk() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_basic_trials_bulk() TO service_role;
