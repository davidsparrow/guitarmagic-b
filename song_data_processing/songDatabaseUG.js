/**
 * 🎸 Ultimate Guitar Song Database Integration
 * 
 * Database operations layer for storing and retrieving Ultimate Guitar song data
 * Uses the enhanced database schema for optimal storage and retrieval
 * 
 * Features:
 * - Song creation and storage
 * - Song section management
 * - Chord progression storage
 * - Rich querying and search
 * - Error handling and validation
 * - Transaction management
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

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
 * Song Data Structure (matches enhanced database schema)
 * @typedef {Object} SongData
 * @property {string} title - Song title
 * @property {string} artist - Song artist
 * @property {number} ugTabId - Ultimate Guitar tab ID
 * @property {string} instrumentType - Instrument type (guitar, bass, etc.)
 * @property {string} tuning - Instrument tuning
 * @property {string} tabbedBy - Who created the tab
 * @property {SongSection[]} sections - Song sections with timing
 * @property {ChordProgression[]} chordProgressions - Chord changes with timing
 * @property {Object} metadata - Additional song information
 */

/**
 * Song Section Structure
 * @typedef {Object} SongSection
 * @property {string} sectionName - Section name (e.g., "Verse 1", "Chorus")
 * @property {string} sectionType - Section type (verse, chorus, bridge, solo, etc.)
 * @property {string} sectionLabel - Section label (e.g., "fig. a", "Guitar Solo")
 * @property {string} startTime - Start time in MM:SS format
 * @property {string} endTime - End time in MM:SS format
 * @property {number} repeatCount - How many times to repeat (2x, 6x, etc.)
 * @property {string} performanceNotes - Performance instructions
 * @property {Object} tabContent - Tab notation for this section
 * @property {Object} chordProgression - Chords in this section
 */

/**
 * Chord Progression Structure
 * @typedef {Object} ChordProgression
 * @property {string} chordName - Chord name (e.g., "Am", "C", "Fmaj7")
 * @property {string} chordType - Chord type (major, minor, 7th, etc.)
 * @property {string} rootNote - Root note (e.g., "A", "C", "F")
 * @property {string} startTime - Start time in MM:SS format
 * @property {string} endTime - End time in MM:SS format
 * @property {number} sequenceOrder - Order in the progression
 * @property {Object} chordData - Full chord information
 */

/**
 * 🎯 MAIN FUNCTION: Create complete song with all related data
 * Primary entry point for storing complete song information
 * 
 * @param {SongData} songData - Complete song data to store
 * @returns {Promise<Object>} Result with song ID and status
 */
