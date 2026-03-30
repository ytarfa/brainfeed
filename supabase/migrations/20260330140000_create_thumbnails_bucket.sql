-- Create the "thumbnails" storage bucket for generated thumbnail images.
-- Public bucket so thumbnail URLs can be used directly in <img> tags.
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public bucket).
CREATE POLICY "Public thumbnail read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

-- Allow service-role (backend) to insert and update thumbnails.
-- The backend uses the service client which bypasses RLS,
-- but we define policies for completeness.
CREATE POLICY "Service thumbnail insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Service thumbnail update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'thumbnails');
