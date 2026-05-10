// Run this script with: node setup-storage.js
// This will create the storage bucket and add the banner_url column

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    console.log('Setting up event banners storage...');

    // 1. Add banner_url column to events table
    console.log('Adding banner_url column to events table...');
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_url TEXT;'
    });

    if (columnError && !columnError.message.includes('already exists')) {
      console.error('Error adding column:', columnError);
    } else {
      console.log('✓ Column added successfully');
    }

    // 2. Create storage bucket
    console.log('Creating event-banners storage bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('event-banners', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 2097152 // 2MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating bucket:', bucketError);
    } else {
      console.log('✓ Bucket created successfully');
    }

    console.log('Storage setup complete!');
    console.log('You can now upload event banners.');

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupStorage();
