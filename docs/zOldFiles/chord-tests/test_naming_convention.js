/**
 * 🧪 Test Chord Naming Convention
 * Demonstrates the naming pattern and generates example URLs
 */

import { demonstrateNamingConvention, generateChordURL, getAllChordVariations } from './chord_naming_convention.js';

console.log('🎸 Testing Chord Naming Convention System\n');

// Demonstrate the naming convention
demonstrateNamingConvention();

console.log('\n' + '='.repeat(60) + '\n');

// Test specific chord variations
console.log('🎯 Testing Specific Chord Variations:\n');

const testChords = [
  { name: 'Am', positionType: 'open', fretPosition: 0 },
  { name: 'C', positionType: 'open', fretPosition: 0 },
  { name: 'F', positionType: 'barre', fretPosition: 1 },
  { name: 'B6add9', positionType: 'complex', fretPosition: 1 }
];

testChords.forEach(chord => {
  console.log(`🎵 ${chord.name} ${chord.positionType} at fret ${chord.fretPosition}:`);
  
  // Generate URLs for both themes
  ['light', 'dark'].forEach(theme => {
    const url = generateChordURL(chord.name, chord.positionType, chord.fretPosition, theme);
    console.log(`   ${theme}: ${url}`);
  });
  console.log('');
});

console.log('='.repeat(60) + '\n');

// Show all variations for a specific chord
console.log('🔄 All Variations for Am chord:\n');
const amVariations = getAllChordVariations('Am', ['open', 'barre'], [0, 1, 3, 5]);
amVariations.forEach((variation, index) => {
  console.log(`${index + 1}. ${variation.chordName}_${variation.positionType}_${variation.fretPosition}_${variation.theme}`);
  console.log(`   S3 Key: ${variation.s3Key}`);
  console.log(`   URL: ${variation.url}`);
  console.log('');
});

console.log('🎉 Naming convention test completed!');
console.log('📁 Ready to implement in chord library system');
