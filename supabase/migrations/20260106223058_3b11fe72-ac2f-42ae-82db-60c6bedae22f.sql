-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'audio/mpeg', 'audio/ogg', 'video/mp4']
);

-- RLS policies for message attachments bucket
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated users can view attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'message-attachments');

CREATE POLICY "Public can view attachments"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated users can delete their attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'message-attachments');

-- Add attachment columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT;