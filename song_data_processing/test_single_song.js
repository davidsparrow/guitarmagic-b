/**
 * 🎸 SINGLE SONG TEST - UG Data Processing
 * 
 * Minimal test to process ONE song and examine the data structure
 * This will help identify any missing schema fields we need to add
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Import our core utilities
import { getSongDataUG } from './songDataServiceUG.js'
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
 * 🎯 MAIN FUNCTION: Test single song processing
 */
async function testSingleSong() {
  console.log('🧪 SINGLE SONG TEST - UG Data Processing (DIFFERENT SONG)')
  console.log('========================================================')
  
  try {
    // Step 1: Get one song with UG tab ID
    console.log('📊 Step 1: Getting one song with UG tab ID...')
    const testSong = await getOneTestSong()
    
    if (!testSong) {
      console.log('❌ No test song found with UG tab ID')
      return
    }
    
    console.log(`✅ Test song: "${testSong.title}" by ${testSong.artist} (Tab ID: ${testSong.ug_tab_id})`)
    
    // Step 2: Check if already processed
    console.log('\n🔍 Step 2: Checking if song already has complete data...')
    // TEMPORARILY COMMENTED OUT TO FORCE FRESH DATA FETCH
    // const existingSong = await getSongByUGTabId(testSong.ug_tab_id)
    
    // if (existingSong.success) {
    //   console.log(`ℹ️ Song already exists with complete data (ID: ${existingSong.song.id})`)
    //   console.log('📋 Examining existing data structure...')
    //   await examineExistingSongData(existingSong.song.id)
    //   return
    // }
    
    console.log('🔄 Forcing fresh UG data fetch for testing...')
    
    // Step 3: Fetch UG data via Go tool
    console.log('\n🔄 Step 3: Fetching UG data via Go tool...')
    console.log(`🎯 Calling UG scraper for Tab ID: ${testSong.ug_tab_id}`)
    
    const songData = await getSongDataUG(testSong.ug_tab_id)
    
    if (!songData) {
      console.log(`❌ No UG data returned for Tab ID ${testSong.ug_tab_id}`)
      return
    }
    
    console.log(`✅ UG data fetched successfully!`)
    console.log(`📝 Song: ${songData.title} by ${songData.artist}`)
    
    // Step 4: Examine the raw data structure
    console.log('\n🔍 Step 4: Examining raw UG data structure...')
    await examineRawUGData(songData)
    
    // Step 5: Attempt to store (this will reveal any schema mismatches)
    console.log('\n💾 Step 5: Attempting to store song data...')
    const storeResult = await createCompleteSong(songData)
    
    if (storeResult.success) {
      console.log(`✅ Song stored successfully (ID: ${storeResult.songId})`)
      console.log('\n🔍 Examining stored data structure...')
      await examineStoredSongData(storeResult.songId)
    } else {
      console.log(`❌ Failed to store song: ${storeResult.error}`)
      console.log('🔍 This error might reveal missing schema fields!')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

/**
 * 📊 Get one test song with UG tab ID
 */
async function getOneTestSong() {
  try {
    // Try to get a different song than "Nothing Else Matters" to test data richness
    const { data: songs, error } = await supabase
      .from('songs')
      .select('id, title, artist, ug_tab_id')
      .not('ug_tab_id', 'is', null)
      .neq('title', 'Nothing Else Matters')  // Exclude the song we already tested
      .limit(1)
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }
    
    return songs?.[0] || null
    
  } catch (error) {
    console.error('❌ Error getting test song:', error.message)
    throw error
  }
}

/**
 * 🔍 Examine raw UG data structure to identify potential schema gaps
 */
async function examineRawUGData(songData) {
  console.log('\n📊 RAW UG DATA STRUCTURE ANALYSIS:')
  console.log('====================================')
  
  // Basic song info
  console.log('🎵 BASIC SONG INFO:')
  console.log(`  Title: ${songData.title}`)
  console.log(`  Artist: ${songData.artist}`)
  console.log(`  UG Tab ID: ${songData.ug_tab_id}`)
  console.log(`  URL: ${songData.ug_url || 'N/A'}`)
  
  // Check for fields we might not have in schema
  const potentialMissingFields = []
  
  if (songData.album && songData.album !== 'N/A') {
    console.log(`  Album: ${songData.album}`)
  }
  
  if (songData.year) {
    console.log(`  Year: ${songData.year}`)
  }
  
  if (songData.genre) {
    console.log(`  Genre: ${songData.genre}`)
  }
  
  if (songData.tempo) {
    console.log(`  Tempo: ${songData.tempo} BPM`)
  }
  
  if (songData.key_signature) {
    console.log(`  Key: ${songData.key_signature}`)
  }
  
  if (songData.time_signature) {
    console.log(`  Time Signature: ${songData.time_signature}`)
  }
  
  if (songData.difficulty) {
    console.log(`  Difficulty: ${songData.difficulty}`)
  }
  
  if (songData.tuning) {
    console.log(`  Tuning: ${songData.tuning}`)
  }
  
  if (songData.capo_position) {
    console.log(`  Capo: ${songData.capo_position}`)
  }
  
  // Sections analysis
  console.log('\n📋 SECTIONS ANALYSIS:')
  if (songData.sections && songData.sections.length > 0) {
    console.log(`  Total sections: ${songData.sections.length}`)
    
    songData.sections.forEach((section, index) => {
      console.log(`  Section ${index + 1}: ${section.section_name} (${section.section_type})`)
      console.log(`    Start: ${section.start_time}, End: ${section.end_time}`)
      
      // Check for missing section fields
      if (section.repeat_count) console.log(`    Repeats: ${section.repeat_count}`)
      if (section.performance_notes) console.log(`    Notes: ${section.performance_notes}`)
      if (section.tab_content) console.log(`    Has tab content: ${Object.keys(section.tab_content).length} fields`)
      if (section.chord_progression) console.log(`    Has chord progression: ${Object.keys(section.chord_progression).length} fields`)
    })
  } else {
    console.log('  No sections found')
  }
  
  // Chord progressions analysis
  console.log('\n🎸 CHORD PROGRESSIONS ANALYSIS:')
  if (songData.chordProgressions && songData.chordProgressions.length > 0) {
    console.log(`  Total chord progressions: ${songData.chordProgressions.length}`)
    
    songData.chordProgressions.forEach((progression, index) => {
      console.log(`  Progression ${index + 1}: ${progression.chord_name}`)
      console.log(`    Start: ${progression.start_time}, End: ${progression.end_time}`)
      console.log(`    Type: ${progression.chord_type}, Root: ${progression.root_note}`)
      
      // Check for missing chord fields
      if (progression.chord_data) {
        console.log(`    Chord data fields: ${Object.keys(progression.chord_data).join(', ')}`)
      }
      if (progression.finger_positions) console.log(`    Has finger positions`)
      if (progression.alternative_voicings) console.log(`    Has alternative voicings`)
      if (progression.barre_technique) console.log(`    Barre technique: ${progression.barre_technique}`)
      if (progression.stretch_required) console.log(`    Stretch required: ${progression.stretch_required}`)
    })
  } else {
    console.log('  No chord progressions found')
  }
  
  // Look for any other unexpected fields
  console.log('\n🔍 UNEXPECTED FIELDS ANALYSIS:')
  const expectedFields = ['title', 'artist', 'ug_tab_id', 'ug_url', 'sections', 'chordProgressions']
  const unexpectedFields = Object.keys(songData).filter(field => !expectedFields.includes(field))
  
  if (unexpectedFields.length > 0) {
    console.log('  Found unexpected fields that might need schema additions:')
    unexpectedFields.forEach(field => {
      const value = songData[field]
      const valueStr = value !== null && value !== undefined ? JSON.stringify(value) : 'null/undefined'
      console.log(`    ${field}: ${typeof value} - ${valueStr.substring(0, 100)}...`)
    })
  } else {
    console.log('  No unexpected fields found')
  }
  
  // Check for nested objects that might contain valuable data
  console.log('\n🔍 NESTED OBJECT ANALYSIS:')
  Object.entries(songData).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      console.log(`  ${key} object contains: ${Object.keys(value).join(', ')}`)
    }
  })
}

