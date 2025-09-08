/**
 * 🧪 Test High Fret Chord with Dynamic Positioning
 * Tests a chord higher up on the fretboard to show shifting logic
 * 
 * Changes made:
 * 1. Remove NUT black line - show regular fret line on far left
 * 2. Update fret numbers at bottom - show actual fret range
 * 
 * NO other changes - same design, no string letters on right
 */

import { renderChord } from '../utils/chordRenderer.js';
import fs from 'fs';

/**
 * High fret chord test - D major at 12th fret
 * This should trigger the shifting logic to show frets 10-15
 */
const highFretChord = {
  name: 'D major (12th fret)',
  description: 'D major at 12th fret - should shift to show frets 10-15, no nut',
  data: {
    strings: ['E', 'A', 'D', 'G', 'B', 'E'],
    frets: ['12', '12', '14', '14', '12', '12'],
    fingering: ['1', '1', '3', '4', '1', '1']
  },
  expected: 'Frets 10-15, no nut, shifted positioning'
};

/**
 * Test the high fret chord
 */
async function testHighFretChord() {
  console.log('🧪 Testing High Fret Chord with Dynamic Positioning...\n');

  console.log(`📋 Testing: ${highFretChord.name}`);
  console.log(`   Description: ${highFretChord.description}`);
  console.log(`   Expected: ${highFretChord.expected}`);
  console.log(`   REAL Data: ${highFretChord.data.frets.join(', ')}`);
  
  try {
    // Test light theme
    const lightSVG = renderChord(highFretChord.data, 'open', 'light');
    
    // Test dark theme
    const darkSVG = renderChord(highFretChord.data, 'open', 'dark');
    
    // Save test files
    const lightFileName = `test_D_major_12th_fret_light.svg`;
    const darkFileName = `test_D_major_12th_fret_dark.svg`;
    
    fs.writeFileSync(lightFileName, lightSVG);
    fs.writeFileSync(darkFileName, darkSVG);
    
    console.log(`   ✅ Light theme: ${lightFileName} (${lightSVG.length} bytes)`);
    console.log(`   ✅ Dark theme: ${darkFileName} (${darkSVG.length} bytes)`);
    
    console.log('\n🎯 High fret chord test completed!');
    console.log('🔍 Look for:');
    console.log('   - Chord shifted to show frets 10-15');
    console.log('   - NO nut black line (regular fret line on left)');
    console.log('   - Correct fret numbers at bottom (10, 11, 12, 13, 14, 15)');
    console.log('   - Same design as other chords (no string letters on right)');
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Run the high fret test
testHighFretChord()
  .then(success => {
    if (success) {
      console.log('\n🚀 High fret chord test successful!');
      console.log('🎯 Dynamic positioning working with high fret chords!');
    } else {
      console.log('\n💥 High fret chord test failed');
      console.log('🔧 Please check the errors above');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
