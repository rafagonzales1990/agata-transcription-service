CREATE TABLE IF NOT EXISTS "NurturingLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "emailType" TEXT NOT NULL, -- 'day1', 'day3', 'day10', 'day13'
  "sentAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nurturing_log_user ON "NurturingLog"("userId");

ALTER TABLE "NurturingLog" ENABLE ROW LEVEL SECURITY;
