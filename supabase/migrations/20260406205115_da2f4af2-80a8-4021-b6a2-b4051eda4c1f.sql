
-- 1. Replace broad User update policy with restricted one
DROP POLICY IF EXISTS "Users can update own row" ON public."User";

CREATE POLICY "Users can update own safe fields"
  ON public."User"
  FOR UPDATE
  TO authenticated
  USING (id = (auth.uid())::text)
  WITH CHECK (
    id = (auth.uid())::text
    AND "isAdmin" = (SELECT u."isAdmin" FROM public."User" u WHERE u.id = (auth.uid())::text)
    AND "isInternal" = (SELECT u."isInternal" FROM public."User" u WHERE u.id = (auth.uid())::text)
    AND "planId" IS NOT DISTINCT FROM (SELECT u."planId" FROM public."User" u WHERE u.id = (auth.uid())::text)
    AND "stripeCustomerId" IS NOT DISTINCT FROM (SELECT u."stripeCustomerId" FROM public."User" u WHERE u.id = (auth.uid())::text)
    AND "stripeSubscriptionId" IS NOT DISTINCT FROM (SELECT u."stripeSubscriptionId" FROM public."User" u WHERE u.id = (auth.uid())::text)
    AND "stripePriceId" IS NOT DISTINCT FROM (SELECT u."stripePriceId" FROM public."User" u WHERE u.id = (auth.uid())::text)
    AND "adminGroupId" IS NOT DISTINCT FROM (SELECT u."adminGroupId" FROM public."User" u WHERE u.id = (auth.uid())::text)
    AND "isTeamOwner" = (SELECT u."isTeamOwner" FROM public."User" u WHERE u.id = (auth.uid())::text)
    AND "teamId" IS NOT DISTINCT FROM (SELECT u."teamId" FROM public."User" u WHERE u.id = (auth.uid())::text)
    AND "trialEndsAt" IS NOT DISTINCT FROM (SELECT u."trialEndsAt" FROM public."User" u WHERE u.id = (auth.uid())::text)
  );

-- 2. Fix team-logos upload policy to verify team ownership
DROP POLICY IF EXISTS "Authenticated users can upload team logos" ON storage.objects;

CREATE POLICY "Team owners can upload team logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'team-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT t.id FROM public."Team" t WHERE t."ownerId" = (auth.uid())::text
    )
  );
