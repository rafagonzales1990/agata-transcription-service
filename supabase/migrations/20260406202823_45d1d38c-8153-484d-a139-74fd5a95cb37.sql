
-- Create MeetingShare table for public sharing tokens
CREATE TABLE public."MeetingShare" (
  id text NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "meetingId" text NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex') UNIQUE,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "expiresAt" timestamp with time zone DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public."MeetingShare" ENABLE ROW LEVEL SECURITY;

-- Anyone can read a share by token (for public viewing)
CREATE POLICY "Anyone can read share by token"
ON public."MeetingShare"
FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated users can create shares for their own meetings
CREATE POLICY "Users can create shares for own meetings"
ON public."MeetingShare"
FOR INSERT
TO authenticated
WITH CHECK (
  "meetingId" IN (
    SELECT id FROM public."Meeting" WHERE "userId" = (auth.uid())::text
  )
);

-- Users can update their own shares
CREATE POLICY "Users can update own shares"
ON public."MeetingShare"
FOR UPDATE
TO authenticated
USING (
  "meetingId" IN (
    SELECT id FROM public."Meeting" WHERE "userId" = (auth.uid())::text
  )
);

-- Users can delete their own shares
CREATE POLICY "Users can delete own shares"
ON public."MeetingShare"
FOR DELETE
TO authenticated
USING (
  "meetingId" IN (
    SELECT id FROM public."Meeting" WHERE "userId" = (auth.uid())::text
  )
);

-- Service role full access
CREATE POLICY "Service role full access meeting shares"
ON public."MeetingShare"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index for fast token lookup
CREATE INDEX idx_meeting_share_token ON public."MeetingShare" (token);
CREATE INDEX idx_meeting_share_meeting ON public."MeetingShare" ("meetingId");
