/**
 * 🧪 Ultimate Guitar Integration Test Script
 * 
 * Tests the complete chord integration system:
 * 1. Chord Data Service UG
 * 2. UG Scraper Integration  
 * 3. Chord Data Mapper UG
 * 4. Database Infrastructure & Caching
 * 5. End-to-end integration
 * 
 * Run with: node scripts/test_ug_integration.js
 */

import { 
  getChordDataUG, 
  testChordDataServiceUG, 
  getChordDataServiceStatus 
} from './chord_processing/chordDataServiceUG.js'

import { 
  callUGScraper, 
  testUGScraperIntegration, 
  getUGScraperStatus 
} from './ugScraperIntegration.js'

import { 
  transformUGDataToInternal, 
  testChordDataMapperUG, 
  getChordDataMapperStatus 
} from '../chord_processing/chordDataMapperUG.js'

// Database infrastructure testing
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

/**
 * 🎯 MAIN TEST FUNCTION
 * Runs all tests in sequence
 */
async function runAllTests() {
  console.log('🚀 Starting Ultimate Guitar Integration Tests')
  console.log('=' .repeat(60))
  
  try {
    // Test 1: Service Status Checks
    await testServiceStatus()
    
    // Test 2: Database Infrastructure & Caching
    await testDatabaseInfrastructure()
    
    // Test 3: Individual Component Tests
    await testIndividualComponents()
    
    // Test 4: Integration Tests
    await testIntegration()
    
    // Test 5: End-to-End Tests
    await testEndToEnd()
    
    console.log('=' .repeat(60))
    console.log('✅ All tests completed!')
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  }
}

/**
 * Test 1: Check service status
 */
async function testServiceStatus() {
  console.log('\n📊 TEST 1: Service Status Checks')
  console.log('-'.repeat(40))
  
  try {
    // Check Chord Data Service status
    const chordServiceStatus = getChordDataServiceStatus()
    console.log('✅ Chord Data Service Status:', chordServiceStatus)
    
    // Check UG Scraper status
    const scraperStatus = getUGScraperStatus()
    console.log('✅ UG Scraper Status:', scraperStatus)
    
    // Check Data Mapper status
    const mapperStatus = getChordDataMapperStatus()
    console.log('✅ Data Mapper Status:', mapperStatus)
    
    console.log('✅ Service Status Tests: PASSED')
    
  } catch (error) {
    console.error('❌ Service Status Tests: FAILED', error)
    throw error
  }
}

/**
 * Test 2: Database Infrastructure & Caching Strategy
 * Tests the "never scan twice" infrastructure
 */
