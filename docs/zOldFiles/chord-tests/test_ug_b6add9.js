/**
 * 🧪 Test Script for Ultimate Guitar B6add9 Complex Chord
 * Testing the new Ultimate Guitar chord data system with complex chord types
 * SAFE TEST - doesn't touch existing working system
 */

// Import the new Ultimate Guitar chord data generator
import { generateChordDataUG, testChordGenerationUG } from '../utils/generateChordDataUG.js'
import { renderChord } from '../utils/chordRenderer.js'
import fs from 'fs'

// Main test function
async function testUGB6add9Chord() {
  console.log('🎸 Testing Ultimate Guitar B6add9 Complex Chord...\n')

  // Test 1: Generate B6add9 chord data from Ultimate Guitar
  console.log('📝 Test 1: Ultimate Guitar B6add9 chord data generation')
  const b6add9ChordData = generateChordDataUG('B6add9')
  
  if (b6add9ChordData) {
    console.log('✅ Ultimate Guitar B6add9 Chord Data:', JSON.stringify(b6add9ChordData, null, 2))
  } else {
    console.log('❌ Failed to get Ultimate Guitar B6add9 data')
    return
  }

  // Test 2: Render B6add9 chord in light theme using existing renderer
  console.log('\n📝 Test 2: B6add9 chord light theme rendering (using existing renderer)')
  const b6add9LightSVG = renderChord(b6add9ChordData, 'open', 'light')
  console.log('Generated Light SVG length:', b6add9LightSVG.length)

  // Test 3: Render B6add9 chord in dark theme using existing renderer
  console.log('\n📝 Test 3: B6add9 chord dark theme rendering (using existing renderer)')
  const b6add9DarkSVG = renderChord(b6add9ChordData, 'open', 'dark')
  console.log('Generated Dark SVG length:', b6add9DarkSVG.length)

  // Save both themes to files
  console.log('\n💾 Saving Ultimate Guitar B6add9 chord theme versions...')

  // Save light theme
  fs.writeFileSync('UG_B6add9_light.svg', b6add9LightSVG)
  console.log('✅ Saved Light theme to: UG_B6add9_light.svg')

  // Save dark theme
  fs.writeFileSync('UG_B6add9_dark.svg', b6add9DarkSVG)
  console.log('✅ Saved Dark theme to: UG_B6add9_dark.svg')

  console.log('\n🎯 Ultimate Guitar B6add9 complex chord test complete!')
  console.log('✅ Using Ultimate Guitar data')
  console.log('✅ Same SVG renderer (no changes)')
  console.log('✅ Same output format')
  console.log('\nCheck both .svg files in your browser!')
  console.log('Expected B6add9 chord: 2 2 1 1 0 2 (strings from Low E to High E)')
  console.log('Expected fingering: 3 3 2 1 X 4 (complex chord with multiple fingers)')
  console.log('This should show a complex chord with fingers 1, 2, 3, and 4 in various positions')
}

// Run the test
testUGB6add9Chord().catch(console.error)
