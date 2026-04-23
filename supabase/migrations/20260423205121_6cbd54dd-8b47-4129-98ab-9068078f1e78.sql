CREATE TABLE IF NOT EXISTS public."AtaVersion" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "meetingId" TEXT NOT NULL REFERENCES public."Meeting"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
  "ataTemplate" TEXT NOT NULL,
  "ataContent" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "versionNumber" INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS "AtaVersion_meetingId_idx" ON public."AtaVersion"("meetingId");

ALTER TABLE public."AtaVersion" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ata_version_own" ON public."AtaVersion";
CREATE POLICY "ata_version_own" ON public."AtaVersion"
  FOR ALL
  TO authenticated
  USING ((auth.uid())::text = "userId")
  WITH CHECK ((auth.uid())::text = "userId");