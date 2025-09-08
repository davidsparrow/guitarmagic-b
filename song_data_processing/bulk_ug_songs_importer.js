// Bulk Ultimate Guitar Songs Importer
// Connects to Supabase and imports songs from all HTML files in the ug-pages folder
// Now includes automatic retry and cleanup system for failed songs

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from parent directory
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

/**
 * Supabase client configuration
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// File paths for pending and unprocessed songs
const PENDING_FILE = 'pending_extraction.md';
const UNPROCESSED_FILE = 'unprocessed.md';

/**
 * Load pending songs from file
 * @returns {Array} Array of pending song objects
 */
function loadPendingSongs() {
  try {
    if (!fs.existsSync(PENDING_FILE)) {
      return [];
    }
    
    const content = fs.readFileSync(PENDING_FILE, 'utf8');
    const songs = [];
    
    // Parse the markdown content to extract song information
    const lines = content.split('\n');
    let currentSong = null;
    
    for (const line of lines) {
      if (line.startsWith('- ') && line.includes(' - retry_count:')) {
        // Parse song line: "Artist - Song Title (Tab ID: 123456) - retry_count: 2"
        const match = line.match(/^- (.+?) - (.+?) \(Tab ID: (\d+)\) - retry_count: (\d+)/);
        if (match) {
          currentSong = {
            artist: match[1].trim(),
            title: match[2].trim(),
            tabId: match[3].trim(),
            retryCount: parseInt(match[4])
          };
          songs.push(currentSong);
        }
      }
    }
    
    return songs;
  } catch (error) {
    console.error('❌ Error loading pending songs:', error.message);
    return [];
  }
}

/**
 * Save pending songs to file
 * @param {Array} songs - Array of pending song objects
 */
function savePendingSongs(songs) {
  try {
    let content = '# Pending Song Extraction - Retry Queue\n\n';
    
    if (songs.length === 0) {
      content += '## No pending songs\n';
    } else {
      content += '## Failed Songs (Retry Count)\n';
      for (const song of songs) {
        content += `- ${song.artist} - ${song.title} (Tab ID: ${song.tabId}) - retry_count: ${song.retryCount}\n`;
      }
      content += `\n## Total Pending: ${songs.length} songs\n`;
      content += '## Next Reprocessing: When count reaches 10+\n';
    }
    
    fs.writeFileSync(PENDING_FILE, content);
  } catch (error) {
    console.error('❌ Error saving pending songs:', error.message);
  }
}

/**
 * Load unprocessed songs from file
 * @returns {Array} Array of unprocessed song objects
 */
function loadUnprocessedSongs() {
  try {
    if (!fs.existsSync(UNPROCESSED_FILE)) {
      return [];
    }
    
    const content = fs.readFileSync(UNPROCESSED_FILE, 'utf8');
    const songs = [];
    
    // Parse the markdown content to extract song information
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('- ') && line.includes(' (final_retry_count:')) {
        // Parse song line: "Artist - Song Title (Tab ID: 123456) (final_retry_count: 5, last_attempt: 2025-08-29)"
        const match = line.match(/^- (.+?) - (.+?) \(Tab ID: (\d+)\) \(final_retry_count: (\d+), last_attempt: (.+?)\)/);
        if (match) {
          songs.push({
            artist: match[1].trim(),
            title: match[2].trim(),
            tabId: match[3].trim(),
            finalRetryCount: parseInt(match[4]),
            lastAttempt: match[5].trim()
          });
        }
      }
    }
    
    return songs;
  } catch (error) {
    console.error('❌ Error loading unprocessed songs:', error.message);
    return [];
  }
}

/**
 * Add song to unprocessed list
 * @param {Object} song - Song object to add
 */
function addToUnprocessed(song) {
  try {
    const songs = loadUnprocessedSongs();
    
    // Check if song already exists
    const existingIndex = songs.findIndex(s => 
      s.artist === song.artist && s.title === song.title && s.tabId === song.tabId
    );
    
    if (existingIndex === -1) {
      songs.push({
        artist: song.artist,
        title: song.title,
        tabId: song.tabId,
        finalRetryCount: 5,
        lastAttempt: new Date().toISOString().split('T')[0]
      });
    }
    
    // Save updated unprocessed list
    let content = '# Unprocessed Songs - Permanent Archive\n\n';
    content += '## Songs That Failed After 5 Retry Attempts\n';
    
    for (const s of songs) {
      content += `- ${s.artist} - ${s.title} (Tab ID: ${s.tabId}) (final_retry_count: ${s.finalRetryCount}, last_attempt: ${s.lastAttempt})\n`;
    }
    
    content += `\n## Total Unprocessed: ${songs.length} songs\n`;
    content += '## Status: Requires manual investigation\n';
    
    fs.writeFileSync(UNPROCESSED_FILE, content);
    
    console.log(`   📋 Moved "${song.title}" by ${song.artist} to unprocessed list`);
  } catch (error) {
    console.error('❌ Error adding to unprocessed list:', error.message);
  }
}