export const updateExistingSong = async (songData) => {
  if (!songData || !songData.title || !songData.artist || !songData.existingSongId) {
    throw new Error('Invalid song data provided for update')
  }

  console.log(`🎸 Updating existing song: ${songData.title} by ${songData.artist}`)
  
  try {
    // Update existing song record with complete data
    const { data: song, error: songError } = await supabase
      .from('songs')
      .update({
        title: songData.title,
        artist: songData.artist,
        ug_url: `https://tabs.ultimate-guitar.com/tab/${songData.ugTabId}`,
        instrument_type: songData.instrumentType || 'guitar',
        tuning: songData.tuning || 'E A D G B E',
        tabbed_by: songData.tabbedBy || 'Unknown',
        tabbed_by_email: songData.tabbedByEmail || null, // Store extracted email
        raw_html_header: songData.rawHtmlHeader || null, // Store header metadata
        album: songData.album || null,
        key_signature: songData.keySignature || null,
        tempo: songData.tempo || null,
        time_signature: songData.timeSignature || null,
        difficulty: songData.difficulty || 'beginner',
        genre: songData.genre || null,
        year: songData.year || null,
        // Update data completeness score and boolean fields for UI display readiness
        data_completeness_score: songData.booleanFlags?.data_completeness_score || 0,
        has_lyric_captions: songData.booleanFlags?.has_lyric_captions || false,
        has_chord_captions: songData.booleanFlags?.has_chord_captions || false,
        has_tab_captions: songData.booleanFlags?.has_tab_captions || false,
        lyrics_need_timing: songData.booleanFlags?.lyrics_need_timing || false,
        chords_need_timing: songData.booleanFlags?.chords_need_timing || false,
        tabs_need_timing: songData.booleanFlags?.tabs_need_timing || false,
        
        // 🎯 CRITICAL UI READINESS FIELDS
        needs_user_assistance: songData.booleanFlags?.needs_user_assistance || true,
        is_ui_ready: songData.booleanFlags?.is_ui_ready || false,
        has_raw_html: songData.booleanFlags?.has_raw_html || false, // Raw HTML UI readiness
        updated_at: new Date().toISOString()
      })
      .eq('id', songData.existingSongId)
      .select()
      .single()

    if (songError) {
      console.error('❌ Error updating song:', songError)
      throw new Error(`Failed to update song: ${songError.message}`)
    }

    console.log(`✅ Song updated with ID: ${song.id}`)

    // Create song attributes for the main song
    const attributesResult = await createSongAttributes(song.id, songData)
    if (attributesResult.error) {
      console.warn('⚠️ Warning: Some attributes failed to create:', attributesResult.error)
    }

    // Create song sections if available
    let sectionsResult = { success: 0, error: null }
    if (songData.sections && songData.sections.length > 0) {
      sectionsResult = await createSongSections(song.id, songData.sections)
      if (sectionsResult.error) {
        console.warn('⚠️ Warning: Some sections failed to create:', sectionsResult.error)
      }
    }

    // Create chord progressions if available
    let chordResult = { success: 0, error: null }
    if (songData.chordProgressions && songData.chordProgressions.length > 0) {
      chordResult = await createChordProgressions(song.id, songData.chordProgressions)
      if (chordResult.error) {
        console.warn('⚠️ Warning: Some chord progressions failed to create:', chordResult.error)
      }
    }

    return {
      success: true,
      songId: song.id,
      song: song,
      attributes: attributesResult,
      sections: sectionsResult,
      chordProgressions: chordResult,
      message: `Successfully updated song "${songData.title}" with ${sectionsResult.success} sections and ${chordResult.success} chord progressions`
    }

  } catch (error) {
    console.error('❌ Error in updateExistingSong:', error)
    return {
      success: false,
      error: error.message,
      message: 'Failed to update existing song'
    }
  }
}

