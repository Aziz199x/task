-- Create the storage bucket for task photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_photos', 'task_photos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the 'task_photos' bucket

-- Allow authenticated users to view photos
CREATE POLICY "Allow authenticated read access to task photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'task_photos');

-- Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated insert access to task photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task_photos');

-- Allow authenticated users to delete photos
CREATE POLICY "Allow authenticated delete access to task photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task_photos');