/**
 * Add failed song to pending list
 * @param {Object} song - Song object that failed
 * @param {string} errorMessage - Error message from failure
 */
function addToPending(song, errorMessage) {
  try {
    const pendingSongs = loadPendingSongs();
    
    // Check if song already exists in pending
    const existingIndex = pendingSongs.findIndex(s => 
      s.artist === song.artist && s.title === song.title && s.tabId === song.tabId
    );
    
    if (existingIndex !== -1) {
      // Increment retry count
      pendingSongs[existingIndex].retryCount++;
      
      // If retry count reaches 5, move to unprocessed
      if (pendingSongs[existingIndex].retryCount >= 5) {
        const songToMove = pendingSongs.splice(existingIndex, 1)[0];
        addToUnprocessed(songToMove);
        console.log(`   ⚠️  Song "${song.title}" by ${song.artist} moved to unprocessed after 5 retries`);
        return;
      }
    } else {
      // Add new failed song
      pendingSongs.push({
        artist: song.artist,
        title: song.title,
        tabId: song.tabId,
        retryCount: 1
      });
    }
    
    savePendingSongs(pendingSongs);
    console.log(`   📝 Added "${song.title}" by ${song.artist} to pending list (retry: ${pendingSongs.find(s => s.artist === song.artist && s.title === song.title)?.retryCount || 1})`);
  } catch (error) {
    console.error('❌ Error adding to pending list:', error.message);
  }
}

/**
 * Remove song from pending list (after successful processing)
 * @param {Object} song - Song object to remove
 */
function removeFromPending(song) {
  try {
    const pendingSongs = loadPendingSongs();
    const filteredSongs = pendingSongs.filter(s => 
      !(s.artist === song.artist && s.title === song.title && s.tabId === song.tabId)
    );
    
    if (filteredSongs.length !== pendingSongs.length) {
      savePendingSongs(filteredSongs);
      console.log(`   ✅ Removed "${song.title}" by ${song.artist} from pending list`);
    }
  } catch (error) {
    console.error('❌ Error removing from pending list:', error.message);
  }
}

/**
 * Process pending songs (retry failed songs)
 * @returns {Object} Result of pending songs processing
 */