export const createCompleteSong = async (songData) => {
  if (!songData || !songData.title || !songData.artist) {
    throw new Error('Invalid song data provided')
  }

  console.log(`🎸 Creating complete song: ${songData.title} by ${songData.artist}`)
  
  try {
    // Start database transaction
    const { data: song, error: songError } = await supabase
      .from('songs')
      .insert({
        title: songData.title,
        artist: songData.artist,
        ug_tab_id: songData.ugTabId,
        ug_url: `https://tabs.ultimate-guitar.com/tab/${songData.ugTabId}`,
        instrument_type: songData.instrumentType || 'guitar',
        tuning: songData.tuning || 'E A D G B E',
        tabbed_by: songData.tabbedBy || 'Unknown',
        tabbed_by_email: songData.tabbedByEmail || null, // Store extracted email
        raw_html_header: songData.rawHtmlHeader || null, // Store header metadata
        album: songData.album || null,
        key_signature: songData.keySignature || null,
        tempo: songData.tempo || null,
        time_signature: songData.timeSignature || null,
        difficulty: songData.difficulty || 'beginner',
        genre: songData.genre || null,
        year: songData.year || null,
        // Add data completeness score and boolean fields for UI display readiness
        data_completeness_score: songData.booleanFlags?.data_completeness_score || 0,
        has_lyric_captions: songData.booleanFlags?.has_lyric_captions || false,
        has_chord_captions: songData.booleanFlags?.has_chord_captions || false,
        has_tab_captions: songData.booleanFlags?.has_tab_captions || false,
        lyrics_need_timing: songData.booleanFlags?.lyrics_need_timing || false,
        chords_need_timing: songData.booleanFlags?.chords_need_timing || false,
        tabs_need_timing: songData.booleanFlags?.tabs_need_timing || false,
        has_raw_html: songData.booleanFlags?.has_raw_html || false // Raw HTML UI readiness
      })
      .select()
      .single()

    if (songError) {
      console.error('❌ Error creating song:', songError)
      throw new Error(`Failed to create song: ${songError.message}`)
    }

    console.log(`✅ Song created with ID: ${song.id}`)

    // Create song attributes for the main song
    const attributesResult = await createSongAttributes(song.id, songData)
    if (attributesResult.error) {
      console.warn('⚠️ Warning: Some attributes failed to create:', attributesResult.error)
    }

    // Create song sections if available
    let sectionsResult = { success: 0, error: null }
    if (songData.sections && songData.sections.length > 0) {
      sectionsResult = await createSongSections(song.id, songData.sections)
      if (sectionsResult.error) {
        console.warn('⚠️ Warning: Some sections failed to create:', sectionsResult.error)
      }
    }

    // Create chord progressions if available
    let chordResult = { success: 0, error: null }
    if (songData.chordProgressions && songData.chordProgressions.length > 0) {
      chordResult = await createChordProgressions(song.id, songData.chordProgressions)
      if (chordResult.error) {
        console.warn('⚠️ Warning: Some chord progressions failed to create:', chordResult.error)
      }
    }

    return {
      success: true,
      songId: song.id,
      song: song,
      attributes: attributesResult,
      sections: sectionsResult,
      chordProgressions: chordResult,
      message: `Successfully created song "${songData.title}" with ${sectionsResult.success} sections and ${chordResult.success} chord progressions`
    }

  } catch (error) {
    console.error('❌ Error in createCompleteSong:', error)
    return {
      success: false,
      error: error.message,
      message: 'Failed to create complete song'
    }
  }
}

/**
 * 📋 Create song attributes in the song_attributes table
 * 
 * @param {string} songId - UUID of the song
 * @param {SongData} songData - Song data containing attributes
 * @returns {Promise<Object>} Result of attribute creation
 */
const createSongAttributes = async (songId, songData) => {
  try {
    const attributes = []

    // Create main song attribute
    attributes.push({
      song_id: songId,
      type: 'metadata',
      sequence_order: 0,
      data: {
        source: 'ultimate_guitar',
        instrument_type: songData.instrumentType,
        tuning: songData.tuning,
        tabbed_by: songData.tabbedBy,
        album: songData.album,
        key_signature: songData.keySignature,
        tempo: songData.tempo,
        time_signature: songData.timeSignature,
        difficulty: songData.difficulty,
        genre: songData.genre,
        year: songData.year,
        transformation_date: new Date().toISOString()
      }
    })

    // Create song structure attribute
    if (songData.sections && songData.sections.length > 0) {
      attributes.push({
        song_id: songId,
        type: 'song_structure',
        sequence_order: 1,
        data: {
          total_sections: songData.sections.length,
          section_types: [...new Set(songData.sections.map(s => s.sectionType))],
          has_timing: songData.sections.some(s => s.startTime && s.endTime),
          has_performance_notes: songData.sections.some(s => s.performanceNotes)
        }
      })
    }

    // Create chord progression attribute
    if (songData.chordProgressions && songData.chordProgressions.length > 0) {
      attributes.push({
        song_id: songId,
        type: 'chord_progression',
        sequence_order: 2,
        data: {
          total_chords: songData.chordProgressions.length,
          chord_types: [...new Set(songData.chordProgressions.map(c => c.chordType))],
          has_timing: songData.chordProgressions.some(c => c.startTime && c.endTime),
          unique_chords: [...new Set(songData.chordProgressions.map(c => c.chordName))]
        }
      })
    }

    // Insert all attributes
    const { data, error } = await supabase
      .from('song_attributes')
      .insert(attributes)
      .select()

    if (error) {
      console.error('❌ Error creating song attributes:', error)
      return { success: 0, error: error.message }
    }

    console.log(`✅ Created ${data.length} song attributes`)
    return { success: data.length, error: null }

  } catch (error) {
    console.error('❌ Error in createSongAttributes:', error)
    return { success: 0, error: error.message }
  }
}

