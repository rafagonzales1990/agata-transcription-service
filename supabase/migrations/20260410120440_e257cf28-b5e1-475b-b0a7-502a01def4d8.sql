
-- 1. Create Project table
CREATE TABLE public."Project" (
  id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "teamId" TEXT,
  color TEXT NOT NULL DEFAULT '#059669',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Project_pkey" PRIMARY KEY (id),
  CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE
);

-- 2. Add projectId to Meeting
ALTER TABLE public."Meeting"
ADD COLUMN "projectId" TEXT REFERENCES public."Project"(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public."Project" ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Users manage own projects" ON public."Project"
  FOR ALL TO authenticated
  USING ((auth.uid())::text = "userId")
  WITH CHECK ((auth.uid())::text = "userId");

CREATE POLICY "Team members read projects" ON public."Project"
  FOR SELECT TO authenticated
  USING (
    "teamId" IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = (auth.uid())::text
      AND u."teamId" = "Project"."teamId"
    )
  );

-- 5. Update trigger for updatedAt
CREATE TRIGGER update_project_updated_at
  BEFORE UPDATE ON public."Project"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 6. Index for faster filtering
CREATE INDEX idx_meeting_project_id ON public."Meeting"("projectId");
CREATE INDEX idx_project_user_id ON public."Project"("userId");
CREATE INDEX idx_project_team_id ON public."Project"("teamId");
