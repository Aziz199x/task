-- Alter column types to text arrays, handling existing data
ALTER TABLE public.tasks
ALTER COLUMN photo_before_url TYPE TEXT[]
USING (CASE WHEN photo_before_url IS NULL THEN NULL ELSE ARRAY[photo_before_url] END);

ALTER TABLE public.tasks
ALTER COLUMN photo_after_url TYPE TEXT[]
USING (CASE WHEN photo_after_url IS NULL THEN NULL ELSE ARRAY[photo_after_url] END);

-- Rename columns to reflect multiple photos
ALTER TABLE public.tasks RENAME COLUMN photo_before_url TO photo_before_urls;
ALTER TABLE public.tasks RENAME COLUMN photo_after_url TO photo_after_urls;