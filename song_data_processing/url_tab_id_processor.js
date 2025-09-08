/**
 * 🎸 URL-Based Tab ID Processor - Parent Script
 * 
 * Extracts Tab IDs from Ultimate Guitar URLs and processes them through
 * the existing UG data processing pipeline
 * 
 * Pipeline: URL Input → Extract Tab ID → Process via Existing Pipeline → Store
 * 
 * REUSES: All existing utility files (parent_script.js, songDataServiceUG.js, etc.)
 * ADDS: URL parsing and Tab ID extraction logic
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Import existing pipeline components (100% reuse)
import { getSongDataUG, createPlaceholderVideoForSong } from './songDataServiceUG.js'
import { createCompleteSong, getSongByUGTabId, updateExistingSong } from './songDatabaseUG.js'

// Import shared modules (NEW)
import { calculateDataCompletenessScore } from './shared/dataCompletenessScorer.js'
import { calculateContentAvailabilityFlags, calculateTimingAssistanceFlags } from './shared/booleanFlagCalculator.js'
import { extractTabIdAndTypeFromUrl, extractTabIdFromUrl } from './shared/urlParser.js'

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
 * 📝 Create a basic song record with Tab ID and Song Type in the database
 * This creates the initial song record before fetching rich UG data
 * 
 * @param {string} tabId - Ultimate Guitar Tab ID
 * @param {string} songType - Song type (chords, tabs, guitar-pro)
 * @param {string} url - Original URL that was submitted
 * @returns {Promise<Object>} Result with song ID and status
 */
async function createBasicSongRecord(tabId, songType, url) {
  try {
    console.log(`📝 Creating basic song record for Tab ID ${tabId} (Type: ${songType})...`)
    
    // Create basic song record with minimal data
    const basicSongData = {
      title: `Song ${tabId}`, // Placeholder title until we get real data
      artist: 'Unknown Artist', // Placeholder artist until we get real data
      ug_tab_id: tabId,
      ug_url: url,
      instrument_type: 'guitar', // Default instrument type
      tuning: 'E A D G B E', // Default standard tuning
      data_completeness_score: 0.2, // Basic score for title + artist only
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
      // Note: ug_tab_type and status fields will be added in future schema updates
    }

    // Insert basic song record
    const { data: song, error } = await supabase
      .from('songs')
      .insert([basicSongData])
      .select('id')
      .single()

    if (error) {
      console.error(`❌ Failed to create basic song record: ${error.message}`)
      return {
        success: false,
        error: `Database insertion failed: ${error.message}`,
        songId: null
      }
    }

    console.log(`✅ Basic song record created with ID: ${song.id}`)
    return {
      success: true,
      songId: song.id,
      message: 'Basic song record created successfully'
    }

  } catch (error) {
    console.error(`❌ Error creating basic song record: ${error.message}`)
    return {
      success: false,
      error: error.message,
      songId: null
    }
  }
}

/**
 * 🎯 Process a single URL by extracting Tab ID and running through pipeline
 * 
 * @param {string} url - Ultimate Guitar URL to process
 * @returns {Object} Processing result with status and details
 */
