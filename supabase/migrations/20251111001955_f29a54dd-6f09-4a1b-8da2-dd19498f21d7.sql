-- Create storage bucket for complaint files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint-files',
  'complaint-files',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- RLS policy: Students can upload files to their own folder
CREATE POLICY "Students can upload complaint files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'complaint-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Students can view their own files
CREATE POLICY "Students can view their own complaint files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Students can delete their own files
CREATE POLICY "Students can delete their own complaint files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'complaint-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: Admins can view all complaint files
CREATE POLICY "Admins can view all complaint files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-files' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);