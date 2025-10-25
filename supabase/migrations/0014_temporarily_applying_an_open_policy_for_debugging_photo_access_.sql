-- WARNING: This is a temporary and insecure policy for debugging purposes.

-- Step 1: Ensure the bucket is public.
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_photos', 'task_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Remove all previous policies on the storage.objects table to start fresh.
DROP POLICY IF EXISTS "Allow public read access to task photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to update photos" ON storage.objects;

-- Step 3: Create a wide-open policy that allows ALL actions for EVERYONE.
-- This will confirm if the issue is with the policies.
CREATE POLICY "TEMP DEBUG - Allow all access"
ON storage.objects
FOR ALL
USING (bucket_id = 'task_photos')
WITH CHECK (bucket_id = 'task_photos');