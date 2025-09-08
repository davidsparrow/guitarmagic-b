// Check existing songs in Supabase database
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

async function checkExistingSongs() {
  try {
    console.log('🔍 Checking existing songs in database...');
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    console.log(`📊 Total songs in database: ${count}`);
    
    // Get some sample songs
    const { data: songs, error } = await supabase
      .from('songs')
      .select('id, title, artist, ug_tab_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    console.log('\n📋 Sample songs in database:');
    songs.forEach((song, index) => {
      console.log(`${index + 1}. "${song.title}" by ${song.artist} (Tab ID: ${song.ug_tab_id})`);
    });
    
    // Check for specific songs that might be causing duplicates
    const testSongs = [
      { title: 'Nothing Else Matters', artist: 'Metallica' },
      { title: 'Wonderwall', artist: 'Oasis' },
      { title: 'Stairway To Heaven', artist: 'Led Zeppelin' }
    ];
    
    console.log('\n🔍 Checking for specific songs:');
    for (const testSong of testSongs) {
      const { data, error: checkError } = await supabase
        .from('songs')
        .select('id, title, artist, ug_tab_id')
        .eq('title', testSong.title)
        .eq('artist', testSong.artist);
      
      if (checkError) {
        console.error(`❌ Error checking "${testSong.title}": ${checkError.message}`);
      } else {
        console.log(`"${testSong.title}" by ${testSong.artist}: ${data.length} found`);
        data.forEach(song => {
          console.log(`  - ID: ${song.id}, Tab ID: ${song.ug_tab_id}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkExistingSongs();
