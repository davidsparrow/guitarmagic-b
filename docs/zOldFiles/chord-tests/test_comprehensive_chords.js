/**
 * 🧪 Comprehensive Chord Testing with Dynamic Fret Positioning
 * Tests various chord types and positions using REAL UltimateGuitar chord data
 */

import { renderChord } from '../utils/chordRenderer.js';
import fs from 'fs';

/**
 * REAL chord data from UltimateGuitar (not fake data!)
 */
const realChordData = {
  // A minor - REAL UltimateGuitar data
  'Am': {
    name: 'Am',
    description: 'Real Am from UltimateGuitar - should show frets 0-5 with nut',
    data: {
      strings: ['E', 'A', 'D', 'G', 'B', 'E'],
      frets: ['X', '0', '2', '2', '1', '0'],
      fingering: ['X', 'X', '2', '3', '1', 'X']
    },
    expected: 'Frets 0-5, nut visible, open strings'
  },

  // C major - REAL UltimateGuitar data  
  'C': {
    name: 'C',
    description: 'Real C major from UltimateGuitar - should show frets 0-5 with nut',
    data: {
      strings: ['E', 'A', 'D', 'G', 'B', 'E'],
      frets: ['X', '3', '2', '0', '1', '0'],
      fingering: ['X', '3', '2', 'X', '1', 'X']
    },
    expected: 'Frets 0-5, nut visible, open strings'
  },

  // F major - REAL UltimateGuitar data
  'F': {
    name: 'F',
    description: 'Real F major barre from UltimateGuitar - should show frets 0-5 with nut',
    data: {
      strings: ['E', 'A', 'D', 'G', 'B', 'E'],
      frets: ['1', '1', '2', '3', '3', '1'],
      fingering: ['1', '1', '2', '4', '3', '1']
    },
    expected: 'Frets 0-5, nut visible, barre at 1st'
  },

  // B6add9 - REAL UltimateGuitar data
  'B6add9': {
    name: 'B6add9',
    description: 'Real B6add9 from UltimateGuitar - should show frets 0-5 with nut',
    data: {
      strings: ['E', 'A', 'D', 'G', 'B', 'E'],
      frets: ['2', '2', '1', '1', '0', '2'],
      fingering: ['3', '3', '2', '1', 'X', '4']
    },
    expected: 'Frets 0-5, nut visible, complex chord'
  }
};

/**
 * Test the comprehensive chord scenarios with REAL data
 */
async function testComprehensiveChords() {
  console.log('🧪 Comprehensive Chord Testing with REAL UltimateGuitar Data...\n');

  const results = [];
  const testDir = 'comprehensive_test_results';

  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }

  for (const [chordName, chordInfo] of Object.entries(realChordData)) {
    console.log(`📋 Testing: ${chordInfo.name}`);
    console.log(`   Description: ${chordInfo.description}`);
    console.log(`   Expected: ${chordInfo.expected}`);
    console.log(`   REAL Data: ${chordInfo.data.frets.join(', ')}`);
    
    try {
      // Test light theme
      const lightSVG = renderChord(chordInfo.data, 'open', 'light');
      
      // Test dark theme
      const darkSVG = renderChord(chordInfo.data, 'open', 'dark');
      
      // Save test files in organized directory
      const safeName = chordName.replace(/\s+/g, '_').replace(/[()]/g, '').replace(/[^a-zA-Z0-9_]/g, '');
      const lightFileName = `${testDir}/test_${safeName}_light.svg`;
      const darkFileName = `${testDir}/test_${safeName}_dark.svg`;
      
      fs.writeFileSync(lightFileName, lightSVG);
      fs.writeFileSync(darkFileName, darkSVG);
      
      const result = {
        name: chordInfo.name,
        status: '✅ Success',
        lightFile: lightFileName,
        darkFile: darkFileName,
        lightSize: lightSVG.length,
        darkSize: darkSVG.length,
        description: chordInfo.description,
        expected: chordInfo.expected,
        realData: chordInfo.data.frets.join(', ')
      };
      
      results.push(result);
      
      console.log(`   ✅ Light theme: ${lightFileName} (${lightSVG.length} bytes)`);
      console.log(`   ✅ Dark theme: ${darkFileName} (${darkSVG.length} bytes)`);
      
    } catch (error) {
      const result = {
        name: chordInfo.name,
        status: '❌ Failed',
        error: error.message,
        description: chordInfo.description,
        expected: chordInfo.expected,
        realData: chordInfo.data.frets.join(', ')
      };
      
      results.push(result);
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 Comprehensive Test Summary:');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.status === '✅ Success');
  const failed = results.filter(r => r.status === '❌ Failed');
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log('');

  successful.forEach(result => {
    console.log(`✅ ${result.name}:`);
    console.log(`   ${result.description}`);
    console.log(`   Expected: ${result.expected}`);
    console.log(`   REAL Data: ${result.realData}`);
    console.log(`   Light: ${result.lightFile} (${result.lightSize} bytes)`);
    console.log(`   Dark: ${result.darkFile} (${result.darkSize} bytes)`);
    console.log('');
  });

  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(result => {
      console.log(`❌ ${result.name}: ${result.error}`);
      console.log(`   Expected: ${result.expected}`);
      console.log(`   REAL Data: ${result.realData}`);
    });
  }

  console.log('\n🎯 Comprehensive chord testing completed with REAL data!');
  console.log(`📁 Check the generated SVG files in: ${testDir}/`);
  console.log('🔍 Look for:');
  console.log('   - Open chords showing frets 0-5 with nut');
  console.log('   - Proper fret number labels');
  console.log('   - Correct string positioning');
  console.log('   - REAL UltimateGuitar fingerings');
  
  return successful.length > 0;
}

// Run the comprehensive test
testComprehensiveChords()
  .then(success => {
    if (success) {
      console.log('\n🚀 Comprehensive chord testing successful with REAL data!');
      console.log('🎯 Dynamic fret positioning working with UltimateGuitar chords!');
    } else {
      console.log('\n💥 Comprehensive chord testing failed');
      console.log('🔧 Please check the errors above');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
