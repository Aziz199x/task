-- Check if the 'task_photos' bucket exists, and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'task_photos') THEN
        PERFORM storage.create_bucket('task_photos', '{ "public": true }');
    END IF;
END
$$;

-- Set up RLS policies for the 'task_photos' bucket

-- Drop existing policies if they exist to prevent errors on re-run
DROP POLICY IF EXISTS "Allow authenticated read access to task photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert access to task photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete access to task photos" ON storage.objects;

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