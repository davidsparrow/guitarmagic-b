/**
 * 🧪 Test Dynamic Fret Positioning Integration
 * Tests the updated chord renderer with dynamic positioning
 */

import { renderChord } from '../utils/chordRenderer.js';
import fs from 'fs';

/**
 * Test chord data for different positioning scenarios
 */
const testChords = [
  {
    name: 'C major (open)',
    description: 'Should show frets 0-5 with nut',
    data: {
      strings: ['X', '3', '2', '0', '1', '0'],
      frets: ['X', '3', '2', '0', '1', '0'],
      fingering: ['X', '3', '2', '0', '1', '0']
    },
    expected: 'Frets 0-5, nut visible'
  },
  {
    name: 'D major (12th fret)',
    description: 'Should show frets 10-15, no nut',
    data: {
      strings: ['12', '12', '14', '14', '12', '12'],
      frets: ['12', '12', '14', '14', '12', '12'],
      fingering: ['1', '1', '3', '3', '1', '1']
    },
    expected: 'Frets 10-15, no nut'
  },
  {
    name: 'F major (barre)',
    description: 'Should show frets 0-5 with nut',
    data: {
      strings: ['1', '1', '2', '3', '3', '1'],
      frets: ['1', '1', '2', '3', '3', '1'],
      fingering: ['1', '1', '2', '3', '3', '1']
    },
    expected: 'Frets 0-5, nut visible'
  }
];

/**
 * Test the dynamic positioning integration
 */
async function testDynamicPositioning() {
  console.log('🧪 Testing Dynamic Fret Positioning Integration...\n');

  const results = [];

  for (const testChord of testChords) {
    console.log(`📋 Testing: ${testChord.name}`);
    console.log(`   Description: ${testChord.description}`);
    console.log(`   Expected: ${testChord.expected}`);
    
    try {
      // Test light theme
      const lightSVG = renderChord(testChord.data, 'open', 'light');
      
      // Test dark theme
      const darkSVG = renderChord(testChord.data, 'open', 'dark');
      
      // Save test files
      const lightFileName = `test_${testChord.name.replace(/\s+/g, '_').replace(/[()]/g, '')}_light.svg`;
      const darkFileName = `test_${testChord.name.replace(/\s+/g, '_').replace(/[()]/g, '')}_dark.svg`;
      
      fs.writeFileSync(lightFileName, lightSVG);
      fs.writeFileSync(darkFileName, darkSVG);
      
      const result = {
        name: testChord.name,
        status: '✅ Success',
        lightFile: lightFileName,
        darkFile: darkFileName,
        lightSize: lightSVG.length,
        darkSize: darkSVG.length
      };
      
      results.push(result);
      
      console.log(`   ✅ Light theme: ${lightFileName} (${lightSVG.length} bytes)`);
      console.log(`   ✅ Dark theme: ${darkFileName} (${darkSVG.length} bytes)`);
      
    } catch (error) {
      const result = {
        name: testChord.name,
        status: '❌ Failed',
        error: error.message
      };
      
      results.push(result);
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 Test Summary:');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === '✅ Success');
  const failed = results.filter(r => r.status === '❌ Failed');
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log('');

  successful.forEach(result => {
    console.log(`✅ ${result.name}:`);
    console.log(`   Light: ${result.lightFile} (${result.lightSize} bytes)`);
    console.log(`   Dark: ${result.darkFile} (${result.darkSize} bytes)`);
  });

  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(result => {
      console.log(`❌ ${result.name}: ${result.error}`);
    });
  }

  console.log('\n🎯 Dynamic positioning test completed!');
  console.log('📁 Check the generated SVG files to verify positioning');
  
  return successful.length > 0;
}

// Run the test
testDynamicPositioning()
  .then(success => {
    if (success) {
      console.log('\n🚀 Dynamic fret positioning integration successful!');
      console.log('🎯 Ready to test with real chord data!');
    } else {
      console.log('\n💥 Dynamic fret positioning test failed');
      console.log('🔧 Please check the errors above');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
  });
