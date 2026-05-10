-- Run this SQL in your Supabase SQL Editor to create the event banners storage bucket

-- 1. Add banner_url column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. Create storage bucket for event banners
INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create policies for event banners storage
-- Allow public read access to banners
CREATE POLICY "banners_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'event-banners');

-- Allow authenticated users to upload banners (they must be the event owner)
CREATE POLICY "banners_owner_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'event-banners' AND 
  (auth.role() = 'authenticated' AND owner_id::text = auth.uid())
);

-- Allow authenticated users to update banners (they must be the event owner)
CREATE POLICY "banners_owner_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'event-banners' AND 
  (auth.role() = 'authenticated' AND owner_id::text = auth.uid())
);

-- Allow authenticated users to delete banners (they must be the event owner)
CREATE POLICY "banners_owner_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'event-banners' AND 
  (auth.role() = 'authenticated' AND owner_id::text = auth.uid())
);
