-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_photos', 'task_photos', true) -- 'public: true' allows direct access via URL without signing
ON CONFLICT (id) DO NOTHING;

-- Policy for SELECT: Allow authenticated users to view files in the 'task_photos' bucket
CREATE POLICY "Allow authenticated reads on task_photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'task_photos');

-- Policy for INSERT: Allow authenticated users to upload files to the 'task_photos' bucket
CREATE POLICY "Allow authenticated uploads to task_photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task_photos');

-- Policy for UPDATE: Allow authenticated users to update files in the 'task_photos' bucket
CREATE POLICY "Allow authenticated updates on task_photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'task_photos')
WITH CHECK (bucket_id = 'task_photos');

-- Policy for DELETE: Allow authenticated users to delete files from the 'task_photos' bucket
CREATE POLICY "Allow authenticated deletes from task_photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task_photos');