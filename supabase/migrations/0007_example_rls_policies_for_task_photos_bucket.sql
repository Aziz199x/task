-- Allow authenticated users to upload files
    CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task_photos');

    -- Allow authenticated users to update their own files (if needed)
    CREATE POLICY "Allow authenticated updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'task_photos');

    -- Allow authenticated users to view files
    CREATE POLICY "Allow authenticated reads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'task_photos');