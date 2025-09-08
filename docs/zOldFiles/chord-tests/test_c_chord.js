/**
 * 🧪 Test Script for C Major Chord
 * Testing C Major chord generation to verify the system works for different chord types
 */

// Import the chord renderer and chord data
import { renderChord, testChordRenderer } from '../utils/chordRenderer.js'
import { generateChordData } from '../utils/chordData.js'
import fs from 'fs'

// Main test function
async function testCMajorChord() {
  console.log('🎸 Testing C Major Chord Generation...\n')

  // Test 1: Generate C Major chord data
  console.log('📝 Test 1: C Major chord data generation')
  const cChordData = generateChordData('C')
  console.log('C Major Chord Data:', JSON.stringify(cChordData, null, 2))

  // Test 2: Render C Major chord in light theme
  console.log('\n📝 Test 2: C Major chord light theme rendering')
  const cLightSVG = await testChordRenderer('C', 'light')
  console.log('Generated Light SVG length:', cLightSVG.length)

  // Test 3: Render C Major chord in dark theme  
  console.log('\n📝 Test 3: C Major chord dark theme rendering')
  const cDarkSVG = await testChordRenderer('C', 'dark')
  console.log('Generated Dark SVG length:', cDarkSVG.length)

  // Save both themes to files
  console.log('\n💾 Saving C Major chord theme versions...')

  // Save light theme
  fs.writeFileSync('C_new_light.svg', cLightSVG)
  console.log('✅ Saved Light theme to: C_new_light.svg')

  // Save dark theme
  fs.writeFileSync('C_new_dark.svg', cDarkSVG)
  console.log('✅ Saved Dark theme to: C_new_dark.svg')

  console.log('\n🎯 C Major chord test complete! Check both .svg files in your browser!')
  console.log('Expected C Major chord: X 3 2 0 1 0 (strings from Low E to High E)')
  console.log('Expected fingering: X 3 2 X 1 X')
}

// Run the test
testCMajorChord().catch(console.error)
