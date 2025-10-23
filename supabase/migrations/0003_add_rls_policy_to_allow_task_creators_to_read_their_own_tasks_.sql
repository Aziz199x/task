CREATE POLICY "Allow creator to read their own tasks" ON public.tasks
FOR SELECT TO authenticated USING (auth.uid() = creator_id);