/**
 * 🔍 Examine existing song data structure
 */
async function examineExistingSongData(songId) {
  try {
    // Get song details
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single()
    
    if (songError) throw songError
    
    console.log('\n📊 EXISTING SONG DATA STRUCTURE:')
    console.log('==================================')
    console.log(`Song ID: ${song.id}`)
    console.log(`Title: ${song.title}`)
    console.log(`Artist: ${song.artist}`)
    console.log(`UG Tab ID: ${song.ug_tab_id}`)
    
    // Check for any fields that might be missing from our schema
    const schemaFields = [
      'id', 'title', 'artist', 'ug_tab_id', 'ug_url', 'key_signature', 'tempo', 
      'time_signature', 'difficulty', 'genre', 'year', 'album', 'created_at', 
      'updated_at', 'created_by', 'instrument_type', 'tuning', 'tabbed_by', 
      'scan_count', 'last_scanned', 'ug_rating', 'ug_votes', 'ug_views', 
      'capo_position', 'alternative_tunings', 'complexity_score', 'popularity_rank',
      'ug_last_updated', 'tab_count', 'official_tab', 'verified_tab', 
      'tab_contributor', 'tab_contribution_date', 'tab_quality_score', 
      'scan_attempts', 'last_scan_success', 'scan_error_message', 'data_completeness_score'
    ]
    
    const missingFields = schemaFields.filter(field => !(field in song))
    if (missingFields.length > 0) {
      console.log(`\n⚠️ Missing schema fields: ${missingFields.join(', ')}`)
    }
    
    // Check related tables
    await examineRelatedTables(songId)
    
  } catch (error) {
    console.error('❌ Error examining existing song:', error.message)
  }
}

