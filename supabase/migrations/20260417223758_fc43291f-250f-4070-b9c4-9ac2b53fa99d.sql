CREATE OR REPLACE FUNCTION public.match_meeting_embeddings(
  query_embedding extensions.vector,
  match_user_id text,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  "chunkText" text,
  "meetingId" text,
  title text,
  "createdAt" timestamptz,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    me."chunkText",
    me."meetingId",
    m.title,
    m."createdAt",
    1 - (me.embedding OPERATOR(extensions.<=>) query_embedding) AS similarity
  FROM public."MeetingEmbedding" me
  JOIN public."Meeting" m ON m.id = me."meetingId"
  WHERE me."userId" = match_user_id
    AND me.embedding IS NOT NULL
  ORDER BY me.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
$$;