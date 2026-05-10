-- Simple setup - just add the column and create bucket
-- Run this first, then we can add policies later

-- 1. Add banner_url column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. Create storage bucket for event banners (without policies for now)
INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- That's it! This should work without errors.
