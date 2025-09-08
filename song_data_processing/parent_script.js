/**
 * 🎸 UG Data Processing Pipeline - Parent Script
 * 
 * Main orchestration script that processes stored Tab IDs from Supabase
 * Fetches rich UG data via Go tool and stores complete song information
 * 
 * Pipeline: Query DB → Process Tab IDs → Fetch UG Data → Transform → Store
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Import our core utilities
import { getSongDataUG, createPlaceholderVideoForSong } from './songDataServiceUG.js'
import { createCompleteSong, getSongByUGTabId } from './songDatabaseUG.js'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * 🎯 MAIN FUNCTION: Process all stored Tab IDs
 * Queries Supabase for songs with ug_tab_id and processes each one
 */
async function processAllStoredTabIds() {
  console.log('🚀 Starting UG Data Processing Pipeline')
  console.log('========================================')
  
  try {
    // Step 1: Query Supabase for all songs with ug_tab_id
    console.log('📊 Step 1: Querying Supabase for stored Tab IDs...')
    const storedSongs = await queryStoredTabIds()
    
    if (!storedSongs || storedSongs.length === 0) {
      console.log('ℹ️ No songs with ug_tab_id found in database')
      return
    }
    
    console.log(`✅ Found ${storedSongs.length} songs with Tab IDs to process`)
    
    // Step 2: Process each Tab ID
    console.log('🔄 Step 2: Processing Tab IDs...')
    const processingResults = await processTabIdsBatch(storedSongs)
    
    // Step 3: Show results summary
    console.log('📊 Step 3: Processing Results Summary')
    console.log('=====================================')
    console.log(`Total songs found: ${storedSongs.length}`)
    console.log(`Successfully processed: ${processingResults.success}`)
    console.log(`Failed to process: ${processingResults.failed}`)
    console.log(`Already processed: ${processingResults.alreadyProcessed}`)
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error.message)
    process.exit(1)
  }
}

/**
 * 📊 Query Supabase for all songs that have ug_tab_id
 * These are the songs from the HTML extraction phase
 */
async function queryStoredTabIds() {
  try {
    console.log('🔍 Querying songs table for ug_tab_id...')
    
    const { data: songs, error } = await supabase
      .from('songs')
      .select('id, title, artist, ug_tab_id')
      .not('ug_tab_id', 'is', null)
      .order('title')
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }
    
    console.log(`📋 Retrieved ${songs?.length || 0} songs with Tab IDs`)
    
    // Show first few songs as preview
    if (songs && songs.length > 0) {
      console.log('📝 Sample songs found:')
      songs.slice(0, 5).forEach((song, index) => {
        console.log(`  ${index + 1}. ${song.title} by ${song.artist} (Tab ID: ${song.ug_tab_id})`)
      })
      if (songs.length > 5) {
        console.log(`  ... and ${songs.length - 5} more`)
      }
    }
    
    return songs || []
    
  } catch (error) {
    console.error('❌ Error querying stored Tab IDs:', error.message)
    throw error
  }
}

/**
 * 🎯 Main execution
 */
