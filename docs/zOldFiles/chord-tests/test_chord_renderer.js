/**
 * 🧪 Test Script for Chord Renderer
 * Generates a C chord SVG and shows the output
 */

// Import the chord renderer
const { renderChord, testChordRenderer } = require('./utils/chordRenderer.js')

console.log('🎸 Testing Chord Renderer...\n')

// Test 1: Use the built-in test function
console.log('📝 Test 1: Built-in C chord test')
const testSVG = testChordRenderer('C')
console.log('Generated SVG length:', testSVG.length)
console.log('First 200 characters:')
console.log(testSVG.substring(0, 200))
console.log('...\n')

// Test 2: Manual chord data
console.log('📝 Test 2: Manual chord data test')
const manualChordData = {
  name: 'Am',
  strings: ['E', 'A', 'D', 'G', 'B', 'E'],
  frets: ['0', '0', '2', '2', '1', '0'],
  fingering: ['X', 'X', '2', '2', '1', 'X']
}

const manualSVG = renderChord(manualChordData)
console.log('Generated SVG length:', manualSVG.length)
console.log('First 200 characters:')
console.log(manualSVG.substring(0, 200))
console.log('...\n')

// Test 3: Save SVG to file for visual inspection
console.log('💾 Test 3: Saving SVG to file for visual inspection')
const fs = require('fs')

// Save C chord
fs.writeFileSync('test_C_chord.svg', testSVG)
console.log('✅ Saved C chord to: test_C_chord.svg')

// Save Am chord  
fs.writeFileSync('test_Am_chord.svg', manualSVG)
console.log('✅ Saved Am chord to: test_Am_chord.svg')

console.log('\n🎯 Test complete! Check the generated .svg files in your browser!')