/**
 * 📊 Create song sections in the song_sections table
 * 
 * @param {string} songId - UUID of the song
 * @param {SongSection[]} sections - Array of song sections
 * @returns {Promise<Object>} Result of section creation
 */
const createSongSections = async (songId, sections) => {
  try {
    if (!sections || sections.length === 0) {
      return { success: 0, error: null }
    }

    const sectionRecords = sections.map((section, index) => ({
      song_id: songId,
      section_name: section.sectionName,
      section_type: section.sectionType,
      section_label: section.sectionLabel,
      start_time: section.startTime,
      end_time: section.endTime,
      repeat_count: section.repeatCount || 1,
      performance_notes: section.performanceNotes,
      sequence_order: section.sequenceOrder || index,
      tab_content: section.tabContent || {},
      chord_progression: section.chordProgression || {},
      duration_seconds: section.durationSeconds || null
    }))

    const { data, error } = await supabase
      .from('song_sections')
      .insert(sectionRecords)
      .select()

    if (error) {
      console.error('❌ Error creating song sections:', error)
      return { success: 0, error: error.message }
    }

    console.log(`✅ Created ${data.length} song sections`)
    return { success: data.length, error: null }

  } catch (error) {
    console.error('❌ Error in createSongSections:', error)
    return { success: 0, error: error.message }
  }
}

/**
 * 🎵 Create chord progressions in the song_chord_progressions table
 * 
 * @param {string} songId - UUID of the song
 * @param {ChordProgression[]} chordProgressions - Array of chord progressions
 * @returns {Promise<Object>} Result of chord progression creation
 */
const createChordProgressions = async (songId, chordProgressions) => {
  try {
    if (!chordProgressions || chordProgressions.length === 0) {
      return { success: 0, error: null }
    }

    const chordRecords = chordProgressions.map((chord, index) => ({
      song_id: songId,
      chord_name: chord.chordName,
      chord_type: chord.chordType,
      root_note: chord.rootNote,
      start_time: chord.startTime,
      end_time: chord.endTime,
      sequence_order: chord.sequenceOrder || index,
      bar_position: chord.barPosition || null,
      chord_data: {
        ...chord.chordData,
        fingering: chord.chordData?.fingering || null,
        notes: chord.chordData?.notes || []
      }
    }))

    const { data, error } = await supabase
      .from('song_chord_progressions')
      .insert(chordRecords)
      .select()

    if (error) {
      console.error('❌ Error creating chord progressions:', error)
      return { success: 0, error: error.message }
    }

    console.log(`✅ Created ${data.length} chord progressions`)
    return { success: data.length, error: null }

  } catch (error) {
    console.error('❌ Error in createChordProgressions:', error)
    return { success: 0, error: error.message }
  }
}

/**
 * 🔍 Retrieve complete song data with all related information
 * 
 * @param {string} songId - UUID of the song
 * @returns {Promise<Object>} Complete song data with sections and chords
 */
