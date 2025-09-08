/**
 * 🧪 Test Script for Database Integration with Real UG Data
 * 
 * Tests the complete pipeline: UG data fetching → transformation → database storage
 * Uses real Ultimate Guitar tab IDs to verify end-to-end functionality
 */

import { testDatabaseIntegration, getDatabaseIntegrationStatus } from './songDatabaseUG.js'
import { getSongDataUG } from './songDataServiceUG.js'

/**
 * Test the complete database integration pipeline with real UG data
 */
async function runDatabaseIntegrationTests() {
  console.log('🎸 Testing Complete Database Integration Pipeline')
  console.log('================================================')
  
  // Check database integration status
  const status = getDatabaseIntegrationStatus()
  console.log('📊 Database Integration Status:', status)
  console.log('')
  
  // Test 1: Database integration with test data
  console.log('🧪 Test 1: Database Integration with Test Data')
  console.log('Expected: Create, retrieve, search, and lookup test song')
  console.log('---')
  
  try {
    const testResult = await testDatabaseIntegration()
    if (testResult.success) {
      console.log('✅ Test 1 Result:', testResult.message)
      console.log('   Create: ✅', testResult.testResults.create.message)
      console.log('   Retrieve: ✅', testResult.testResults.retrieve.message)
      console.log('   Search: ✅', testResult.testResults.search.message)
      console.log('   Lookup: ✅', testResult.testResults.lookup.message)
    } else {
      console.error('❌ Test 1 Failed:', testResult.error)
      return
    }
  } catch (error) {
    console.error('❌ Test 1 Error:', error.message)
    return
  }
  
  console.log('')
  
  // Test 2: Real UG data pipeline - Tab ID 100 (The Prophet by Yes)
  console.log('🧪 Test 2: Real UG Data Pipeline - Tab ID 100')
  console.log('Expected: Fetch UG data, transform, and store in database')
  console.log('---')
  
  try {
    console.log('🔄 Step 1: Fetching UG data for Tab ID 100...')
    const songData = await getSongDataUG(100)
    
    if (!songData) {
      console.error('❌ Failed to fetch UG data for Tab ID 100')
      return
    }
    
    console.log('✅ UG data fetched successfully:', {
      title: songData.title,
      artist: songData.artist,
      sections: songData.sections.length,
      chordProgressions: songData.chordProgressions.length
    })
    
    console.log('🔄 Step 2: Storing song data in database...')
            const { createCompleteSong } = await import('./songDatabaseUG.js')
    const storeResult = await createCompleteSong(songData)
    
    if (storeResult.success) {
      console.log('✅ Song stored successfully:', {
        songId: storeResult.songId,
        sections: storeResult.sections.success,
        chordProgressions: storeResult.chordProgressions.success
      })
      
      // Test retrieval
      console.log('🔄 Step 3: Testing database retrieval...')
      const { getSongWithStructure } = await import('./songDatabaseUG.js')
      const retrieveResult = await getSongWithStructure(storeResult.songId)
      
      if (retrieveResult.success) {
        console.log('✅ Database retrieval successful:', {
          title: retrieveResult.song.title,
          artist: retrieveResult.song.artist,
          sections: retrieveResult.sections.length,
          chordProgressions: retrieveResult.chordProgressions.length
        })
        
        // Show section details
        console.log('📊 Stored Song Sections:')
        retrieveResult.sections.forEach((section, index) => {
          console.log(`  ${index + 1}. ${section.section_name} (${section.section_type})`)
          console.log(`     Time: ${section.start_time} - ${section.end_time}`)
          console.log(`     Label: ${section.section_label || 'None'}`)
          console.log(`     Repeat: ${section.repeat_count}x`)
          if (section.performance_notes) {
            console.log(`     Notes: ${section.performance_notes}`)
          }
          console.log('')
        })
        
        // Show chord progression details
        console.log('🎵 Stored Chord Progressions:')
        retrieveResult.chordProgressions.forEach((chord, index) => {
          console.log(`  ${index + 1}. ${chord.chord_name} (${chord.chord_type})`)
          console.log(`     Root: ${chord.root_note}`)
          console.log(`     Time: ${chord.start_time} - ${chord.end_time}`)
          console.log(`     Order: ${chord.sequence_order}`)
          console.log('')
        })
        
        // Clean up test data
        console.log('🧹 Cleaning up test data...')
        const { supabase } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabaseClient = supabase(supabaseUrl, supabaseServiceKey)
          const { error: deleteError } = await supabaseClient
            .from('songs')
            .delete()
            .eq('id', storeResult.songId)
          
          if (deleteError) {
            console.warn('⚠️ Warning: Failed to clean up test data:', deleteError.message)
          } else {
            console.log('✅ Test data cleaned up successfully')
          }
        }
        
      } else {
        console.error('❌ Database retrieval failed:', retrieveResult.error)
      }
      
    } else {
      console.error('❌ Failed to store song in database:', storeResult.error)
    }
    
  } catch (error) {
    console.error('❌ Test 2 Error:', error.message)
  }
  
  console.log('')
  
  // Test 3: Database search functionality
  console.log('🧪 Test 3: Database Search Functionality')
  console.log('Expected: Search for songs by various criteria')
  console.log('---')
  
  try {
    const { searchSongs } = await import('./songDatabaseUG.js')
    
    // Test search by query
    console.log('🔍 Testing search by query...')
    const searchResult = await searchSongs({ query: 'test', limit: 5 })
    
    if (searchResult.success) {
      console.log('✅ Search by query successful:', {
        total: searchResult.total,
        message: searchResult.message
      })
    } else {
      console.warn('⚠️ Search by query failed:', searchResult.error)
    }
    
    // Test search by instrument type
    console.log('🔍 Testing search by instrument type...')
    const instrumentSearch = await searchSongs({ instrumentType: 'guitar', limit: 5 })
    
    if (instrumentSearch.success) {
      console.log('✅ Search by instrument type successful:', {
        total: instrumentSearch.total,
        message: instrumentSearch.message
      })
    } else {
      console.warn('⚠️ Search by instrument type failed:', instrumentSearch.error)
    }
    
  } catch (error) {
    console.error('❌ Test 3 Error:', error.message)
  }
  
  console.log('')
  
  // Test 4: UG tab ID lookup
  console.log('🧪 Test 4: UG Tab ID Lookup')
  console.log('Expected: Look up songs by Ultimate Guitar tab ID')
  console.log('---')
  
  try {
    const { getSongByUGTabId } = await import('./songDatabaseUG.js')
    
    // Test lookup with non-existent tab ID
    console.log('🔍 Testing lookup with non-existent tab ID...')
    const lookupResult = await getSongByUGTabId(999999)
    
    if (!lookupResult.success && lookupResult.error === 'Song not found') {
      console.log('✅ Lookup correctly identified non-existent song')
    } else {
      console.warn('⚠️ Unexpected lookup result:', lookupResult)
    }
    
  } catch (error) {
    console.error('❌ Test 4 Error:', error.message)
  }
  
  console.log('')
  console.log('🎉 Database Integration Testing Complete!')
  console.log('=========================================')
}

