-- Add minimal storage policies to allow banner uploads
-- Run this after simple-setup.sql

-- Drop any existing policies first
DROP POLICY IF EXISTS "banners_public_read" ON storage.objects;
DROP POLICY IF EXISTS "banners_owner_upload" ON storage.objects;
DROP POLICY IF EXISTS "banners_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "banners_owner_delete" ON storage.objects;

-- Allow public read access to banners
CREATE POLICY "banners_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'event-banners');

-- Allow anyone to upload to banners bucket (for now)
CREATE POLICY "banners_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-banners');

-- Allow anyone to update banners (for now)
CREATE POLICY "banners_update" ON storage.objects FOR UPDATE USING (bucket_id = 'event-banners');

-- Allow anyone to delete banners (for now)
CREATE POLICY "banners_delete" ON storage.objects FOR DELETE USING (bucket_id = 'event-banners');