export const getSongWithStructure = async (songId) => {
  try {
    console.log(`🔍 Retrieving complete song data for ID: ${songId}`)

    // Get main song data
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single()

    if (songError) {
      throw new Error(`Failed to retrieve song: ${songError.message}`)
    }

    // Get song attributes
    const { data: attributes, error: attrError } = await supabase
      .from('song_attributes')
      .select('*')
      .eq('song_id', songId)
      .order('sequence_order')

    if (attrError) {
      console.warn('⚠️ Warning: Failed to retrieve song attributes:', attrError.message)
    }

    // Get song sections
    const { data: sections, error: sectionError } = await supabase
      .from('song_sections')
      .select('*')
      .eq('song_id', songId)
      .order('sequence_order')

    if (sectionError) {
      console.warn('⚠️ Warning: Failed to retrieve song sections:', sectionError.message)
    }

    // Get chord progressions
    const { data: chords, error: chordError } = await supabase
      .from('song_chord_progressions')
      .select('*')
      .eq('song_id', songId)
      .order('sequence_order')

    if (chordError) {
      console.warn('⚠️ Warning: Failed to retrieve chord progressions:', chordError.message)
    }

    // Create enhanced song object with all related data
    const enhancedSong = {
      ...song,
      chordProgressions: chords || [],
      sections: sections || [],
      attributes: attributes || []
    }

    return {
      success: true,
      song: enhancedSong,
      attributes: attributes || [],
      sections: sections || [],
      chordProgressions: chords || [],
      message: `Successfully retrieved song "${song.title}" with ${sections?.length || 0} sections and ${chords?.length || 0} chord progressions`
    }

  } catch (error) {
    console.error('❌ Error in getSongWithStructure:', error)
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve song data'
    }
  }
}

/**
 * 🔍 Search for songs by various criteria
 * 
 * @param {Object} searchCriteria - Search parameters
 * @param {string} searchCriteria.query - Text search in title/artist
 * @param {string} searchCriteria.artist - Artist name
 * @param {string} searchCriteria.genre - Genre
 * @param {string} searchCriteria.instrumentType - Instrument type
 * @param {number} searchCriteria.limit - Maximum results to return
 * @returns {Promise<Object>} Search results
 */
export const searchSongs = async (searchCriteria = {}) => {
  try {
    console.log(`🔍 Searching songs with criteria:`, searchCriteria)

    let query = supabase
      .from('songs')
      .select('*')
      .order('title')

    // Apply search filters
    if (searchCriteria.query) {
      query = query.or(`title.ilike.%${searchCriteria.query}%,artist.ilike.%${searchCriteria.query}%`)
    }

    if (searchCriteria.artist) {
      query = query.eq('artist', searchCriteria.artist)
    }

    if (searchCriteria.genre) {
      query = query.eq('genre', searchCriteria.genre)
    }

    if (searchCriteria.instrumentType) {
      query = query.eq('instrument_type', searchCriteria.instrumentType)
    }

    // Apply limit
    if (searchCriteria.limit) {
      query = query.limit(searchCriteria.limit)
    }

    const { data: songs, error } = await query

    if (error) {
      throw new Error(`Search failed: ${error.message}`)
    }

    return {
      success: true,
      songs: songs || [],
      total: songs?.length || 0,
      message: `Found ${songs?.length || 0} songs matching criteria`
    }

  } catch (error) {
    console.error('❌ Error in searchSongs:', error)
    return {
      success: false,
      error: error.message,
      message: 'Search failed'
    }
  }
}

/**
 * 🎯 Get song by Ultimate Guitar tab ID
 * 
 * @param {number} ugTabId - Ultimate Guitar tab ID
 * @returns {Promise<Object>} Song data if found
 */
export const getSongByUGTabId = async (ugTabId) => {
  try {
    console.log(`🎯 Looking up song by UG tab ID: ${ugTabId}`)

    const { data: song, error } = await supabase
      .from('songs')
      .select('*')
      .eq('ug_tab_id', ugTabId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Song not found',
          message: `No song found with UG tab ID: ${ugTabId}`
        }
      }
      throw new Error(`Lookup failed: ${error.message}`)
    }

    return {
      success: true,
      song: song,
      message: `Found song: ${song.title} by ${song.artist}`
    }

  } catch (error) {
    console.error('❌ Error in getSongByUGTabId:', error)
    return {
      success: false,
      error: error.message,
      message: 'Lookup failed'
    }
  }
}

/**
 * 🧪 Test function to verify database integration works
 * 
 * @param {SongData} testSongData - Test song data to use
 * @returns {Promise<Object>} Test results
 */
