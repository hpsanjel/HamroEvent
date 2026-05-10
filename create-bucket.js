// Simple script to create the event-banners storage bucket
// Run with: node create-bucket.js

// You need to install @supabase/supabase-js first:
// npm install @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');

// Use your Supabase URL and service role key (not the publishable key)
// You can find the service role key in your Supabase project settings > API
const supabaseUrl = 'https://cgbjdmmhoihusdjaqxlr.supabase.co';
// IMPORTANT: Use your SERVICE_ROLE key, not the publishable key
const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Replace this!

if (serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.log('❌ Please replace YOUR_SERVICE_ROLE_KEY_HERE with your actual service role key');
  console.log('📍 Find it in: Supabase Project > Settings > API > service_role (secret)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createBucket() {
  try {
    console.log('🪣 Creating event-banners storage bucket...');
    
    const { data, error } = await supabase.storage.createBucket('event-banners', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 2097152 // 2MB in bytes
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists!');
      } else {
        console.error('❌ Error creating bucket:', error);
        return;
      }
    } else {
      console.log('✅ Bucket created successfully!');
    }

    // Add banner_url column to events table
    console.log('📝 Adding banner_url column to events table...');
    
    const { error: columnError } = await supabase
      .from('events')
      .select('id')
      .limit(1); // This will fail if column doesn't exist

    if (columnError && columnError.message.includes('column "banner_url" does not exist')) {
      // Need to add the column via SQL
      console.log('⚠️  You need to manually add the banner_url column. Run this SQL in Supabase SQL Editor:');
      console.log('ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_url TEXT;');
    } else {
      console.log('✅ banner_url column already exists!');
    }

    console.log('🎉 Setup complete! You can now upload event banners.');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createBucket();
