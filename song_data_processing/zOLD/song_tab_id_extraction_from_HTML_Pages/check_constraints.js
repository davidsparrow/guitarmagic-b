// Check constraints on songs table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  try {
    console.log('🔍 Checking constraints on songs table...');
    
    // Try to get table information
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing songs table:', error.message);
      
      if (error.message.includes('unique_song_artist')) {
        console.log('\n🎯 FOUND THE CONSTRAINT: unique_song_artist');
        console.log('💡 This constraint needs to be removed manually in Supabase dashboard');
        console.log('\n📋 MANUAL REMOVAL STEPS:');
        console.log('1. Go to: https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to: Database > Tables > songs');
        console.log('4. Click on "Constraints" tab');
        console.log('5. Find "unique_song_artist" constraint');
        console.log('6. Click the delete/trash icon');
        console.log('7. Confirm deletion');
        console.log('\n🔄 After removing, run the bulk importer again');
      }
    } else {
      console.log('✅ Songs table accessible - constraint may have been removed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkConstraints();
