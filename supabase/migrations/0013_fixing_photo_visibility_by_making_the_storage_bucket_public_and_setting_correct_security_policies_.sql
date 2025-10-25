-- Step 1: Ensure the 'task_photos' bucket is public. This is a failsafe.
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_photos', 'task_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Remove all potentially conflicting old policies for a clean slate.
DROP POLICY IF EXISTS "Allow public read access to task photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to update photos" ON storage.objects;

-- Step 3: Create a new, explicit public read policy.
-- This specifically grants SELECT (read) access to anonymous (anon) and logged-in (authenticated) users.
-- This is the key fix.
CREATE POLICY "Allow public read access to task photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'task_photos');

-- Step 4: Re-create the policy for uploading photos.
-- Allows any logged-in user to upload.
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task_photos');

-- Step 5: Re-create the policy for deleting photos.
-- Allows the owner of the photo or a privileged user (admin, manager, supervisor) to delete.
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