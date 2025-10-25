-- Step 1: Ensure the 'task_photos' bucket is public. This is the main fix for visibility.
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_photos', 'task_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Remove any old, potentially conflicting policies to ensure a clean setup.
DROP POLICY IF EXISTS "Allow authenticated insert on task_photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner to update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects; -- This is not needed for public buckets

-- Step 3: Create the correct policies for uploading and managing photos.
-- NOTE: A SELECT policy is NOT needed because the bucket is now public.

-- Policy: Allow any authenticated (logged-in) user to UPLOAD a photo.
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task_photos');

-- Policy: Allow a user to DELETE only their OWN photos.
CREATE POLICY "Allow users to delete their own photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task_photos' AND auth.uid() = owner);

-- Policy: Allow a user to UPDATE only their OWN photos.
CREATE POLICY "Allow users to update their own photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'task_photos' AND auth.uid() = owner);