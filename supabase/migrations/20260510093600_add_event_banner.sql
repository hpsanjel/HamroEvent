-- Add banner_url column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Create storage bucket for event banners
INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for event banners storage
CREATE POLICY "banners_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'event-banners');
CREATE POLICY "banners_owner_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'event-banners' AND 
  (auth.role() = 'authenticated' AND owner_id = auth.uid())
);
CREATE POLICY "banners_owner_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'event-banners' AND 
  (auth.role() = 'authenticated' AND owner_id = auth.uid())
);
CREATE POLICY "banners_owner_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'event-banners' AND 
  (auth.role() = 'authenticated' AND owner_id = auth.uid())
);
