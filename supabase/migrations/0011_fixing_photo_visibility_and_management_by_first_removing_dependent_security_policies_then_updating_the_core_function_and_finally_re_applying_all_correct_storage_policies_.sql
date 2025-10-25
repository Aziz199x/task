-- Step 1: Clean up all old policies on the storage objects to prevent conflicts.
-- This is now the FIRST step to remove dependencies on the function.
DROP POLICY IF EXISTS "Allow authenticated users to upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to update photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own photos" ON storage.objects;

-- Step 2: Re-create the user role checking function with added stability and correctness checks.
-- Now that the policies are dropped, this will succeed.
DROP FUNCTION IF EXISTS public.get_user_role(user_id uuid);
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  -- Securely select the role from the public.profiles table for the given user ID.
  SELECT role::text INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Step 3: Force the 'task_photos' bucket to be public. This is critical for visibility.
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_photos', 'task_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 4: Re-create the INSERT policy. Allows any logged-in user to upload.
CREATE POLICY "Allow authenticated users to upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task_photos');

-- Step 5: Re-create the DELETE policy with the corrected function call.
-- Allows deletion if the user is the owner OR has a privileged role.
CREATE POLICY "Allow privileged users or owners to delete photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'task_photos' AND
  (
    auth.uid() = owner OR
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'supervisor')
  )
);

-- Step 6: Re-create the UPDATE policy with the corrected function call.
-- Allows updating if the user is the owner OR has a privileged role.
CREATE POLICY "Allow privileged users or owners to update photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'task_photos' AND
  (
    auth.uid() = owner OR
    public.get_user_role(auth.uid()) IN ('admin', 'manager', 'supervisor')
  )
);