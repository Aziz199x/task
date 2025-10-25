-- Make the 'task_photos' bucket public to allow direct image access via URL
UPDATE storage.buckets
SET public = true
WHERE id = 'task_photos';

-- Drop all potentially conflicting old policies for the task_photos bucket
DROP POLICY IF EXISTS "Authenticated users can view task photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload task photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own task photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own task photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for task photos" ON storage.objects;

-- Create a new set of RLS policies for the 'task_photos' bucket

-- 1. Allow public read access for all files in the bucket.
-- This is safe because the file paths are based on unguessable UUIDs.
CREATE POLICY "Public read access for task photos"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'task_photos' );

-- 2. Allow any authenticated user to upload photos.
CREATE POLICY "Authenticated users can upload task photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'task_photos' );

-- 3. Allow users to update only the photos they have uploaded themselves.
-- The 'owner' of a storage object is the auth.uid() of the user who uploaded it.
CREATE POLICY "Users can update their own task photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ( bucket_id = 'task_photos' AND owner = auth.uid() );

-- 4. Allow users to delete only the photos they have uploaded themselves.
CREATE POLICY "Users can delete their own task photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'task_photos' AND owner = auth.uid() );