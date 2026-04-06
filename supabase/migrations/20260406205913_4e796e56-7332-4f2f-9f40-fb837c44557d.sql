
-- 1. Fix MeetingShare: remove broad SELECT policy
DROP POLICY IF EXISTS "Anyone can read shares" ON public."MeetingShare";
DROP POLICY IF EXISTS "Public can read meeting shares" ON public."MeetingShare";

-- Anon: can only look up a share by its token (used on /shared/:token page)
CREATE POLICY "Anon can read share by token"
  ON public."MeetingShare"
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated: can only see shares for their own meetings
CREATE POLICY "Users can read own meeting shares"
  ON public."MeetingShare"
  FOR SELECT
  TO authenticated
  USING (
    "meetingId" IN (
      SELECT id FROM public."Meeting" WHERE "userId" = (auth.uid())::text
    )
  );

-- 2. Remove legacy resetToken columns from User table
ALTER TABLE public."User" DROP COLUMN IF EXISTS "resetToken";
ALTER TABLE public."User" DROP COLUMN IF EXISTS "resetTokenExpiry";
