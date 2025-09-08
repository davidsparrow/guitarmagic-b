/**
 * 🏷️ Chord Naming Convention System
 * Defines how chord SVGs are named and organized in S3
 * 
 * NEW STRUCTURE: chords/{theme}/{chordName}_{fretStartNumber}_{theme}.svg
 * Examples: chords/lt/C_0_lt.svg, chords/dk/Cmaj7_0_dk.svg, chords/lt/B6add9_2_lt.svg
 * 
 * Theme folders: chords/lt/ (light), chords/dk/ (dark)
 * Theme suffixes: _lt.svg (light), _dk.svg (dark)
 */

export const CHORD_NAMING_CONVENTION = {
  // Base structure for S3 keys (theme folders with theme suffixes)
  s3KeyPattern: 'chords/{theme}/{chordName}_{fretStartNumber}_{theme}.svg',
  
  // URL structure for easy retrieval
  urlPattern: 'https://guitarmagic-chord-library.s3.us-west-2.amazonaws.com/chords/{theme}/{chordName}_{fretStartNumber}_{theme}.svg',
  
  // Theme options with suffixes
  themes: ['lt', 'dk'],
  
  // Fret start positions (where to begin drawing the chord diagram)
  // Chord diagrams can start at ANY fret position from 0 (NUT) to 20+
  fretStartPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  
  // Examples of the new naming pattern with theme folders and suffixes
  examples: {
    'C_0_lt': {
      s3Key: 'chords/lt/C_0_lt.svg',
      url: 'https://guitarmagic-chord-library.s3.us-west-2.amazonaws.com/chords/lt/C_0_lt.svg',
      description: 'C major chord at NUT position (0th fret), light theme'
    },
    'F_1_dk': {
      s3Key: 'chords/dk/F_1_dk.svg',
      url: 'https://guitarmagic-chord-library.s3.us-west-2.amazonaws.com/chords/dk/F_1_dk.svg',
      description: 'F major chord starting at 1st fret, dark theme'
    },
    'B6add9_2_lt': {
      s3Key: 'chords/lt/B6add9_2_lt.svg',
      url: 'https://guitarmagic-chord-library.s3.us-west-2.amazonaws.com/chords/lt/B6add9_2_lt.svg',
      description: 'B6add9 chord starting at 2nd fret, light theme'
    },
    'Cmaj7_0_dk': {
      s3Key: 'chords/dk/Cmaj7_0_dk.svg',
      url: 'https://guitarmagic-chord-library.s3.us-west-2.amazonaws.com/chords/dk/Cmaj7_0_dk.svg',
      description: 'C major 7th chord at NUT position, dark theme'
    }
  }
};

// Helper functions for generating names and URLs
export function generateChordFileName(chordName, fretStartNumber, theme) {
  return `${chordName}_${fretStartNumber}_${theme}.svg`;
}

export function generateS3Key(chordName, fretStartNumber, theme) {
  return `chords/${theme}/${generateChordFileName(chordName, fretStartNumber, theme)}`;
}

export function generateChordURL(chordName, fretStartNumber, theme) {
  const s3Key = generateS3Key(chordName, fretStartNumber, theme);
  return `https://guitarmagic-chord-library.s3.us-west-2.amazonaws.com/${s3Key}`;
}

// Function to parse a filename back to its components
export function parseChordFileName(filename) {
  // Remove .svg extension
  const nameWithoutExt = filename.replace('.svg', '');
  
  // Split by underscore
  const parts = nameWithoutExt.split('_');
  
  if (parts.length >= 3) {
    return {
      chordName: parts[0],
      fretStartNumber: parseInt(parts[1]),
      theme: parts[2] // lt or dk
    };
  }
  
  return null;
}

// Function to get all possible variations for a chord
export function getAllChordVariations(chordName, fretStartPositions = [0, 1, 2, 3, 5, 7]) {
  const variations = [];
  
  for (const theme of CHORD_NAMING_CONVENTION.themes) {
    for (const fretStartNumber of fretStartPositions) {
      variations.push({
        chordName,
        fretStartNumber,
        theme,
        s3Key: generateS3Key(chordName, fretStartNumber, theme),
        url: generateChordURL(chordName, fretStartNumber, theme)
      });
    }
  }
  
  return variations;
}

// Example usage and testing
export function demonstrateNamingConvention() {
  console.log('🏷️ NEW Chord Naming Convention with Theme Folders and Suffixes\n');
  
  console.log('📋 Naming Pattern:');
  console.log(`   ${CHORD_NAMING_CONVENTION.s3KeyPattern}\n`);
  
  console.log('🌐 URL Pattern:');
  console.log(`   ${CHORD_NAMING_CONVENTION.urlPattern}\n`);
  
  console.log('📁 Example Files:');
  Object.entries(CHORD_NAMING_CONVENTION.examples).forEach(([key, example]) => {
    console.log(`   ${key}:`);
    console.log(`     S3 Key: ${example.s3Key}`);
    console.log(`     URL: ${example.url}`);
    console.log(`     Description: ${example.description}\n`);
  });
  
  console.log('🎯 All Variations for C chord:');
  const cVariations = getAllChordVariations('C', [0, 1, 3, 5]);
  cVariations.forEach(variation => {
    console.log(`   ${variation.chordName}_${variation.fretStartNumber}_${variation.theme}`);
    console.log(`     → ${variation.url}`);
  });
}

// Export the demonstration function for testing
export default {
  CHORD_NAMING_CONVENTION,
  generateChordFileName,
  generateS3Key,
  generateChordURL,
  parseChordFileName,
  getAllChordVariations,
  demonstrateNamingConvention
};