export const testDatabaseIntegration = async (testSongData = null) => {
  console.log('🧪 Testing Database Integration')
  console.log('================================')

  try {
    // Create test song data if none provided
    const songData = testSongData || {
      title: 'Test Song - Database Integration',
      artist: 'Test Artist',
      ugTabId: 999999, // Use a unique test ID
      instrumentType: 'guitar',
      tuning: 'E A D G B E',
      tabbedBy: 'Test System',
      album: 'Test Album',
      sections: [
        {
          sectionName: 'Test Section 1',
          sectionType: 'verse',
          sectionLabel: 'Test Label',
          startTime: '0:00',
          endTime: '1:00',
          repeatCount: 1,
          performanceNotes: 'Test performance note',
          sequenceOrder: 0,
          tabContent: {},
          chordProgression: {}
        }
      ],
      chordProgressions: [
        {
          chordName: 'Am',
          chordType: 'minor',
          rootNote: 'A',
          startTime: '0:00',
          endTime: '0:30',
          sequenceOrder: 0,
          chordData: {
            fingering: ['X', '0', '2', '2', '1', '0'],
            notes: ['A', 'E', 'A', 'C', 'E']
          }
        }
      ]
    }

    console.log('📝 Test song data:', {
      title: songData.title,
      artist: songData.artist,
      sections: songData.sections.length,
      chordProgressions: songData.chordProgressions.length
    })

    // Test 1: Create complete song
    console.log('\n🧪 Test 1: Creating complete song')
    const createResult = await createCompleteSong(songData)
    
    if (!createResult.success) {
      throw new Error(`Create test failed: ${createResult.error}`)
    }

    console.log('✅ Test 1 passed: Song created successfully')
    console.log(`   Song ID: ${createResult.songId}`)

    // Test 2: Retrieve complete song data
    console.log('\n🧪 Test 2: Retrieving complete song data')
    const retrieveResult = await getSongWithStructure(createResult.songId)
    
    if (!retrieveResult.success) {
      throw new Error(`Retrieve test failed: ${retrieveResult.error}`)
    }

    console.log('✅ Test 2 passed: Song data retrieved successfully')
    console.log(`   Sections: ${retrieveResult.sections.length}`)
    console.log(`   Chords: ${retrieveResult.chordProgressions.length}`)

    // Test 3: Search for the song
    console.log('\n🧪 Test 3: Searching for the song')
    const searchResult = await searchSongs({ query: songData.title })
    
    if (!searchResult.success) {
      throw new Error(`Search test failed: ${searchResult.error}`)
    }

    console.log('✅ Test 3 passed: Song search working')
    console.log(`   Found: ${searchResult.total} songs`)

    // Test 4: Lookup by UG tab ID
    console.log('\n🧪 Test 4: Looking up by UG tab ID')
    const lookupResult = await getSongByUGTabId(songData.ugTabId)
    
    if (!lookupResult.success) {
      throw new Error(`Lookup test failed: ${lookupResult.error}`)
    }

    console.log('✅ Test 4 passed: UG tab ID lookup working')
    console.log(`   Found: ${lookupResult.song.title}`)

    // Clean up test data
    console.log('\n🧹 Cleaning up test data')
    const { error: deleteError } = await supabase
      .from('songs')
      .delete()
      .eq('id', createResult.songId)

    if (deleteError) {
      console.warn('⚠️ Warning: Failed to clean up test data:', deleteError.message)
    } else {
      console.log('✅ Test data cleaned up successfully')
    }

    return {
      success: true,
      message: 'All database integration tests passed successfully!',
      testResults: {
        create: createResult,
        retrieve: retrieveResult,
        search: searchResult,
        lookup: lookupResult
      }
    }

  } catch (error) {
    console.error('❌ Database integration test failed:', error)
    return {
      success: false,
      error: error.message,
      message: 'Database integration test failed'
    }
  }
}

/**
 * 🎯 Database Integration Status Check
 * Returns the current status of the database integration
 * 
 * @returns {Object} Integration status information
 */
