/**
 * 🎯 Smart Fret Positioning Logic
 * Calculates optimal left-most fret for chord display
 * 
 * Rules:
 * 1. ALWAYS TRY to show NUT (0th fret) when possible
 * 2. Only shift when chord range > 5 frets
 * 3. For chords beyond 5th fret: use maxFret - 4 for left-most fret
 * 4. Ensure chord spans from left-most to right-most fret for visual balance
 */

/**
 * Calculate the optimal left-most fret for chord display
 * @param {string[]} frets - Array of 6 fret positions (X, 0, 1, 2, etc.)
 * @returns {Object} Positioning information
 */
export function calculateOptimalFretPosition(frets) {
  if (!frets || frets.length !== 6) {
    throw new Error('Invalid frets array - must have exactly 6 elements');
  }

  // Filter out muted (X) and open (0) strings, get actual fret numbers
  const activeFrets = frets
    .filter(fret => fret !== 'X' && fret !== '0')
    .map(Number);

  if (activeFrets.length === 0) {
    // No active frets (all muted/open) - show NUT
    return {
      leftMostFret: 0,
      rightMostFret: 5,
      displayRange: [0, 1, 2, 3, 4, 5],
      reason: 'No active frets - showing NUT'
    };
  }

  // Calculate actual chord range
  const minFret = Math.min(...activeFrets);
  const maxFret = Math.max(...activeFrets);
  const chordRange = maxFret - minFret;

  console.log(`🎯 Chord analysis: min=${minFret}, max=${maxFret}, range=${chordRange}`);

  // Case 1: Chord fits within 5 frets starting from NUT
  if (maxFret <= 5) {
    return {
      leftMostFret: 0,
      rightMostFret: 5,
      displayRange: [0, 1, 2, 3, 4, 5],
      reason: `Chord fits in NUT range (max fret: ${maxFret})`
    };
  }

  // Case 2: Chord range > 5 frets - need to shift
  if (chordRange > 5) {
    // Calculate minimum left-most fret needed
    const minLeftMost = maxFret - 5;
    
    return {
      leftMostFret: minLeftMost,
      rightMostFret: maxFret,
      displayRange: [minLeftMost, minLeftMost + 1, minLeftMost + 2, minLeftMost + 3, minLeftMost + 4, minLeftMost + 5],
      reason: `Chord range ${chordRange} > 5, shifted to show frets ${minLeftMost}-${maxFret}`
    };
  }

  // Case 3: Chord range ≤ 5 but extends beyond 5th fret
  // Use maxFret - 4 to ensure 5-fret display
  const leftMostFret = Math.max(0, maxFret - 4);
  const rightMostFret = maxFret;
  const displayRange = [leftMostFret, leftMostFret + 1, leftMostFret + 2, leftMostFret + 3, leftMostFret + 4, leftMostFret + 5];

  return {
    leftMostFret,
    rightMostFret,
    displayRange,
    reason: `Chord range ${chordRange} ≤ 5, shifted to show frets ${leftMostFret}-${rightMostFret} (5-fret display)`
  };
}

/**
 * Test function to demonstrate the logic
 */
export function testFretPositioning() {
  console.log('🧪 Testing Smart Fret Positioning Logic...\n');

  const testCases = [
    // Case 1: Fits in NUT range
    {
      name: 'C major (open)',
      frets: ['X', '3', '2', '0', '1', '0'],
      expected: 'Should fit in NUT range (0-5)'
    },
    // Case 2: Fits in NUT range
    {
      name: 'B6add9 (fret 2)',
      frets: ['2', '2', '1', '1', '0', '2'],
      expected: 'Should fit in NUT range (0-5)'
    },
    // Case 3: Fits in NUT range
    {
      name: 'F major (barre)',
      frets: ['1', '1', '2', '3', '3', '1'],
      expected: 'Should fit in NUT range (0-5)'
    },
    // Case 4: Needs shifting (range > 5)
    {
      name: 'C major (7th fret)',
      frets: ['7', '7', '9', '9', '7', '7'],
      expected: 'Should shift to show frets 2-7'
    },
    // Case 5: Needs shifting (range ≤ 5 but beyond 5th fret)
    {
      name: 'D major (12th fret)',
      frets: ['12', '12', '14', '14', '12', '12'],
      expected: 'Should shift to show frets 10-14 (5 frets)'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`📋 Test ${index + 1}: ${testCase.name}`);
    console.log(`   Fret positions: [${testCase.frets.join(', ')}]`);
    console.log(`   Expected: ${testCase.expected}`);
    
    try {
      const result = calculateOptimalFretPosition(testCase.frets);
      console.log(`   Result: Left-most fret ${result.leftMostFret}, Display range: [${result.displayRange.join(', ')}]`);
      console.log(`   Reason: ${result.reason}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  });
}

// Export test function for manual testing
export default {
  calculateOptimalFretPosition,
  testFretPositioning
};
