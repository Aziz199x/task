-- Step 1: Ensure the 'task_photos' bucket exists and is marked as PUBLIC.
-- This is the most critical step for making images viewable via their URL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_photos', 'task_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Remove all previous policies on the storage.objects table to avoid conflicts.
-- This creates a clean slate to apply the correct rules.
DROP POLICY IF EXISTS "Allow public read access to task photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to update photos" ON storage.objects;

-- Step 3: Add a simple, permissive policy for READING (SELECT) photos.
-- This allows anyone with the link to view an image, which is standard for public buckets.
CREATE POLICY "Allow public read access to task photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'task_photos');

-- Step 4: Add a policy for UPLOADING (INSERT) photos.
-- This allows any logged-in (authenticated) user to upload files to the bucket.
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task_photos');

-- Step 5: Add the policy for DELETING photos.
-- This uses the existing get_user_role function to allow deletion by the owner or a privileged user.
CREATE POLICY "Allow privileged users or owners to delete photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'task_photos' AND
  (
    auth.uid() = owner OR
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'supervisor')
  )
);

-- Step 6: Add the policy for UPDATING photos.
-- This uses the same logic as the delete policy for consistency.
CREATE POLICY "Allow privileged users or owners to update photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'task_photos' AND
  (
    auth.uid() = owner OR
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'supervisor')
  )
);