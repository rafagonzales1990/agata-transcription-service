
-- 1. Prevent privilege escalation on User table
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW."isAdmin" := OLD."isAdmin";
    NEW."isInternal" := OLD."isInternal";
    NEW."adminGroupId" := OLD."adminGroupId";
    NEW."isTeamOwner" := OLD."isTeamOwner";
    NEW."planId" := OLD."planId";
    NEW."stripeCustomerId" := OLD."stripeCustomerId";
    NEW."stripeSubscriptionId" := OLD."stripeSubscriptionId";
    NEW."stripePriceId" := OLD."stripePriceId";
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_privilege_columns
  BEFORE UPDATE ON public."User"
  FOR EACH ROW EXECUTE FUNCTION public.prevent_privilege_escalation();

-- 2. Make meetings bucket private
UPDATE storage.buckets SET public = false WHERE id = 'meetings';

-- 3. Add storage policies for meetings bucket (owner-based access)
CREATE POLICY "Users can upload their own meeting files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'meetings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own meeting files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'meetings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own meeting files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meetings'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