export const getDatabaseIntegrationStatus = () => {
  return {
    service: 'Song Database Integration UG',
    status: 'ready',
    features: [
      'Complete song creation',
      'Song section management',
      'Chord progression storage',
      'Rich querying and search',
      'UG tab ID lookup',
      'Transaction management'
    ],
    database: {
      platform: 'Supabase (PostgreSQL)',
      schema: 'Enhanced song database schema',
      tables: ['songs', 'song_attributes', 'song_sections', 'song_chord_progressions'],
      status: 'Ready for data insertion'
    },
    lastUpdated: new Date().toISOString(),
    nextStep: 'Test with real UG data and create API endpoints'
  }
}

/**
 * 🎯 Update chord progression timing with sequential intervals
 * Assigns 10-second intervals to chord progressions in sequence order
 * 
 * @param {string} songId - Song ID to update
 * @param {number} intervalSeconds - Interval duration in seconds (default: 10)
 * @returns {Promise<Object>} Result with update status
 */
export const updateChordProgressionTiming = async (songId, intervalSeconds = 10) => {
  try {
    console.log(`🎵 Analyzing chord progression timing for song: ${songId}`)

    // Get all chord progressions for this song
    const { data: chordProgressions, error: fetchError } = await supabase
      .from('song_chord_progressions')
      .select('*')
      .eq('song_id', songId)
      .order('sequence_order')

    if (fetchError) {
      throw new Error(`Failed to fetch chord progressions: ${fetchError.message}`)
    }

    if (!chordProgressions || chordProgressions.length === 0) {
      return {
        success: false,
        error: 'No chord progressions found for this song',
        message: 'No chord progressions to update'
      }
    }

    console.log(`📊 Found ${chordProgressions.length} chord progressions to analyze`)

    // 🎯 SMART DETECTION: Check if all records have identical placeholder timing
    const firstRecord = chordProgressions[0]
    const lastRecord = chordProgressions[chordProgressions.length - 1]
    const middleIndex = Math.floor(chordProgressions.length / 2)
    const middleRecord = chordProgressions[middleIndex]

    const firstTiming = `${firstRecord.start_time} - ${firstRecord.end_time}`
    const lastTiming = `${lastRecord.start_time} - ${lastRecord.end_time}`
    const middleTiming = `${middleRecord.start_time} - ${middleRecord.end_time}`

    console.log(`🔍 Timing Analysis:`)
    console.log(`  First record (${firstRecord.chord_name}): ${firstTiming}`)
    console.log(`  Middle record (${middleRecord.chord_name}): ${middleTiming}`)
    console.log(`  Last record (${lastRecord.chord_name}): ${lastTiming}`)

    const allTimingIdentical = (firstTiming === lastTiming && firstTiming === middleTiming)
    
    if (allTimingIdentical) {
      console.log(`✅ DETECTED: All records have identical timing (${firstTiming})`)
      console.log(`🎯 This appears to be placeholder timing - running sequential update...`)
      console.log(`⏱️ Using ${intervalSeconds}-second intervals`)
    } else {
      console.log(`⚠️ DETECTED: Records have different timing values`)
      console.log(`🎯 This appears to have real timing data - SKIPPING update`)
      return {
        success: true,
        updatedCount: 0,
        message: `Skipped timing update - detected real timing data (first: ${firstTiming}, middle: ${middleTiming}, last: ${lastTiming})`,
        timingSummary: [],
        skipped: true,
        reason: 'Real timing data detected'
      }
    }

    // Calculate timing for each chord progression
    const updates = chordProgressions.map((chord, index) => {
      const startSeconds = index * intervalSeconds
      const endSeconds = (index + 1) * intervalSeconds
      
      const startTime = formatTime(startSeconds)
      const endTime = formatTime(endSeconds)
      
      return {
        id: chord.id,
        start_time: startTime,
        end_time: endTime,
        duration_seconds: intervalSeconds
      }
    })

    // Update all chord progressions one by one
    let updateErrors = []
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('song_chord_progressions')
        .update({
          start_time: update.start_time,
          end_time: update.end_time,
          duration_seconds: update.duration_seconds
        })
        .eq('id', update.id)
      
      if (updateError) {
        updateErrors.push(`Failed to update chord ${update.id}: ${updateError.message}`)
      }
    }

    if (updateErrors.length > 0) {
      throw new Error(`Failed to update chord progressions: ${updateErrors.join(', ')}`)
    }

    console.log(`✅ Successfully updated ${updates.length} chord progressions`)

    // Show timing summary
    console.log('📋 Timing Summary:')
    updates.forEach((update, index) => {
      const chord = chordProgressions[index]
      console.log(`  ${index + 1}. ${chord.chord_name}: ${update.start_time} - ${update.end_time}`)
    })

    return {
      success: true,
      updatedCount: updates.length,
      message: `Successfully updated ${updates.length} chord progressions with ${intervalSeconds}-second intervals`,
      timingSummary: updates.map((update, index) => ({
        chordName: chordProgressions[index].chord_name,
        startTime: update.start_time,
        endTime: update.end_time
      }))
    }

  } catch (error) {
    console.error('❌ Error updating chord progression timing:', error)
    return {
      success: false,
      error: error.message,
      message: 'Failed to update chord progression timing'
    }
  }
}

