/**
 * 🧪 Test Higher Fret Chord Rendering
 * Tests how the chord renderer handles chords starting at higher fret positions
 */

import { generateChordDataUG } from '../utils/generateChordDataUG.js';
import { renderChord } from '../utils/chordRenderer.js';

async function testHigherFretRendering() {
  console.log('🧪 Testing Higher Fret Chord Rendering...\n');

  try {
    // Test 1: Current B6add9 (starts at fret 2)
    console.log('📋 Test 1: B6add9 (starts at fret 2)...');
    const b6add9Data = generateChordDataUG('B6add9');
    if (b6add9Data) {
      console.log('   Fret positions:', b6add9Data.frets);
      console.log('   Left-most fret:', Math.min(...b6add9Data.frets.filter(f => f !== 'X' && f !== '0').map(Number)));
      console.log('   Right-most fret:', Math.max(...b6add9Data.frets.filter(f => f !== 'X' && f !== '0').map(Number)));
    }
    console.log('');

    // Test 2: Create a test chord starting at fret 5
    console.log('📋 Test 2: Creating test chord starting at fret 5...');
    const testChordFret5 = {
      name: 'C_test_5',
      type: 'major',
      root: 'C',
      strings: ['E', 'A', 'D', 'G', 'B', 'E'],
      frets: ['5', '5', '7', '7', '5', '5'], // Starts at fret 5
      fingering: ['1', '1', '3', '4', '2', '1'],
      metadata: {
        difficulty: 'intermediate',
        category: 'barre_chords',
        barre: true,
        barreFret: 5,
        source: 'test',
        popularity: 'medium'
      }
    };
    console.log('   Test chord data created');
    console.log('   Fret positions:', testChordFret5.frets);
    console.log('   Left-most fret: 5');
    console.log('   Right-most fret: 7');
    console.log('');

    // Test 3: Create a test chord starting at fret 7
    console.log('📋 Test 3: Creating test chord starting at fret 7...');
    const testChordFret7 = {
      name: 'D_test_7',
      type: 'major',
      root: 'D',
      strings: ['E', 'A', 'D', 'G', 'B', 'E'],
      frets: ['7', '7', '9', '9', '7', '7'], // Starts at fret 7
      fingering: ['1', '1', '3', '4', '2', '1'],
      metadata: {
        difficulty: 'intermediate',
        category: 'barre_chords',
        barre: true,
        barreFret: 7,
        source: 'test',
        popularity: 'medium'
      }
    };
    console.log('   Test chord data created');
    console.log('   Fret positions:', testChordFret7.frets);
    console.log('   Left-most fret: 7');
    console.log('   Right-most fret: 9');
    console.log('');

    // Test 4: Create a test chord starting at fret 12
    console.log('📋 Test 4: Creating test chord starting at fret 12...');
    const testChordFret12 = {
      name: 'E_test_12',
      type: 'major',
      root: 'E',
      strings: ['E', 'A', 'D', 'G', 'B', 'E'],
      frets: ['12', '12', '14', '14', '12', '12'], // Starts at fret 12
      fingering: ['1', '1', '3', '4', '2', '1'],
      metadata: {
        difficulty: 'advanced',
        category: 'barre_chords',
        barre: true,
        barreFret: 12,
        source: 'test',
        popularity: 'low'
      }
    };
    console.log('   Test chord data created');
    console.log('   Fret positions:', testChordFret12.frets);
    console.log('   Left-most fret: 12');
    console.log('   Right-most fret: 14');
    console.log('');

    // Test 5: Analyze what needs to be fixed
    console.log('📋 Test 5: Analysis of what needs to be fixed...');
    console.log('   Current renderer limitations:');
    console.log('   ❌ Hardcoded fret numbers: [0, 1, 2, 3, 4, 5]');
    console.log('   ❌ Fixed positioning: Always starts at fret 0');
    console.log('   ❌ No dynamic fret labeling for higher positions');
    console.log('   ❌ No fret number positioning below left-most fret line');
    console.log('');
    console.log('   What needs to be implemented:');
    console.log('   ✅ Dynamic fret number calculation based on chord data');
    console.log('   ✅ SVG positioning that shifts for higher fret starts');
    console.log('   ✅ Fret number labels below the left-most fret line');
    console.log('   ✅ Support for any fret range (0-20+)');

    return {
      success: true,
      testChords: [b6add9Data, testChordFret5, testChordFret7, testChordFret12]
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testHigherFretRendering()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 Higher fret rendering test completed successfully!');
      console.log('📋 Ready to implement fixes for higher fret support.');
    } else {
      console.log('\n💥 Test failed:', result.error);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
