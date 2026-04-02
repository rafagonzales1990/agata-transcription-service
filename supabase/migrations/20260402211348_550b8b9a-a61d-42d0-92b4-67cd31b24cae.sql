
-- 1. Remove broad storage policies on meetings bucket
DROP POLICY IF EXISTS "Authenticated users can read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;

-- 2. Fix WorkGroup SELECT policy - restrict to team members/owners
DROP POLICY IF EXISTS "Team members can view work groups" ON public."WorkGroup";
CREATE POLICY "Team members can view work groups"
ON public."WorkGroup"
FOR SELECT
TO authenticated
USING (
  "teamId" IN (
    SELECT id FROM public."Team" WHERE "ownerId" = (auth.uid())::text
    UNION
    SELECT "teamId" FROM public."User" WHERE id = (auth.uid())::text AND "teamId" IS NOT NULL
  )
);

-- 3. Fix team-logos storage policies - add ownership checks
DROP POLICY IF EXISTS "Users can update their own team logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own team logos" ON storage.objects;

CREATE POLICY "Team owners can update their team logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'team-logos'
  AND auth.uid()::text IN (
    SELECT "ownerId" FROM public."Team" WHERE id = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Team owners can delete their team logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'team-logos'
  AND auth.uid()::text IN (
    SELECT "ownerId" FROM public."Team" WHERE id = (storage.foldername(name))[1]
  )
);

-- 4. Add RLS policy on VerificationToken - no access for regular users (service_role only)
CREATE POLICY "Service role only"
ON public."VerificationToken"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Fix function search_path on update_updated_at
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

-- 6. Add WITH CHECK on User update policy to prevent setting own id to someone else's
DROP POLICY IF EXISTS "Users can update own row" ON public."User";
CREATE POLICY "Users can update own row"
ON public."User"
FOR UPDATE
TO authenticated
USING (id = (auth.uid())::text)
WITH CHECK (id = (auth.uid())::text);
