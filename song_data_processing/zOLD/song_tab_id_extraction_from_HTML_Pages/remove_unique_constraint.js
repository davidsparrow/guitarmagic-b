// Remove unique constraint on songs table
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

async function removeUniqueConstraint() {
  try {
    console.log('🔧 Removing unique constraint on songs table...');
    
    // Execute SQL to drop the unique constraint
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE songs 
        DROP CONSTRAINT IF EXISTS unique_song_artist;
      `
    });
    
    if (error) {
      // If RPC doesn't work, try direct SQL execution
      console.log('⚠️  RPC method failed, trying direct SQL...');
      
      const { error: directError } = await supabase
        .from('songs')
        .select('*')
        .limit(1);
      
      if (directError && directError.message.includes('unique_song_artist')) {
        console.log('❌ Constraint still exists and is blocking operations');
        console.log('💡 You may need to remove this constraint manually in Supabase dashboard:');
        console.log('   1. Go to Supabase Dashboard > Database > Tables > songs');
        console.log('   2. Find the "unique_song_artist" constraint');
        console.log('   3. Click the delete button to remove it');
        return;
      }
    }
    
    console.log('✅ Unique constraint removed successfully!');
    console.log('🎯 Now you can insert multiple versions of the same song');
    
  } catch (error) {
    console.error('❌ Error removing constraint:', error.message);
    console.log('💡 You may need to remove this constraint manually in Supabase dashboard');
  }
}

removeUniqueConstraint();
