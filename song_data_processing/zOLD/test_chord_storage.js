/**
 * 🧪 Test Script for Chord Progression Storage
 * 
 * Simple test to verify chord progressions can be stored in the database
 */

import { createCompleteSong } from './songDatabaseUG.js'

/**
 * Test chord progression storage with a simple song
 */
async function testChordStorage() {
  console.log('🧪 Testing Chord Progression Storage')
  console.log('====================================')
  
  // Create a simple test song with chord progressions
  const testSongData = {
    title: 'Test Chord Song',
    artist: 'Test Artist',
    ugTabId: 999998, // Use a unique test ID
    instrumentType: 'guitar',
    tuning: 'E A D G B E',
    tabbedBy: 'Test System',
    album: 'Test Album',
    sections: [
      {
        sectionName: 'Verse 1',
        sectionType: 'verse',
        sectionLabel: 'Main Verse',
        startTime: '0:00',
        endTime: '0:30',
        repeatCount: 1,
        performanceNotes: 'Play with feeling',
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
        endTime: '0:10',
        sequenceOrder: 0,
        chordData: {
          fingering: ['X', '0', '2', '2', '1', '0'],
          notes: ['A', 'E', 'A', 'C', 'E']
        }
      },
      {
        chordName: 'C',
        chordType: 'major',
        rootNote: 'C',
        startTime: '0:10',
        endTime: '0:20',
        sequenceOrder: 1,
        chordData: {
          fingering: ['X', '3', '2', '0', '1', '0'],
          notes: ['C', 'E', 'G', 'C', 'E']
        }
      },
      {
        chordName: 'F',
        chordType: 'major',
        rootNote: 'F',
        startTime: '0:20',
        endTime: '0:30',
        sequenceOrder: 2,
        chordData: {
          fingering: ['1', '1', '2', '3', '3', '1'],
          notes: ['F', 'C', 'F', 'A', 'C', 'F']
        }
      }
    ]
  }

  console.log('📝 Test song data:', {
    title: testSongData.title,
    artist: testSongData.artist,
    sections: testSongData.sections.length,
    chordProgressions: testSongData.chordProgressions.length
  })

  try {
    // Test chord progression storage
    console.log('\n🔄 Testing chord progression storage...')
    const result = await createCompleteSong(testSongData)
    
    if (result.success) {
      console.log('✅ Chord progression storage successful!')
      console.log(`   Song ID: ${result.songId}`)
      console.log(`   Sections: ${result.sections.success}`)
      console.log(`   Chord Progressions: ${result.chordProgressions.success}`)
      console.log(`   Message: ${result.message}`)
      
      // Clean up test data
      console.log('\n🧹 Cleaning up test data...')
      const { supabase } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabaseClient = supabase(supabaseUrl, supabaseServiceKey)
        const { error: deleteError } = await supabaseClient
          .from('songs')
          .delete()
          .eq('id', result.songId)
        
        if (deleteError) {
          console.warn('⚠️ Warning: Failed to clean up test data:', deleteError.message)
        } else {
          console.log('✅ Test data cleaned up successfully')
        }
      }
      
      return { success: true, message: 'Chord progression storage test passed!' }
      
    } else {
      console.error('❌ Chord progression storage failed:', result.error)
      return { success: false, error: result.error }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message)
    return { success: false, error: error.message }
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testChordStorage().catch(console.error)
}

export { testChordStorage }
