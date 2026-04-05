
-- ============================================================
-- 1) USER TABLE: Column-level SELECT restrictions
--    Revoke full table SELECT, grant only safe columns
-- ============================================================

-- Revoke table-level SELECT from authenticated (RLS policies still apply for row filtering)
REVOKE SELECT ON public."User" FROM authenticated;
REVOKE SELECT ON public."User" FROM anon;

-- Grant SELECT only on safe columns to authenticated
GRANT SELECT (
  id, name, email, phone, cpf, image,
  "planId", "billingCycle", "trialEndsAt",
  "hasCompletedOnboarding", "isAdmin", "isInternal",
  "isTeamOwner", "teamId", "adminGroupId",
  "emailVerified", "createdAt", "updatedAt",
  "trialWarningEmailSent", "trialExpiredEmailSent"
) ON public."User" TO authenticated;

-- ============================================================
-- 2) USER TABLE: Ensure privilege escalation trigger exists
-- ============================================================

DROP TRIGGER IF EXISTS prevent_user_privilege_escalation ON public."User";

CREATE TRIGGER prevent_user_privilege_escalation
  BEFORE UPDATE ON public."User"
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();

-- ============================================================
-- 3) WORKGROUPMEMBER: Fix self-manage escalation
--    Remove ALL policy, keep separate policies properly scoped
-- ============================================================

DROP POLICY IF EXISTS "Users can manage own memberships" ON public."WorkGroupMember";

-- Users can only view their own memberships (already exists but re-ensure)
DROP POLICY IF EXISTS "Users can view own memberships" ON public."WorkGroupMember";
CREATE POLICY "Users can view own memberships" ON public."WorkGroupMember"
  FOR SELECT TO authenticated
  USING ((auth.uid())::text = "userId");

-- Users can only remove themselves from groups they belong to
CREATE POLICY "Users can leave work groups" ON public."WorkGroupMember"
  FOR DELETE TO authenticated
  USING ((auth.uid())::text = "userId");

-- Users can only be added by team owner (already handled by existing policy)
-- No self-INSERT policy needed

-- ============================================================
-- 4) ASSETS BUCKET: Restrict uploads to service_role only
-- ============================================================

CREATE POLICY "Service role only upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'assets' AND (select auth.role()) = 'service_role');

CREATE POLICY "Service role only update assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'assets' AND (select auth.role()) = 'service_role');

CREATE POLICY "Service role only delete assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'assets' AND (select auth.role()) = 'service_role');
