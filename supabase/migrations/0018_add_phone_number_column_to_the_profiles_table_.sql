ALTER TABLE public.profiles
ADD COLUMN phone_number TEXT;

-- Update RLS policies to allow authenticated users to update their own phone_number
-- The existing profiles_update_policy should cover this, but we ensure it's explicit.
-- Existing policy: CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
-- This policy is sufficient, no need to create a new one.