async function processPendingSongs() {
  const pendingSongs = loadPendingSongs();
  
  if (pendingSongs.length === 0) {
    return { success: true, processed: 0, successful: 0, failed: 0 };
  }
  
  console.log(`\n🔄 Processing ${pendingSongs.length} pending songs...`);
  
  let successful = 0;
  let failed = 0;
  
  for (const song of pendingSongs) {
    try {
      // Try to insert the song again (this will trigger the same validation)
      const songData = {
        title: song.title,
        artist: song.artist,
        ug_tab_id: song.tabId,
        ug_url: `https://tabs.ultimate-guitar.com/tab/${song.artist.toLowerCase().replace(/\s+/g, '-')}/${song.title.toLowerCase().replace(/\s+/g, '-')}-${song.tabId}`,
        key_signature: null,
        difficulty: 'unknown',
        ug_rating: null,
        ug_votes: 0,
        genre: 'rock',
        instrument_type: 'guitar',
        tuning: 'E A D G B E',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('songs')
        .insert([songData]);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Success! Remove from pending list
      removeFromPending(song);
      successful++;
      console.log(`   ✅ Successfully reprocessed "${song.title}" by ${song.artist}"`);
      
    } catch (error) {
      failed++;
      console.log(`   ❌ Failed to reprocess "${song.title}" by ${song.artist}: ${error.message}`);
      
      // Add back to pending with incremented retry count
      addToPending(song, error.message);
    }
    
    // Small delay between retries
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { success: true, processed: pendingSongs.length, successful, failed };
}

/**
 * Extract song data from a single HTML file
 * @param {string} htmlFilePath - Path to the HTML file
 * @returns {Array} Array of extracted song objects
 */
function extractSongsFromHTML(htmlFilePath) {
  try {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Find the js-store div with song data
    const jsStoreMatch = htmlContent.match(/<div class="js-store" data-content="(.+?)"><\/div>/);
    
    if (!jsStoreMatch) {
      console.log(`⚠️  No js-store data found in ${path.basename(htmlFilePath)}`);
      return [];
    }
    
    // Parse the JSON content from the js-store div
    const jsonContent = jsStoreMatch[1].replace(/&quot;/g, '"').replace(/&#039;/g, "'");
    const pageData = JSON.parse(jsonContent);
    
    // Extract songs from the store data
    const songs = pageData.store?.page?.data?.data?.tabs || [];
    
    if (!songs || songs.length === 0) {
      console.log(`⚠️  No songs found in ${path.basename(htmlFilePath)}`);
      return [];
    }
    
    // Format the songs data for database insertion
    const formattedSongs = songs.map(song => ({
      title: song.song_name,
      artist: song.artist_name,
      ug_tab_id: song.id,
      ug_url: song.tab_url,
      key_signature: song.tonality_name || null,
      difficulty: song.difficulty || 'unknown',
      ug_rating: song.rating || null,
      ug_votes: song.votes || 0,
      genre: 'rock', // Default genre since UG doesn't provide this
      instrument_type: 'guitar',
      tuning: 'E A D G B E', // Default standard tuning
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    return formattedSongs;
    
  } catch (error) {
    console.error(`❌ Error processing ${htmlFilePath}:`, error.message);
    return [];
  }
}

/**
 * Check if songs already exist in the database
 * @param {Array} songs - Array of song objects to check
 * @returns {Array} Array of songs that don't exist yet
 */
async function filterExistingSongs(songs) {
  try {
    const newSongs = [];
    
    for (const song of songs) {
      // Check by title + artist combination
      const { data, error } = await supabase
        .from('songs')
        .select('id, ug_tab_id')
        .eq('title', song.title)
        .eq('artist', song.artist)
        .limit(1);
      
      if (error) {
        console.error(`❌ Error checking existing song: ${error.message}`);
        continue;
      }
      
      if (!data || data.length === 0) {
        newSongs.push(song);
      } else {
        // Check if this specific tab ID already exists
        const existingSong = data[0];
        if (existingSong.ug_tab_id !== song.ug_tab_id) {
          // Different tab ID for same song, we can add this as a variation
          newSongs.push(song);
        }
      }
    }
    
    return newSongs;
    
  } catch (error) {
    console.error('❌ Error filtering existing songs:', error.message);
    return songs; // Return all songs if filtering fails
  }
}

/**
 * Insert songs into Supabase database
 * @param {Array} songs - Array of song objects to insert
 * @returns {Object} Result of the insertion operation
 */
async function insertSongsToSupabase(songs) {
  try {
    if (songs.length === 0) {
      return { success: true, inserted: 0, errors: [], skipped: 0 };
    }
    
    // Filter out songs that already exist
    const newSongs = await filterExistingSongs(songs);
    
    if (newSongs.length === 0) {
      console.log(`   ℹ️  All ${songs.length} songs already exist in database`);
      return { success: true, inserted: 0, errors: [], skipped: songs.length };
    }
    
    console.log(`   📝 Inserting ${newSongs.length} new songs (${songs.length - newSongs.length} already exist)`);
    
    // Insert songs one by one to handle individual errors
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const song of newSongs) {
      try {
        const { data, error } = await supabase
          .from('songs')
          .insert([song]);
        
        if (error) {
          console.error(`   ❌ Failed to insert "${song.title}" by ${song.artist}: ${error.message}`);
          errorCount++;
          
          // Add failed song to pending list for retry
          addToPending({
            artist: song.artist,
            title: song.title,
            tabId: song.ug_tab_id
          }, error.message);
          
        } else {
          insertedCount++;
        }
        
        // Small delay between insertions
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (insertError) {
        console.error(`   ❌ Unexpected error inserting "${song.title}" by ${song.artist}: ${insertError.message}`);
        errorCount++;
        
        // Add failed song to pending list for retry
        addToPending({
          artist: song.artist,
          title: song.title,
          tabId: song.ug_tab_id
        }, insertError.message);
      }
    }
    
    if (errorCount > 0) {
      return { 
        success: false, 
        inserted: insertedCount, 
        errors: [`${errorCount} songs failed to insert`], 
        skipped: songs.length - newSongs.length 
      };
    }
    
    return { 
      success: true, 
      inserted: insertedCount, 
      errors: [], 
      skipped: songs.length - newSongs.length 
    };
    
  } catch (error) {
    console.error('❌ Unexpected error during insertion:', error);
    return { success: false, inserted: 0, errors: [error.message], skipped: 0 };
  }
}

/**
 * Get all HTML files from the ug-pages folder
 * @returns {Array} Array of HTML file paths
 */
function getHTMLFiles() {
  const ugPagesDir = './ug_html_pages';
  
  if (!fs.existsSync(ugPagesDir)) {
    console.error(`❌ Directory not found: ${ugPagesDir}`);
    return [];
  }
  
  const files = fs.readdirSync(ugPagesDir);
  const htmlFiles = files
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(ugPagesDir, file));
  
  return htmlFiles;
}

/**
 * Main function to process all HTML files and import songs
 */
async function main() {
  console.log('🎸 Bulk Ultimate Guitar Songs Importer');
  console.log('=' .repeat(60));
  
  // Check pending songs first (TRIGGER POINT B: Before starting new HTML processing)
  const pendingSongs = loadPendingSongs();
  if (pendingSongs.length >= 10) {
    console.log(`🔄 Found ${pendingSongs.length} pending songs (≥10), processing them first...`);
    const pendingResult = await processPendingSongs();
    console.log(`   📊 Pending songs processed: ${pendingResult.processed}, successful: ${pendingResult.successful}, failed: ${pendingResult.failed}`);
  } else if (pendingSongs.length > 0) {
    console.log(`📋 Found ${pendingSongs.length} pending songs (<10), will process at end of session`);
  }
  
  // Get all HTML files
  const htmlFiles = getHTMLFiles();
  
  if (htmlFiles.length === 0) {
    console.log('❌ No HTML files found in ug-pages/ folder');
    return;
  }
  
  console.log(`📁 Found ${htmlFiles.length} HTML files to process`);
  console.log('🔗 Connecting to Supabase...');
  
  // Test Supabase connection
  try {
    const { data, error } = await supabase.from('songs').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Successfully connected to Supabase');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    return;
  }
  
  let totalSongsProcessed = 0;
  let totalSongsInserted = 0;
  let totalSongsSkipped = 0;
  let totalErrors = 0;
  
  // Process each HTML file
  for (let i = 0; i < htmlFiles.length; i++) {
    const htmlFile = htmlFiles[i];
    const fileName = path.basename(htmlFile);
    
    console.log(`\n📄 Processing file ${i + 1}/${htmlFiles.length}: ${fileName}`);
    
    // Extract songs from HTML
    const songs = extractSongsFromHTML(htmlFile);
    
    if (songs.length === 0) {
      console.log(`   ⚠️  No songs extracted from ${fileName}`);
      continue;
    }
    
    console.log(`   🎵 Extracted ${songs.length} songs`);
    totalSongsProcessed += songs.length;
    
    // Insert songs into Supabase
    const result = await insertSongsToSupabase(songs);
    
    if (result.success) {
      console.log(`   ✅ Successfully inserted ${result.inserted} songs`);
      totalSongsInserted += result.inserted;
      totalSongsSkipped += result.skipped || 0;
    } else {
      console.log(`   ❌ Failed to insert songs: ${result.errors.join(', ')}`);
      totalErrors += songs.length;
    }
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // TRIGGER POINT A: Process pending songs at end of session if any accumulated
  const finalPendingSongs = loadPendingSongs();
  if (finalPendingSongs.length > 0) {
    console.log(`\n🔄 Processing ${finalPendingSongs.length} pending songs at end of session...`);
    const pendingResult = await processPendingSongs();
    console.log(`   📊 Final pending songs processed: ${pendingResult.processed}, successful: ${pendingResult.successful}, failed: ${pendingResult.failed}`);
    
    // Update totals to include pending song results
    totalSongsInserted += pendingResult.successful;
    totalErrors += pendingResult.failed;
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 IMPORT SUMMARY:');
  console.log(`   📁 Files processed: ${htmlFiles.length}`);
  console.log(`   🎵 Total songs extracted: ${totalSongsProcessed}`);
  console.log(`   ✅ Songs successfully inserted: ${totalSongsInserted}`);
  console.log(`   ⏭️  Songs skipped (already exist): ${totalSongsSkipped}`);
  console.log(`   ❌ Songs with errors: ${totalErrors}`);
  console.log('=' .repeat(60));
  
  if (totalErrors === 0) {
    console.log('🎉 All songs processed successfully!');
  } else {
    console.log('⚠️  Some songs had errors during import. Check the logs above.');
  }
}

// Run the importer
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
