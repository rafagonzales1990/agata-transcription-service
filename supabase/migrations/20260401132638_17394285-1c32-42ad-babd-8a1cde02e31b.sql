
-- Fix mutable search_path on update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

-- ===================== USER TABLE =====================
-- RLS is auto-enabled, but add policies
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own record"
ON public."User" FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "Users can update own record"
ON public."User" FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- No direct insert/delete from client for User table

-- ===================== TEAM TABLE =====================
ALTER TABLE public."Team" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owner can manage team"
ON public."Team" FOR ALL
TO authenticated
USING (auth.uid()::text = "ownerId")
WITH CHECK (auth.uid()::text = "ownerId");

-- ===================== MEETING TABLE =====================
ALTER TABLE public."Meeting" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
ON public."Meeting" FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own meetings"
ON public."Meeting" FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own meetings"
ON public."Meeting" FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own meetings"
ON public."Meeting" FOR DELETE
TO authenticated
USING (auth.uid()::text = "userId");

-- ===================== ROUTINE TABLE =====================
ALTER TABLE public."Routine" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own routines"
ON public."Routine" FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own routines"
ON public."Routine" FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own routines"
ON public."Routine" FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own routines"
ON public."Routine" FOR DELETE
TO authenticated
USING (auth.uid()::text = "userId");

-- ===================== USAGE TABLE =====================
ALTER TABLE public."Usage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
ON public."Usage" FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can update own usage"
ON public."Usage" FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId");

-- ===================== TRANSCRIPTION LOG TABLE =====================
ALTER TABLE public."TranscriptionLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcription logs"
ON public."TranscriptionLog" FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

-- ===================== ACCOUNT TABLE =====================
ALTER TABLE public."Account" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own accounts"
ON public."Account" FOR ALL
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- ===================== SESSION TABLE =====================
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
ON public."Session" FOR ALL
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- ===================== PLAN TABLE (public read) =====================
ALTER TABLE public."Plan" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plans"
ON public."Plan" FOR SELECT
USING (true);

-- ===================== BLOGPOST TABLE (public read) =====================
ALTER TABLE public."BlogPost" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts"
ON public."BlogPost" FOR SELECT
USING (published = true);

-- ===================== ADMIN GROUP TABLE =====================
ALTER TABLE public."AdminGroup" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read admin groups"
ON public."AdminGroup" FOR SELECT
TO authenticated
USING (true);

-- ===================== VERIFICATION TOKEN TABLE =====================
ALTER TABLE public."VerificationToken" ENABLE ROW LEVEL SECURITY;
-- No client-side access needed

-- ===================== WORKGROUP TABLE =====================
ALTER TABLE public."WorkGroup" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view work groups"
ON public."WorkGroup" FOR SELECT
TO authenticated
USING (true);

-- ===================== WORKGROUP MEMBER TABLE =====================
ALTER TABLE public."WorkGroupMember" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships"
ON public."WorkGroupMember" FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can manage own memberships"
ON public."WorkGroupMember" FOR ALL
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");
