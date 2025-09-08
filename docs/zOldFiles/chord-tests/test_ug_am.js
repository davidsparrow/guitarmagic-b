/**
 * 🧪 Test Script for Ultimate Guitar Am Chord
 * Testing the new Ultimate Guitar chord data system
 * SAFE TEST - doesn't touch existing working system
 */

// Import the new Ultimate Guitar chord data generator
import { generateChordDataUG, testChordGenerationUG } from '../utils/generateChordDataUG.js'
import { renderChord } from '../utils/chordRenderer.js'
import fs from 'fs'

// Main test function
async function testUGAmChord() {
  console.log('🎸 Testing Ultimate Guitar Am Chord Generation...\n')

  // Test 1: Generate Am chord data from Ultimate Guitar
  console.log('📝 Test 1: Ultimate Guitar Am chord data generation')
  const amChordData = generateChordDataUG('Am')
  
  if (amChordData) {
    console.log('✅ Ultimate Guitar Am Chord Data:', JSON.stringify(amChordData, null, 2))
  } else {
    console.log('❌ Failed to get Ultimate Guitar Am data')
    return
  }

  // Test 2: Render Am chord in light theme using existing renderer
  console.log('\n📝 Test 2: Am chord light theme rendering (using existing renderer)')
  const amLightSVG = renderChord(amChordData, 'open', 'light')
  console.log('Generated Light SVG length:', amLightSVG.length)

  // Test 3: Render Am chord in dark theme using existing renderer
  console.log('\n📝 Test 3: Am chord dark theme rendering (using existing renderer)')
  const amDarkSVG = renderChord(amChordData, 'open', 'dark')
  console.log('Generated Dark SVG length:', amDarkSVG.length)

  // Save both themes to files
  console.log('\n💾 Saving Ultimate Guitar Am chord theme versions...')

  // Save light theme
  fs.writeFileSync('UG_Am_light.svg', amLightSVG)
  console.log('✅ Saved Light theme to: UG_Am_light.svg')

  // Save dark theme
  fs.writeFileSync('UG_Am_dark.svg', amDarkSVG)
  console.log('✅ Saved Dark theme to: UG_Am_dark.svg')

  console.log('\n🎯 Ultimate Guitar Am chord test complete!')
  console.log('✅ Using Ultimate Guitar data')
  console.log('✅ Same SVG renderer (no changes)')
  console.log('✅ Same output format')
  console.log('\nCheck both .svg files in your browser!')
  console.log('Expected Am chord: X 0 2 2 1 0 (strings from Low E to High E)')
  console.log('Expected fingering: X X 2 3 1 X')
}

// Run the test
testUGAmChord().catch(console.error)
