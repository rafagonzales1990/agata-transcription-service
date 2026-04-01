
-- Add old_user_id column to profiles for legacy user mapping
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS old_user_id text;
CREATE INDEX IF NOT EXISTS idx_profiles_old_user_id ON public.profiles(old_user_id);

-- Security definer function to get old_user_id from profiles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_old_user_id(_auth_uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT old_user_id FROM public.profiles WHERE user_id = _auth_uid LIMIT 1;
$$;

-- Drop and recreate Meeting policies to support legacy user IDs
DROP POLICY IF EXISTS "Users can view own meetings" ON public."Meeting";
DROP POLICY IF EXISTS "Users can create own meetings" ON public."Meeting";
DROP POLICY IF EXISTS "Users can update own meetings" ON public."Meeting";
DROP POLICY IF EXISTS "Users can delete own meetings" ON public."Meeting";

CREATE POLICY "Users can view own meetings"
ON public."Meeting" FOR SELECT TO authenticated
USING (
  "userId" = auth.uid()::text
  OR "userId" = public.get_old_user_id(auth.uid())
);

CREATE POLICY "Users can create own meetings"
ON public."Meeting" FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = "userId" OR "userId" = public.get_old_user_id(auth.uid()));

CREATE POLICY "Users can update own meetings"
ON public."Meeting" FOR UPDATE TO authenticated
USING ("userId" = auth.uid()::text OR "userId" = public.get_old_user_id(auth.uid()));

CREATE POLICY "Users can delete own meetings"
ON public."Meeting" FOR DELETE TO authenticated
USING ("userId" = auth.uid()::text OR "userId" = public.get_old_user_id(auth.uid()));

-- Drop and recreate Routine policies
DROP POLICY IF EXISTS "Users can view own routines" ON public."Routine";
DROP POLICY IF EXISTS "Users can create own routines" ON public."Routine";
DROP POLICY IF EXISTS "Users can update own routines" ON public."Routine";
DROP POLICY IF EXISTS "Users can delete own routines" ON public."Routine";

CREATE POLICY "Users can view own routines"
ON public."Routine" FOR SELECT TO authenticated
USING ("userId" = auth.uid()::text OR "userId" = public.get_old_user_id(auth.uid()));

CREATE POLICY "Users can create own routines"
ON public."Routine" FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = "userId" OR "userId" = public.get_old_user_id(auth.uid()));

CREATE POLICY "Users can update own routines"
ON public."Routine" FOR UPDATE TO authenticated
USING ("userId" = auth.uid()::text OR "userId" = public.get_old_user_id(auth.uid()));

CREATE POLICY "Users can delete own routines"
ON public."Routine" FOR DELETE TO authenticated
USING ("userId" = auth.uid()::text OR "userId" = public.get_old_user_id(auth.uid()));

-- Drop and recreate Usage policies
DROP POLICY IF EXISTS "Users can view own usage" ON public."Usage";
DROP POLICY IF EXISTS "Users can update own usage" ON public."Usage";

CREATE POLICY "Users can view own usage"
ON public."Usage" FOR SELECT TO authenticated
USING ("userId" = auth.uid()::text OR "userId" = public.get_old_user_id(auth.uid()));

CREATE POLICY "Users can update own usage"
ON public."Usage" FOR UPDATE TO authenticated
USING ("userId" = auth.uid()::text OR "userId" = public.get_old_user_id(auth.uid()));

-- Drop and recreate TranscriptionLog policies
DROP POLICY IF EXISTS "Users can view own transcription logs" ON public."TranscriptionLog";

CREATE POLICY "Users can view own transcription logs"
ON public."TranscriptionLog" FOR SELECT TO authenticated
USING ("userId" = auth.uid()::text OR "userId" = public.get_old_user_id(auth.uid()));
