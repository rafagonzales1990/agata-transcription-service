-- 1. Block all client access to User table (contains passwords, tokens, PII)
DROP POLICY IF EXISTS "Users can view own record" ON public."User";
DROP POLICY IF EXISTS "Users can update own record" ON public."User";

CREATE POLICY "No direct client access" ON public."User"
  FOR ALL USING (false) WITH CHECK (false);

-- 2. Add INSERT policy for Usage table
CREATE POLICY "Users can insert own usage" ON public."Usage"
  FOR INSERT
  TO authenticated
  WITH CHECK (("userId" = (auth.uid())::text) OR ("userId" = get_old_user_id(auth.uid())));

-- 3. Fix function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;