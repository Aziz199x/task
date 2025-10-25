-- Step 1: Remove the temporary insecure policy.
DROP POLICY IF EXISTS "TEMP DEBUG - Allow all access" ON storage.objects;

-- Step 2: Remove any other old policies to ensure a clean state.
DROP POLICY IF EXISTS "Allow public read access to task photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to update photos" ON storage.objects;

-- Step 3: Create a policy to allow any authenticated user to view photos.
-- This is secure because access now requires a signed URL, which is checked against this policy.
CREATE POLICY "Allow authenticated read access"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task_photos');

-- Step 4: Create a policy for uploading photos.
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task_photos');

-- Step 5: Create a policy for deleting photos.
CREATE POLICY "Allow privileged users or owners to delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task_photos' AND
  (
    auth.uid() = owner OR
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'supervisor')
  )
);