/**
 * 🔍 Examine stored song data after successful storage
 */
async function examineStoredSongData(songId) {
  try {
    console.log('\n📊 STORED SONG DATA VERIFICATION:')
    console.log('==================================')
    
    // Get song details
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single()
    
    if (songError) throw songError
    
    console.log(`✅ Song stored with ID: ${song.id}`)
    console.log(`Title: ${song.title}`)
    console.log(`Artist: ${song.artist}`)
    console.log(`UG Tab ID: ${song.ug_tab_id}`)
    
    // Check related tables
    await examineRelatedTables(songId)
    
  } catch (error) {
    console.error('❌ Error examining stored song:', error.message)
  }
}

/**
 * 🔍 Examine related tables for the song
 */
async function examineRelatedTables(songId) {
  try {
    // Check song_sections
    const { data: sections, error: sectionsError } = await supabase
      .from('song_sections')
      .select('*')
      .eq('song_id', songId)
    
    if (sectionsError) throw sectionsError
    
    console.log(`\n📋 Song Sections: ${sections?.length || 0} found`)
    if (sections && sections.length > 0) {
      sections.forEach((section, index) => {
        console.log(`  Section ${index + 1}: ${section.section_name} (${section.section_type})`)
        console.log(`    Start: ${section.start_time}, End: ${section.end_time}`)
      })
    }
    
    // Check song_chord_progressions
    const { data: chords, error: chordsError } = await supabase
      .from('song_chord_progressions')
      .select('*')
      .eq('song_id', songId)
    
    if (chordsError) throw chordsError
    
    console.log(`\n🎸 Chord Progressions: ${chords?.length || 0} found`)
    if (chords && chords.length > 0) {
      chords.forEach((chord, index) => {
        console.log(`  Chord ${index + 1}: ${chord.chord_name} (${chord.chord_type})`)
        console.log(`    Start: ${chord.start_time}, End: ${chord.end_time}`)
      })
    }
    
    // Check song_attributes
    const { data: attributes, error: attributesError } = await supabase
      .from('song_attributes')
      .select('*')
      .eq('song_id', songId)
    
    if (attributesError) throw attributesError
    
    console.log(`\n🏷️ Song Attributes: ${attributes?.length || 0} found`)
    if (attributes && attributes.length > 0) {
      attributes.forEach((attr, index) => {
        console.log(`  Attribute ${index + 1}: ${attr.type} - ${attr.section_label || 'N/A'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error examining related tables:', error.message)
  }
}

/**
 * 🎯 Main execution
 */
async function main() {
  try {
    await testSingleSong()
    console.log('\n🎉 Single song test completed!')
    console.log('\n🔍 Check the output above for any missing schema fields or data structure insights.')
  } catch (error) {
    console.error('❌ Main execution failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { testSingleSong, examineRawUGData, examineExistingSongData }