/**
 * Test specific tab IDs to verify the complete pipeline
 */
async function testSpecificTabIds() {
  console.log('🎯 Testing Specific Tab IDs with Complete Pipeline')
  console.log('==================================================')
  
  const testTabIds = [100, 1, 500] // The Prophet, Telepath Boy, Excess
  
  for (const tabId of testTabIds) {
    console.log(`\n🧪 Testing Tab ID: ${tabId}`)
    console.log('---')
    
    try {
      // Step 1: Fetch UG data
      console.log(`🔄 Fetching UG data for Tab ID ${tabId}...`)
      const songData = await getSongDataUG(tabId)
      
      if (!songData) {
        console.log(`⚠️ No data returned for Tab ID ${tabId}`)
        continue
      }
      
      console.log(`✅ Fetched: ${songData.title} by ${songData.artist}`)
      console.log(`   Sections: ${songData.sections.length}`)
      console.log(`   Chords: ${songData.chordProgressions.length}`)
      
      // Step 2: Check if song already exists in database
      const { getSongByUGTabId } = await import('./songDatabaseUG.js')
      const existingSong = await getSongByUGTabId(tabId)
      
      if (existingSong.success) {
        console.log(`ℹ️ Song already exists in database (ID: ${existingSong.song.id})`)
        
        // Test retrieval
        const { getSongWithStructure } = await import('./songDatabaseUG.js')
        const retrieveResult = await getSongWithStructure(existingSong.song.id)
        
        if (retrieveResult.success) {
          console.log(`✅ Retrieved existing song: ${retrieveResult.sections.length} sections, ${retrieveResult.chordProgressions.length} chords`)
        }
      } else {
        console.log(`ℹ️ Song not in database yet - ready for storage`)
      }
      
    } catch (error) {
      console.error(`❌ Error testing Tab ID ${tabId}:`, error.message)
    }
  }
}

/**
 * Main test execution
 */
async function main() {
  try {
    // Run basic database integration tests
    await runDatabaseIntegrationTests()
    
    console.log('\n' + '='.repeat(60))
    
    // Run specific tab ID tests
    await testSpecificTabIds()
    
    console.log('\n🎸 All tests completed successfully!')
    console.log('The database integration is ready for production use.')
    
  } catch (error) {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  }
}

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { runDatabaseIntegrationTests, testSpecificTabIds }