async function main() {
  try {
    await processAllStoredTabIds()
    console.log('\n🎉 Pipeline execution completed!')
  } catch (error) {
    console.error('❌ Main execution failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

/**
 * 🔄 Process a batch of Tab IDs
 * Fetches UG data for each Tab ID and stores it in the database
 * 
 * @param {Array} songs - Array of songs with ug_tab_id
 * @returns {Object} Processing results summary
 */
async function processTabIdsBatch(songs) {
  const results = {
    success: 0,
    failed: 0,
    alreadyProcessed: 0,
    errors: []
  }
  
  console.log(`🔄 Processing ${songs.length} Tab IDs...`)
  
  // Process in small batches to avoid overwhelming the system
  const batchSize = 5
  const totalBatches = Math.ceil(songs.length / batchSize)
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIndex = batchIndex * batchSize
    const endIndex = Math.min(startIndex + batchSize, songs.length)
    const batch = songs.slice(startIndex, endIndex)
    
    console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (songs ${startIndex + 1}-${endIndex})`)
    
    // Process each song in the current batch
    for (const song of batch) {
      try {
        console.log(`\n🎸 Processing: ${song.title} by ${song.artist} (Tab ID: ${song.ug_tab_id})`)
        
        // Check if song already has complete data
        const existingSong = await getSongByUGTabId(song.ug_tab_id)
        if (existingSong.success) {
          console.log(`ℹ️ Song already exists with complete data (ID: ${existingSong.song.id})`)
          results.alreadyProcessed++
          continue
        }
        
        // Fetch UG data via Go tool
        console.log(`🔄 Fetching UG data for Tab ID ${song.ug_tab_id}...`)
        const songData = await getSongDataUG(song.ug_tab_id)
        
        if (!songData) {
          console.log(`⚠️ No UG data returned for Tab ID ${song.ug_tab_id}`)
          results.failed++
          results.errors.push(`Tab ID ${song.ug_tab_id}: No UG data returned`)
          continue
        }
        
        console.log(`✅ UG data fetched: ${songData.title} by ${songData.artist}`)
        console.log(`   Sections: ${songData.sections.length}, Chords: ${songData.chordProgressions.length}`)
        
        // Store complete song data in database
        console.log(`💾 Storing song data in database...`)
        const storeResult = await createCompleteSong(songData)
        
        if (storeResult.success) {
          console.log(`✅ Song stored successfully (ID: ${storeResult.songId})`)
          
          // 🎬 Create placeholder video if chord progressions exist
          if (songData.needsPlaceholderVideo && songData.placeholderVideoData) {
            console.log('🎬 Creating placeholder video for chord captions...')
            
            const placeholderResult = await createPlaceholderVideoForSong(
              storeResult.songId,
              songData.placeholderVideoData.songTitle,
              songData.placeholderVideoData.songArtist
            )
            
            if (placeholderResult.success) {
              console.log(`✅ Placeholder video created successfully (Favorite ID: ${placeholderResult.favoriteId})`)
            } else {
              console.warn(`⚠️ Failed to create placeholder video: ${placeholderResult.error}`)
              // Don't fail the entire process if placeholder video creation fails
            }
          }
          
          results.success++
        } else {
          console.log(`❌ Failed to store song: ${storeResult.error}`)
          results.failed++
          results.errors.push(`Tab ID ${song.ug_tab_id}: ${storeResult.error}`)
        }
        
        // Add randomized delay between songs (10-60 seconds)
        const songDelay = getRandomDelay(10, 60)
        await waitWithProgress(songDelay, 'next song')
        
      } catch (error) {
        console.error(`❌ Error processing song ${song.title}:`, error.message)
        results.failed++
        results.errors.push(`Tab ID ${song.ug_tab_id}: ${error.message}`)
      }
    }
    
    // Add randomized delay between batches (10-60 seconds)
    if (batchIndex < totalBatches - 1) {
      const batchDelay = getRandomDelay(10, 60)
      await waitWithProgress(batchDelay, 'next batch')
    }
  }
  
  return results
}

/**
 * ⏱️ Generate randomized delay for rate limiting
 * Creates unpredictable timing patterns to avoid detection
 * 
 * @param {number} minSeconds - Minimum delay in seconds
 * @param {number} maxSeconds - Maximum delay in seconds
 * @returns {number} Random delay in milliseconds
 */
function getRandomDelay(minSeconds = 10, maxSeconds = 60) {
  const minMs = minSeconds * 1000
  const maxMs = maxSeconds * 1000
  return Math.floor(Math.random() * (maxMs - minMs) + minMs)
}

/**
 * ⏳ Wait for a specified time with progress indication
 * 
 * @param {number} delayMs - Delay in milliseconds
 * @param {string} context - What we're waiting for (e.g., "next song", "next batch")
 */
async function waitWithProgress(delayMs, context) {
  const delaySeconds = Math.floor(delayMs / 1000)
  console.log(`⏳ Waiting ${delaySeconds} seconds before ${context}...`)
  
  // Show progress every 10 seconds
  const progressInterval = 10000
  const totalIntervals = Math.floor(delayMs / progressInterval)
  
  for (let i = 0; i < totalIntervals; i++) {
    await new Promise(resolve => setTimeout(resolve, progressInterval))
    const remainingSeconds = Math.floor((delayMs - (i + 1) * progressInterval) / 1000)
    if (remainingSeconds > 0) {
      console.log(`   ⏳ ${remainingSeconds} seconds remaining...`)
    }
  }
  
  // Wait for any remaining time
  const remainingMs = delayMs % progressInterval
  if (remainingMs > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingMs))
  }
}

export { processAllStoredTabIds, queryStoredTabIds, processTabIdsBatch, getRandomDelay, waitWithProgress }
