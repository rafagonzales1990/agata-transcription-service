CREATE TABLE IF NOT EXISTS "HealthCheckLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,         -- 'ok' | 'error'
  "latencyMs" INTEGER,
  detail TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_check_log_provider_created
  ON "HealthCheckLog"(provider, "createdAt" DESC);

ALTER TABLE "HealthCheckLog" ENABLE ROW LEVEL SECURITY;