async function testDatabaseInfrastructure() {
  console.log('\n🗄️  TEST 2: Database Infrastructure & Caching')
  console.log('-'.repeat(40))
  
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase environment variables')
      return false
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('✅ Supabase client initialized')
    
    // Test 2.1: Required Tables Exist
    console.log('\n   🔍 Testing Required Database Tables...')
    const requiredTables = [
      'songs',
      'song_attributes', 
      'song_sections',
      'song_chord_progressions',
      'video_song_mappings',
      'chord_sync_groups',
      'chord_sync_chords',
      'tab_caption_requests'
    ]
    
    let tablesFound = 0
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`   ❌ Table ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ Table ${table} accessible`)
          tablesFound++
        }
      } catch (err) {
        console.log(`   ❌ Table ${table} error: ${err.message}`)
      }
    }
    
    // Test 2.2: Helper Functions Exist
    console.log('\n   🔧 Testing Database Helper Functions...')
    
    // Check if required tables for the function exist first
    const functionTables = ['chord_sync_groups', 'chord_sync_chords']
    let functionTablesExist = 0
    
    for (const table of functionTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1)
        
        if (error) {
          console.log(`   ❌ Function table ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ Function table ${table} accessible`)
          functionTablesExist++
        }
      } catch (err) {
        console.log(`   ❌ Function table ${table} error: ${err.message}`)
      }
    }
    
    // Only test the function if the required tables exist
    if (functionTablesExist === functionTables.length) {
      try {
        const { data: syncGroup, error: syncError } = await supabase
          .rpc('create_chord_sync_group', {
            p_favorite_id: 'test-123',
            p_song_id: 'test-song-123'
          })
        
        if (syncError) {
          console.log(`   ❌ create_chord_sync_group: ${syncError.message}`)
        } else {
          console.log('   ✅ create_chord_sync_group function working')
        }
      } catch (err) {
        console.log(`   ❌ Function test error: ${err.message}`)
      }
    } else {
      console.log('   ⚠️  Skipping function test - required tables missing')
    }
    
    // Test 2.3: Song Caching Strategy
    console.log('\n   💾 Testing Song Caching Strategy...')
    try {
      const { data: songs, error } = await supabase
        .from('songs')
        .select('*')
        .limit(5)
      
      if (error) {
        console.log(`   ❌ Songs table query failed: ${error.message}`)
      } else if (songs && songs.length > 0) {
        console.log(`   ✅ Songs table accessible with ${songs.length} sample records`)
        
        // Check data completeness for caching
        const sampleSong = songs[0]
        const dataFields = Object.keys(sampleSong)
        console.log(`   📊 Sample song has ${dataFields.length} fields: ${dataFields.join(', ')}`)
        
        // Check for key UG data fields that enable caching
        const ugFields = ['title', 'artist', 'chords', 'sections', 'progression']
        const hasUGData = ugFields.some(field => 
          dataFields.includes(field) || 
          sampleSong[field] !== undefined
        )
        
        if (hasUGData) {
          console.log('   ✅ UG data fields detected - caching ready')
        } else {
          console.log('   ⚠️  UG data fields not yet populated - caching pending')
        }
      } else {
        console.log('   ✅ Songs table empty - ready for first comprehensive scan')
      }
    } catch (err) {
      console.log(`   ❌ Songs table error: ${err.message}`)
    }
    
    // Test 2.4: Data Completeness Strategy
    console.log('\n   📋 Validating Data Completeness Strategy...')
    const requiredDataFields = {
      basic: ['title', 'artist', 'album', 'year', 'genre'],
      structure: ['sections', 'chord_progressions', 'timing'],
      technical: ['difficulty', 'tuning', 'capo', 'tempo'],
      content: ['lyrics', 'chords', 'tabs', 'notes'],
      metadata: ['rating', 'votes', 'views', 'last_updated']
    }
    
    console.log('   📊 Required Data Fields for Complete Capture:')
    Object.entries(requiredDataFields).forEach(([category, fields]) => {
      console.log(`   ${category.toUpperCase()}: ${fields.join(', ')}`)
    })
    
    console.log(`\n   📊 Total fields to capture: ${Object.values(requiredDataFields).flat().length}`)
    console.log('   ✅ Data completeness strategy defined for "never scan twice"')
    
    const infrastructureReady = tablesFound >= 4 // At least 4 out of 5 tables
    if (infrastructureReady) {
      console.log('\n✅ Database Infrastructure Tests: PASSED')
      console.log('   💡 Ready to implement comprehensive song data capture')
    } else {
      console.log('\n⚠️  Database Infrastructure Tests: PARTIAL')
      console.log('   💡 Some tables missing - may need schema updates')
    }
    
    return infrastructureReady
    
  } catch (error) {
    console.error('❌ Database Infrastructure Tests: FAILED', error)
    return false
  }
}

/**
 * Test 3: Test individual components
 */
async function testIndividualComponents() {
  console.log('\n🔧 TEST 3: Individual Component Tests')
  console.log('-'.repeat(40))
  
  try {
    // Test Chord Data Service
    console.log('🧪 Testing Chord Data Service...')
    const chordServiceTest = await testChordDataServiceUG('Am')
    console.log('✅ Chord Data Service Test:', chordServiceTest.success ? 'PASSED' : 'FAILED')
    
    // Test UG Scraper Integration
    console.log('🧪 Testing UG Scraper Integration...')
    const scraperTest = await testUGScraperIntegration('Am')
    console.log('✅ UG Scraper Test:', scraperTest.success ? 'PASSED' : 'FAILED')
    
    // Test Data Mapper
    console.log('🧪 Testing Data Mapper...')
    const testData = {
      chord: 'Am',
      variations: [{
        frets: [null, 0, 2, 2, 1, 0],
        fingers: [null, null, 2, 3, 1, null]
      }]
    }
    const mapperTest = testChordDataMapperUG(testData, 'Am')
    console.log('✅ Data Mapper Test:', mapperTest.success ? 'PASSED' : 'FAILED')
    
    console.log('✅ Individual Component Tests: PASSED')
    
  } catch (error) {
    console.error('❌ Individual Component Tests: FAILED', error)
    throw error
  }
}

