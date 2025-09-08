/**
 * 🧪 Test Script for Ultimate Guitar F Major Barre Chord
 * Testing the new Ultimate Guitar chord data system with complex barre chords
 * SAFE TEST - doesn't touch existing working system
 */

// Import the new Ultimate Guitar chord data generator
import { generateChordDataUG, testChordGenerationUG } from '../utils/generateChordDataUG.js'
import { renderChord } from '../utils/chordRenderer.js'
import fs from 'fs'

// Main test function
async function testUGFBarreChord() {
  console.log('🎸 Testing Ultimate Guitar F Major Barre Chord...\n')

  // Test 1: Generate F Major chord data from Ultimate Guitar
  console.log('📝 Test 1: Ultimate Guitar F Major chord data generation')
  const fChordData = generateChordDataUG('F')
  
  if (fChordData) {
    console.log('✅ Ultimate Guitar F Major Chord Data:', JSON.stringify(fChordData, null, 2))
  } else {
    console.log('❌ Failed to get Ultimate Guitar F Major data')
    return
  }

  // Test 2: Render F Major chord in light theme using existing renderer
  console.log('\n📝 Test 2: F Major chord light theme rendering (using existing renderer)')
  const fLightSVG = renderChord(fChordData, 'open', 'light')
  console.log('Generated Light SVG length:', fLightSVG.length)

  // Test 3: Render F Major chord in dark theme using existing renderer
  console.log('\n📝 Test 3: F Major chord dark theme rendering (using existing renderer)')
  const fDarkSVG = renderChord(fChordData, 'open', 'dark')
  console.log('Generated Dark SVG length:', fDarkSVG.length)

  // Save both themes to files
  console.log('\n💾 Saving Ultimate Guitar F Major chord theme versions...')

  // Save light theme
  fs.writeFileSync('UG_F_light.svg', fLightSVG)
  console.log('✅ Saved Light theme to: UG_F_light.svg')

  // Save dark theme
  fs.writeFileSync('UG_F_dark.svg', fDarkSVG)
  console.log('✅ Saved Dark theme to: UG_F_dark.svg')

  console.log('\n🎯 Ultimate Guitar F Major barre chord test complete!')
  console.log('✅ Using Ultimate Guitar data')
  console.log('✅ Same SVG renderer (no changes)')
  console.log('✅ Same output format')
  console.log('\nCheck both .svg files in your browser!')
  console.log('Expected F Major chord: 1 1 2 3 3 1 (strings from Low E to High E)')
  console.log('Expected fingering: 1 1 2 4 3 1 (barre chord)')
  console.log('This should show a proper barre chord with finger 1 across all 6 strings at 1st fret')
}

// Run the test
testUGFBarreChord().catch(console.error)
