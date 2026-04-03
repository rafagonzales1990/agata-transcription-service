
-- Create Lead table
CREATE TABLE public."Lead" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT,
  email TEXT,
  company TEXT,
  role TEXT,
  "linkedinUrl" TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'unknown',
  campaign TEXT,
  medium TEXT,
  content TEXT,
  persona TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  "lastStep" TEXT NOT NULL DEFAULT 'landing_view',
  notes TEXT,
  "meetingId" TEXT,
  "userId" TEXT,
  "demoCompletedAt" TIMESTAMPTZ,
  "trialStartedAt" TIMESTAMPTZ,
  "convertedAt" TIMESTAMPTZ,
  "demoFollowup24hSent" BOOLEAN NOT NULL DEFAULT false,
  "demoFollowup72hSent" BOOLEAN NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX idx_lead_source ON public."Lead" (source);
CREATE INDEX idx_lead_campaign ON public."Lead" (campaign);
CREATE INDEX idx_lead_status ON public."Lead" (status);
CREATE INDEX idx_lead_email ON public."Lead" (email);
CREATE INDEX idx_lead_created_at ON public."Lead" ("createdAt" DESC);

-- Enable RLS
ALTER TABLE public."Lead" ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access leads"
ON public."Lead"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read own leads
CREATE POLICY "Users can read own leads"
ON public."Lead"
FOR SELECT
TO authenticated
USING ("userId" = (auth.uid())::text);

-- Authenticated users can update own leads
CREATE POLICY "Users can update own leads"
ON public."Lead"
FOR UPDATE
TO authenticated
USING ("userId" = (auth.uid())::text);

-- Admins can read all leads
CREATE POLICY "Admins can read all leads"
ON public."Lead"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can update all leads
CREATE POLICY "Admins can update all leads"
ON public."Lead"
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Public insert for demo form (anonymous leads)
CREATE POLICY "Anyone can insert leads"
ON public."Lead"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- updatedAt trigger (reuse existing function)
CREATE TRIGGER update_lead_updated_at
BEFORE UPDATE ON public."Lead"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
