
-- Drop restrictive write policies and replace with admin-capable ones
DROP POLICY IF EXISTS "No direct client writes" ON public."User";
DROP POLICY IF EXISTS "No direct client updates" ON public."User";
DROP POLICY IF EXISTS "No direct client deletes" ON public."User";

-- Admins can update any user
CREATE POLICY "Admins can update all users"
ON public."User" FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Admins can delete users
CREATE POLICY "Admins can delete users"
ON public."User" FOR DELETE
TO authenticated
USING (public.is_admin());

-- Admins can insert users
CREATE POLICY "Admins can insert users"
ON public."User" FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Regular users can update own row
CREATE POLICY "Users can update own row"
ON public."User" FOR UPDATE
TO authenticated
USING (id = (auth.uid())::text);

-- Admins can read all meetings (for meeting count)
DROP POLICY IF EXISTS "Admins can read all meetings" ON public."Meeting";
CREATE POLICY "Admins can read all meetings"
ON public."Meeting" FOR SELECT
TO authenticated
USING (public.is_admin());
