/**
 * 🧪 Test Script for Both Light and Dark Themes
 * Generates C chord SVGs in both themes for comparison
 */

// Import the chord renderer
const { renderChord, testChordRenderer } = require('./utils/chordRenderer.js')

console.log('🎸 Testing Both Light and Dark Themes...\n')

// Test 1: Light theme (default)
console.log('📝 Test 1: Light theme C chord')
const lightSVG = testChordRenderer('C', 'light')
console.log('Generated Light SVG length:', lightSVG.length)

// Test 2: Dark theme
console.log('📝 Test 2: Dark theme C chord')
const darkSVG = testChordRenderer('C', 'dark')
console.log('Generated Dark SVG length:', darkSVG.length)

// Save both themes to files
console.log('\n💾 Saving both theme versions...')
const fs = require('fs')

// Save light theme
fs.writeFileSync('test_C_chord_light.svg', lightSVG)
console.log('✅ Saved Light theme to: test_C_chord_light.svg')

// Save dark theme
fs.writeFileSync('test_C_chord_dark.svg', darkSVG)
console.log('✅ Saved Dark theme to: test_C_chord_dark.svg')

console.log('\n🎯 Test complete! Check both .svg files in your browser!')
console.log('Light theme: White background, black elements')
console.log('Dark theme: Black background, white elements')