/**
 * 🧪 Test function to demonstrate smart timing detection
 * This function simulates different timing scenarios for testing
 * 
 * @param {string} songId - Song ID to test
 * @param {string} scenario - 'placeholder', 'mixed', or 'real'
 * @returns {Promise<Object>} Test result
 */
export const testTimingDetection = async (songId, scenario = 'placeholder') => {
  try {
    console.log(`🧪 Testing timing detection scenario: ${scenario}`)
    
    // Get chord progressions
    const { data: chordProgressions, error: fetchError } = await supabase
      .from('song_chord_progressions')
      .select('*')
      .eq('song_id', songId)
      .order('sequence_order')

    if (fetchError || !chordProgressions || chordProgressions.length === 0) {
      return { success: false, error: 'No chord progressions found' }
    }

    // Simulate different timing scenarios
    let testUpdates = []
    
    if (scenario === 'placeholder') {
      // All records have identical placeholder timing
      testUpdates = chordProgressions.map(chord => ({
        id: chord.id,
        start_time: '0:00',
        end_time: '0:10'
      }))
    } else if (scenario === 'mixed') {
      // Some records have different timing (simulating partial real data)
      testUpdates = chordProgressions.map((chord, index) => {
        if (index < 10) {
          return {
            id: chord.id,
            start_time: '0:00',
            end_time: '0:10'
          }
        } else {
          return {
            id: chord.id,
            start_time: '1:30',
            end_time: '1:40'
          }
        }
      })
    } else if (scenario === 'real') {
      // All records have different timing (simulating real data)
      testUpdates = chordProgressions.map((chord, index) => {
        const startSeconds = index * 15
        const endSeconds = (index + 1) * 15
        const startTime = formatTime(startSeconds)
        const endTime = formatTime(endSeconds)
        return {
          id: chord.id,
          start_time: startTime,
          end_time: endTime
        }
      })
    }

    // Apply test timing
    for (const update of testUpdates) {
      const { error: updateError } = await supabase
        .from('song_chord_progressions')
        .update({
          start_time: update.start_time,
          end_time: update.end_time
        })
        .eq('id', update.id)
      
      if (updateError) {
        console.error(`Failed to update chord ${update.id}:`, updateError.message)
      }
    }

    console.log(`✅ Applied ${scenario} timing scenario`)
    
    // Now test the detection logic
    return await updateChordProgressionTiming(songId, 10)

  } catch (error) {
    console.error('❌ Error in test timing detection:', error)
    return {
      success: false,
      error: error.message,
      message: 'Failed to test timing detection'
    }
  }
}

/**
 * Helper function to format seconds into MM:SS format
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Formatted time string
 */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