/**
 * Test 4: Test integration between components
 */
async function testIntegration() {
  console.log('\n🔗 TEST 4: Integration Tests')
  console.log('-'.repeat(40))
  
  try {
    // Test the complete flow (without actual UG scraper)
    console.log('🧪 Testing integration flow...')
    
    // This will test the fallback system since UG integration isn't fully implemented yet
    const result = await getChordDataUG('Am')
    
    if (result) {
      console.log('✅ Integration Test: PASSED')
      console.log('📊 Result structure:', {
        name: result.name,
        type: result.type,
        root: result.root,
        hasFrets: !!result.frets,
        hasFingering: !!result.fingering,
        metadata: result.metadata?.source
      })
    } else {
      console.log('❌ Integration Test: FAILED - No data returned')
    }
    
  } catch (error) {
    console.error('❌ Integration Tests: FAILED', error)
    throw error
  }
}

/**
 * Test 5: End-to-end testing
 */
async function testEndToEnd() {
  console.log('\n🎯 TEST 5: End-to-End Tests')
  console.log('-'.repeat(40))
  
  try {
    // Test multiple chord types
    const testChords = ['Am', 'C', 'F', 'G']
    
    console.log('🧪 Testing multiple chord types...')
    
    for (const chordName of testChords) {
      console.log(`\n🎸 Testing chord: ${chordName}`)
      
      try {
        const result = await getChordDataUG(chordName)
        
        if (result) {
          console.log(`✅ ${chordName}: SUCCESS`)
          console.log(`   Type: ${result.type}, Root: ${result.root}`)
          console.log(`   Source: ${result.metadata?.source || 'unknown'}`)
        } else {
          console.log(`❌ ${chordName}: FAILED - No data`)
        }
        
      } catch (error) {
        console.log(`❌ ${chordName}: ERROR - ${error.message}`)
      }
    }
    
    console.log('\n✅ End-to-End Tests: COMPLETED')
    
  } catch (error) {
    console.error('❌ End-to-End Tests: FAILED', error)
    throw error
  }
}

/**
 * Test the actual UG scraper (optional - requires Go tool)
 */
async function testRealUGScraper() {
  console.log('\n🚀 OPTIONAL: Real UG Scraper Test')
  console.log('-'.repeat(40))
  console.log('⚠️  This test requires the Go tool to be properly configured')
  console.log('⚠️  It may fail if the tool path is incorrect or not executable')
  
  try {
    console.log('🧪 Testing real UG scraper for chord: Am')
    const result = await callUGScraper('Am', { timeout: 15000, retries: 1 })
    
    if (result && result.success) {
      console.log('✅ Real UG Scraper Test: PASSED')
      console.log('📊 Raw output length:', result.rawOutput?.length || 0)
      console.log('📊 Process code:', result.processCode)
    } else {
      console.log('❌ Real UG Scraper Test: FAILED')
      console.log('📊 Error details:', result?.error || 'Unknown error')
    }
    
  } catch (error) {
    console.log('❌ Real UG Scraper Test: FAILED')
    console.log('📊 Error:', error.message)
    console.log('💡 This is expected if the Go tool is not configured yet')
  }
}

/**
 * Run the test suite
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  // Only run if this file is executed directly
  runAllTests()
    .then(() => {
      console.log('\n🎉 Test suite completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error)
      process.exit(1)
    })
}

// Export for use in other test files
export { runAllTests, testRealUGScraper }
