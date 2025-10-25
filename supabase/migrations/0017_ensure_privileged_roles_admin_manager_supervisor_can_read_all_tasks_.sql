-- Drop the existing comprehensive policy to ensure the new explicit SELECT policy takes precedence or works correctly alongside others.
-- Note: The existing policy grants '*' access, which includes SELECT. We will rely on the combination of specific policies.
-- Since we cannot easily drop policies by name without knowing the full signature, we will ensure the SELECT policy is explicitly defined.

-- Create a policy to allow privileged roles to read ALL tasks
CREATE POLICY "Allow privileged roles to read all tasks" ON public.tasks 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE 
      profiles.id = auth.uid() AND 
      profiles.role = ANY (ARRAY['admin'::user_roles, 'manager'::user_roles, 'supervisor'::user_roles])
  )
);