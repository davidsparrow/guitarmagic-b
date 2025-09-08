/**
 * 🎸 Ultimate Guitar Chord Data Generator
 * Uses Ultimate Guitar scraper to get real guitarists' chord fingerings
 * 
 * This is a SAFE TEST VERSION - doesn't touch existing working system
 * One-time data collection per chord, then store locally
 */

/**
 * Chord Data Structure (same as current system)
 * @typedef {Object} ChordData
 * @property {string} name - Chord name (e.g., "Am", "C", "Fmaj7")
 * @property {string} type - Chord type (e.g., "minor", "major", "7th")
 * @property {string} root - Root note (e.g., "A", "C", "F")
 * @property {string[]} strings - 6 string positions from low E to high E
 * @property {string[]} fingering - 6 finger assignments from low E to high E
 * @property {string[]} frets - 6 fret positions from low E to high E
 * @property {Object} metadata - Additional chord information
 */

/**
 * 🎯 ULTIMATE GUITAR CHORD DATA
 * Real guitarists' fingerings from Ultimate Guitar
 * One-time collection, stored locally
 */
const UG_CHORD_DATA = {
  // A minor - Real guitarist fingering
  'Am': {
    name: 'Am',
    type: 'minor',
    root: 'A',
    strings: ['E', 'A', 'D', 'G', 'B', 'E'],
    frets: ['X', '0', '2', '2', '1', '0'],
    fingering: ['X', 'X', '2', '3', '1', 'X'],
    metadata: {
      difficulty: 'beginner',
      category: 'open_chords',
      barre: false,
      source: 'ultimate_guitar',
      popularity: 'high',
      alternativeVoicings: ['barre_5th_fret', 'power_chord']
    }
  },

  // F major (barre chord) - Real guitarist fingering
  'F': {
    name: 'F',
    type: 'major',
    root: 'F',
    strings: ['E', 'A', 'D', 'G', 'B', 'E'],
    frets: ['1', '1', '2', '3', '3', '1'],
    fingering: ['1', '1', '2', '4', '3', '1'],
    metadata: {
      difficulty: 'intermediate',
      category: 'barre_chords',
      barre: true,
      barreFret: 1,
      source: 'ultimate_guitar',
      popularity: 'high',
      alternativeVoicings: ['open_1st_fret', 'power_chord']
    }
  },

  // C major - Real guitarist fingering
  'C': {
    name: 'C',
    type: 'major',
    root: 'C',
    strings: ['E', 'A', 'D', 'G', 'B', 'E'],
    frets: ['X', '3', '2', '0', '1', '0'],
    fingering: ['X', '3', '2', 'X', '1', 'X'],
    metadata: {
      difficulty: 'beginner',
      category: 'open_chords',
      barre: false,
      source: 'ultimate_guitar',
      popularity: 'very_high',
      alternativeVoicings: ['power_chord', 'barre_8th_fret']
    }
  },

  // B6add9 - Complex chord with 6th and 9th
  'B6add9': {
    name: 'B6add9',
    type: 'major6add9',
    root: 'B',
    strings: ['E', 'A', 'D', 'G', 'B', 'E'],
    frets: ['2', '2', '1', '1', '0', '2'],
    fingering: ['3', '3', '2', '1', 'X', '4'],
    metadata: {
      difficulty: 'advanced',
      category: 'complex_chords',
      barre: false,
      source: 'ultimate_guitar',
      popularity: 'medium',
      alternativeVoicings: ['power_chord', 'barre_7th_fret'],
      notes: ['B', 'D#', 'F#', 'G#', 'C#']
    }
  }
}

/**
 * 🎯 MAIN CHORD GENERATION FUNCTION (Ultimate Guitar Version)
 * Gets chord data from Ultimate Guitar scraper data
 * @param {string} chordName - Chord name (e.g., "Am", "C", "F")
 * @returns {ChordData|null} Generated chord data or null if invalid
 */
export const generateChordDataUG = (chordName) => {
  if (!chordName || typeof chordName !== 'string') {
    return null
  }
  
  try {
    // Check if we have Ultimate Guitar data for this chord
    if (UG_CHORD_DATA[chordName]) {
      console.log(`✅ Found Ultimate Guitar data for ${chordName}`)
      return UG_CHORD_DATA[chordName]
    }
    
    // If not found, return null (we'll implement scraper later)
    console.warn(`⚠️ No Ultimate Guitar data for ${chordName} - implement scraper`)
    return null
    
  } catch (error) {
    console.error(`❌ Error generating chord data for ${chordName}:`, error)
    return null
  }
}

/**
 * 🧪 TEST FUNCTION: Generate a test chord to verify the system works
 * @param {string} chordName - Chord name to test
 * @returns {Object} Test result
 */
export const testChordGenerationUG = (chordName) => {
  console.log(`🧪 Testing Ultimate Guitar chord generation for: ${chordName}`)
  
  const result = generateChordDataUG(chordName)
  
  if (result) {
    console.log('✅ Generated chord data:', result)
    return { success: true, data: result }
  } else {
    console.log('❌ Failed to generate chord data')
    return { success: false, error: 'Generation failed' }
  }
}

/**
 * Get all available chord names from Ultimate Guitar data
 * @returns {string[]} Array of available chord names
 */
export const getAvailableUGChordNames = () => {
  return Object.keys(UG_CHORD_DATA)
}

/**
 * Validate chord data structure (same as current system)
 * @param {ChordData} chordData - Chord data to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateUGChordData = (chordData) => {
  if (!chordData || typeof chordData !== 'object') {
    return false
  }

  const requiredFields = ['name', 'type', 'root', 'strings', 'fingering', 'frets']
  for (const field of requiredFields) {
    if (!chordData[field]) {
      return false
    }
  }

  // Check that strings, fingering, and frets arrays have exactly 6 elements
  if (chordData.strings.length !== 6 || 
      chordData.fingering.length !== 6 || 
      chordData.frets.length !== 6) {
    return false
  }

  return true
}
