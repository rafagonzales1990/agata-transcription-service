-- Habilita extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de embeddings das transcrições
CREATE TABLE IF NOT EXISTS public."MeetingEmbedding" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "meetingId" TEXT NOT NULL REFERENCES public."Meeting"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL DEFAULT 0,
  "chunkText" TEXT NOT NULL,
  embedding vector(768),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("meetingId", "chunkIndex")
);

-- Index para busca por similaridade (cosine)
CREATE INDEX IF NOT EXISTS meeting_embedding_idx
ON public."MeetingEmbedding"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- RLS
ALTER TABLE public."MeetingEmbedding" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own embeddings"
ON public."MeetingEmbedding"
FOR SELECT
USING ((auth.uid())::text = "userId");

CREATE POLICY "Service role manages embeddings"
ON public."MeetingEmbedding"
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');