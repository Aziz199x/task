ALTER TABLE public.tasks
ADD COLUMN closed_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;