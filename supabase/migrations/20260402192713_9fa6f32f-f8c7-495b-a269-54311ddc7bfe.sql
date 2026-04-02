
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Team logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-logos');

CREATE POLICY "Authenticated users can upload team logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-logos');

CREATE POLICY "Users can update their own team logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'team-logos');

CREATE POLICY "Users can delete their own team logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'team-logos');
