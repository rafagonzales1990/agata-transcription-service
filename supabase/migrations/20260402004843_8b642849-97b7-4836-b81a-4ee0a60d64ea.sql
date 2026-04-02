
-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "No direct client access" ON public."User";

-- Security definer function to check admin (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User"
    WHERE id = (auth.uid())::text AND "isAdmin" = true
  );
$$;

-- Admins can read all users
CREATE POLICY "Admins can read all users"
ON public."User" FOR SELECT
TO authenticated
USING (public.is_admin());

-- Users can read own row
CREATE POLICY "Users can read own row"
ON public."User" FOR SELECT
TO authenticated
USING (id = (auth.uid())::text);

-- Block writes from client (keep secure - use edge functions for mutations)
CREATE POLICY "No direct client writes"
ON public."User" FOR INSERT
TO public
WITH CHECK (false);

CREATE POLICY "No direct client updates"
ON public."User" FOR UPDATE
TO public
USING (false);

CREATE POLICY "No direct client deletes"
ON public."User" FOR DELETE
TO public
USING (false);
