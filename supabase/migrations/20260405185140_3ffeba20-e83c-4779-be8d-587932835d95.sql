
-- 1) Create the trigger that activates prevent_privilege_escalation function
CREATE TRIGGER prevent_user_privilege_escalation
  BEFORE UPDATE ON public."User"
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();

-- 2) Fix Lead INSERT policy: split into anon (no userId) and authenticated (own userId or null)
DROP POLICY IF EXISTS "Anyone can insert leads" ON public."Lead";

CREATE POLICY "Anonymous lead capture" ON public."Lead"
  FOR INSERT TO anon
  WITH CHECK ("userId" IS NULL);

CREATE POLICY "Auth users insert own leads" ON public."Lead"
  FOR INSERT TO authenticated
  WITH CHECK ("userId" IS NULL OR "userId" = (auth.uid())::text);