async function processUrl(url) {
  console.log(`\n🌐 Processing URL: ${url}`)
  console.log('=====================================')

  try {
    // Step 1: Extract Tab ID and Song Type from URL
    console.log('🔍 Step 1: Extracting Tab ID and Song Type from URL...')
    const extractionResult = extractTabIdAndTypeFromUrl(url)
    
    if (!extractionResult) {
      return {
        success: false,
        error: 'Could not extract Tab ID and Song Type from URL',
        url: url,
        tabId: null,
        songType: null
      }
    }

    const { tabId, songType } = extractionResult
    console.log(`✅ Tab ID extracted: ${tabId}`)
    console.log(`✅ Song Type extracted: ${songType}`)

    // Step 2: Check if song already exists
    console.log('🔍 Step 2: Checking if song already exists...')
    const existingSong = await getSongByUGTabId(tabId)
    
    let existingSongId = null
    
    if (existingSong.success) {
      // Check if it's actually complete or just a placeholder
      if (existingSong.song.title === `Song ${tabId}` && existingSong.song.artist === 'Unknown Artist') {
        // This is just a placeholder - continue with processing
        console.log('ℹ️ Song exists but is only a placeholder - continuing with processing...')
        existingSongId = existingSong.song.id
      } else {
        // This is actually complete - skip processing
        console.log(`ℹ️ Song already exists with complete data (ID: ${existingSong.song.id})`)
        return {
          success: true,
          message: 'Song already exists in database',
          url: url,
          tabId: tabId,
          songType: songType,
          songId: existingSong.song.id,
          alreadyProcessed: true
        }
      }
    }

    // Step 3: Create basic song record only if no placeholder exists
    let basicSongResult = null
    if (!existingSongId) {
      console.log('📝 Step 3: Creating basic song record with Tab ID and Song Type...')
      basicSongResult = await createBasicSongRecord(tabId, songType, url)
      
      if (!basicSongResult.success) {
        console.log(`❌ Failed to create basic song record: ${basicSongResult.error}`)
        return {
          success: false,
          error: basicSongResult.error,
          url: url,
          tabId: tabId,
          songType: songType
        }
      }

      console.log(`✅ Basic song record created (ID: ${basicSongResult.songId})`)
      existingSongId = basicSongResult.songId
    } else {
      console.log(`✅ Using existing placeholder record (ID: ${existingSongId})`)
    }

    // Step 4: Fetch UG data via Go tool (reuse existing function)
    console.log(`🔄 Step 4: Fetching UG data for Tab ID ${tabId}...`)
    const songData = await getSongDataUG(tabId)
    
    if (!songData) {
      console.log(`⚠️ No UG data returned for Tab ID ${tabId}`)
      return {
        success: false,
        error: 'No UG data returned from Ultimate Guitar',
        url: url,
        tabId: tabId,
        songType: songType,
        songId: basicSongResult.songId
      }
    }

    console.log(`✅ UG data fetched: ${songData.title} by ${songData.artist}`)
    console.log(`   Sections: ${songData.sections.length}, Chords: ${songData.chordProgressions.length}`)

    // Step 5: Calculate final data completeness score and boolean flags
    console.log('📊 Step 5: Calculating final data completeness score and boolean flags...')
    const scoreAndFlags = calculateDataCompletenessScore(songData)
    const finalCompletenessScore = scoreAndFlags.data_completeness_score
    const booleanFlags = {
      has_lyric_captions: scoreAndFlags.has_lyric_captions,
      has_chord_captions: scoreAndFlags.has_chord_captions,
      has_tab_captions: scoreAndFlags.has_tab_captions,
      lyrics_need_timing: scoreAndFlags.lyrics_need_timing,
      chords_need_timing: scoreAndFlags.chords_need_timing,
      tabs_need_timing: scoreAndFlags.tabs_need_timing,
      
      // 🎯 CRITICAL UI READINESS FIELDS
      needs_user_assistance: scoreAndFlags.needs_user_assistance,
      admin_need_user_assistance: scoreAndFlags.admin_need_user_assistance,
      has_tab_captions: scoreAndFlags.has_tab_captions,
      is_ui_ready: scoreAndFlags.is_ui_ready,
      has_raw_html: songData.hasRawHtml || false, // Raw HTML UI readiness flag
      
      // 📊 DATA COMPLETENESS SCORE (required by database function)
      data_completeness_score: finalCompletenessScore
    }
    
    console.log(`📊 Final completeness score: ${finalCompletenessScore}/1.0`)
    console.log(`🎯 Content availability: Lyrics: ${booleanFlags.has_lyric_captions}, Chords: ${booleanFlags.has_chord_captions}, Tabs: ${booleanFlags.has_tab_captions}`)
    console.log(`⏱️ Timing assistance needed: Lyrics: ${booleanFlags.lyrics_need_timing}, Chords: ${booleanFlags.chords_need_timing}, Tabs: ${booleanFlags.tabs_need_timing}`)
    console.log(`🎯 CRITICAL UI FIELDS: has_tab_captions: ${booleanFlags.has_tab_captions}, needs_user_assistance: ${booleanFlags.needs_user_assistance}, is_ui_ready: ${booleanFlags.is_ui_ready}`)

    // Step 6: Update existing song record with complete data and boolean flags
    console.log('💾 Step 6: Updating existing song record with complete data and boolean flags...')
    
    // Add boolean flags and song ID to songData for update
    songData.booleanFlags = booleanFlags
    songData.existingSongId = existingSongId
    
    const storeResult = await updateExistingSong(songData)
    
    if (storeResult.success) {
      console.log(`✅ Song updated successfully (ID: ${storeResult.songId})`)
      
      // 🎬 Step 7: Create placeholder video if chord progressions exist
      if (songData.needsPlaceholderVideo && songData.placeholderVideoData) {
        console.log('🎬 Step 7: Creating placeholder video for chord captions...')
        
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
      
      return {
        success: true,
        message: 'Song processed and stored successfully',
        url: url,
        tabId: tabId,
        songId: storeResult.songId,
        songData: {
          title: songData.title,
          artist: songData.artist,
          songType: songType,
          sections: songData.sections.length,
          chords: songData.chordProgressions.length,
          hasRawHtml: songData.hasRawHtml || false
        }
      }
    } else {
      console.log(`❌ Failed to update song: ${storeResult.error}`)
      return {
        success: false,
        error: storeResult.error,
        url: url,
        tabId: tabId,
        songType: songType,
        songId: basicSongResult.songId
      }
    }

  } catch (error) {
    console.error(`❌ Error processing URL: ${error.message}`)
    return {
      success: false,
      error: error.message,
      url: url,
      tabId: null,
      songType: null
    }
  }
}

/**
 * 🔄 Process multiple URLs in sequence
 * 
 * @param {Array<string>} urls - Array of Ultimate Guitar URLs
 * @returns {Object} Processing results summary
 */
async function processUrlsBatch(urls) {
  console.log(`🚀 Processing ${urls.length} URLs in batch`)
  console.log('=====================================')

  const results = {
    total: urls.length,
    success: 0,
    failed: 0,
    alreadyProcessed: 0,
    errors: [],
    details: []
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    console.log(`\n📦 Processing URL ${i + 1}/${urls.length}`)
    
    const result = await processUrl(url)
    results.details.push(result)

    if (result.success) {
      if (result.alreadyProcessed) {
        results.alreadyProcessed++
      } else {
        results.success++
      }
    } else {
      results.failed++
      results.errors.push(`${url}: ${result.error}`)
    }

    // Add delay between URLs (5-15 seconds) - shorter than batch processing
    if (i < urls.length - 1) {
      const delay = getRandomDelay(5, 15)
      await waitWithProgress(delay, 'next URL')
    }
  }

  return results
}

/**
 * ⏱️ Generate randomized delay for rate limiting (reuse existing function)
 * 
 * @param {number} minSeconds - Minimum delay in seconds
 * @param {number} maxSeconds - Maximum delay in seconds
 * @returns {number} Random delay in milliseconds
 */
function getRandomDelay(minSeconds = 5, maxSeconds = 15) {
  const minMs = minSeconds * 1000
  const maxMs = maxSeconds * 1000
  return Math.floor(Math.random() * (maxMs - minMs) + minMs)
}

/**
 * ⏳ Wait for a specified time with progress indication (reuse existing function)
 * 
 * @param {number} delayMs - Delay in milliseconds
 * @param {string} context - What we're waiting for
 */
async function waitWithProgress(delayMs, context) {
  const delaySeconds = Math.floor(delayMs / 1000)
  console.log(`⏳ Waiting ${delaySeconds} seconds before ${context}...`)
  
  // Show progress every 5 seconds for shorter delays
  const progressInterval = 5000
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

/**
 * 🎯 Main execution function
 * 
 * @param {Array<string>} urls - URLs to process (from command line args or default)
 */
async function main(urls = []) {
  try {
    console.log('🎸 URL-Based Tab ID Processor')
    console.log('==============================')
    console.log('This script extracts Tab IDs from Ultimate Guitar URLs')
    console.log('and processes them through the existing UG data pipeline.')
    console.log('')

    // If no URLs provided, use sample URLs for testing
    if (urls.length === 0) {
      urls = [
        'https://tabs.ultimate-guitar.com/tab/radiohead/creep-chords-4169',
        'https://tabs.ultimate-guitar.com/tab/metallica/enter-sandman-tabs-8595',
        'https://tabs.ultimate-guitar.com/tab/thank-you-scientist/my-famed-disappearing-act-guitar-pro-5932688'
      ]
      console.log('ℹ️ No URLs provided, using sample URLs for testing:')
      urls.forEach((url, index) => console.log(`  ${index + 1}. ${url}`))
      console.log('')
    }

    // Process URLs
    const results = await processUrlsBatch(urls)

    // Show results summary
    console.log('\n📊 Processing Results Summary')
    console.log('=============================')
    console.log(`Total URLs processed: ${results.total}`)
    console.log(`Successfully processed: ${results.success}`)
    console.log(`Already existed: ${results.alreadyProcessed}`)
    console.log(`Failed to process: ${results.failed}`)
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }

    if (results.success > 0 || results.alreadyProcessed > 0) {
      console.log('\n✅ Successfully processed songs:')
      results.details.forEach((detail, index) => {
        if (detail.success) {
          if (detail.alreadyProcessed) {
            console.log(`  ${index + 1}. ${detail.url} → Already exists (ID: ${detail.songId})`)
          } else {
            console.log(`  ${index + 1}. ${detail.url} → New song stored (ID: ${detail.songId})`)
          }
        }
      })
    }

    console.log('\n🎉 URL processing completed!')

  } catch (error) {
    console.error('❌ Main execution failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Get URLs from command line arguments (skip first two: node and script name)
  const urls = process.argv.slice(2)
  main(urls).catch(console.error)
}

// Export functions for potential reuse
export { 
  extractTabIdFromUrl, 
  extractTabIdAndTypeFromUrl,
  createBasicSongRecord,
  processUrl, 
  processUrlsBatch, 
  main,
  getRandomDelay,
  waitWithProgress,
  calculateContentAvailabilityFlags,
  calculateTimingAssistanceFlags
}
