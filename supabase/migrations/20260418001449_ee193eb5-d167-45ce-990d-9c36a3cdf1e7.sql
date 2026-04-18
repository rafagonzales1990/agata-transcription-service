
CREATE OR REPLACE FUNCTION public.match_meeting_embeddings(
  query_embedding extensions.vector,
  match_user_id text,
  match_count integer DEFAULT 5,
  filter_meeting_id text DEFAULT NULL
)
RETURNS TABLE("chunkText" text, "meetingId" text, title text, "createdAt" timestamp with time zone, similarity double precision)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
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
    AND (filter_meeting_id IS NULL OR me."meetingId" = filter_meeting_id)
  ORDER BY me.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
$function$;
