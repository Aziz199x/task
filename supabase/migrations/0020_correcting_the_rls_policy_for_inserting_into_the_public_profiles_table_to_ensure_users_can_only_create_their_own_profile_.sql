-- Drop the existing permissive insert policy
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;

-- Create a new insert policy allowing authenticated users to insert their own profile
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);