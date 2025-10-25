-- Step 1: Create a helper function to securely get the role of the currently authenticated user.
-- This function is necessary for the policy to check the user's role.
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  -- Select the role from the public.profiles table for the given user ID.
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop the old, more restrictive policies for deletion and updates.
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow privileged users or owners to manage photos" ON storage.objects; -- Also drop this in case it exists from a partial run
DROP POLICY IF EXISTS "Allow privileged users or owners to update photos" ON storage.objects; -- Also drop this in case it exists from a partial run


-- Step 3: Create a new, more flexible DELETE policy.
-- This allows deletion if the user is the original uploader (owner) OR
-- if the user has a privileged role ('admin', 'manager', 'supervisor').
CREATE POLICY "Allow privileged users or owners to delete photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'task_photos' AND
  (
    auth.uid() = owner OR
    get_user_role(auth.uid()) IN ('admin', 'manager', 'supervisor')
  )
);

-- Step 4: Create a new, more flexible UPDATE policy with the same logic.
-- This allows updating if the user is the original uploader (owner) OR
-- if the user has a privileged role.
CREATE POLICY "Allow privileged users or owners to update photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'task_photos' AND
  (
    auth.uid() = owner OR
    get_user_role(auth.uid()) IN ('admin', 'manager', 'supervisor')
  )
);