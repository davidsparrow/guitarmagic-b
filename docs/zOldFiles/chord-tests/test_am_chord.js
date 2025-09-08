/**
 * 🧪 Test Script for Am Chord
 * Testing Am chord generation to verify fingering positions
 */

// Import the chord renderer and chord data
import { renderChord, testChordRenderer } from '../utils/chordRenderer.js'
import { generateChordData } from '../utils/chordData.js'
import fs from 'fs'

// Main test function
async function testAmChord() {
  console.log('🎸 Testing Am Chord Generation...\n')

  // Test 1: Generate Am chord data
  console.log('📝 Test 1: Am chord data generation')
  const amChordData = generateChordData('Am')
  console.log('Am Chord Data:', JSON.stringify(amChordData, null, 2))

  // Test 2: Render Am chord in light theme
  console.log('\n📝 Test 2: Am chord light theme rendering')
  const amLightSVG = await testChordRenderer('Am', 'light')
  console.log('Generated Light SVG length:', amLightSVG.length)

  // Test 3: Render Am chord in dark theme  
  console.log('\n📝 Test 3: Am chord dark theme rendering')
  const amDarkSVG = await testChordRenderer('Am', 'dark')
  console.log('Generated Dark SVG length:', amDarkSVG.length)

  // Save both themes to files
  console.log('\n💾 Saving Am chord theme versions...')

  // Save light theme
  fs.writeFileSync('Am_new_light.svg', amLightSVG)
  console.log('✅ Saved Light theme to: Am_new_light.svg')

  // Save dark theme
  fs.writeFileSync('Am_new_dark.svg', amDarkSVG)
  console.log('✅ Saved Dark theme to: Am_new_dark.svg')

  console.log('\n🎯 Am chord test complete! Check both .svg files in your browser!')
  console.log('Expected Am chord: X 0 2 2 1 0 (strings from high E to low E)')
  console.log('Expected fingering: X X 2 2 1 X (fingers 1, 2, 2)')
}

// Run the test
testAmChord().catch(console.error)
