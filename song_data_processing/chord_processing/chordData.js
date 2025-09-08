/**
 * 🎸 Chord Data Structure for GuitarMagic - MVP Version
 * 
 * This system generates REAL chord data using music theory and proper fret calculations.
 * Focus: Open position chords only (frets 0-7) for MVP.
 * 
 * Each chord contains:
 * - String positions (6 strings, from low E to high E)
 * - Fret positions (0 = open, X = muted, 1-7 = fret number)
 * - Finger assignments (1-4 for finger numbers, X for no finger)
 * - Chord name and type
 */

import { assignErgonomicFingering } from './generateChordFingering.js'

/**
 * Chord Data Structure
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
 * String positions for 6-string guitar (low E to high E)
 * Index 0 = Low E (6th string)
 * Index 5 = High E (1st string)
 */
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E']

/**
 * 🎯 MVP FRETBOARD MAP (Frets 0-7 only)
 * Maps each string and fret to its note
 * Focus: Open position chords for MVP
 */
const MVP_FRETBOARD_MAP = {
  // Low E string (6th string) - frets 0-7
  'E6': { 0: 'E', 1: 'F', 2: 'F#', 3: 'G', 4: 'G#', 5: 'A', 6: 'A#', 7: 'B' },
  
  // A string (5th string) - frets 0-7  
  'A5': { 0: 'A', 1: 'A#', 2: 'B', 3: 'C', 4: 'C#', 5: 'D', 6: 'D#', 7: 'E' },
  
  // D string (4th string) - frets 0-7
  'D4': { 0: 'D', 1: 'D#', 2: 'E', 3: 'F', 4: 'F#', 5: 'G', 6: 'G#', 7: 'A' },
  
  // G string (3rd string) - frets 0-7
  'G3': { 0: 'G', 1: 'G#', 2: 'A', 3: 'A#', 4: 'B', 5: 'C', 6: 'C#', 7: 'D' },
  
  // B string (2nd string) - frets 0-7
  'B2': { 0: 'B', 1: 'C', 2: 'C#', 3: 'D', 4: 'D#', 5: 'E', 6: 'F', 7: 'F#' },
  
  // High E string (1st string) - frets 0-7
  'E1': { 0: 'E', 1: 'F', 2: 'F#', 3: 'G', 4: 'G#', 5: 'A', 6: 'A#', 7: 'B' }
}

/**
 * 🎵 CHORD THEORY - What notes make up each chord type
 * This defines the musical structure of each chord type
 */
const CHORD_THEORY = {
  // Major chords: Root, Major 3rd, Perfect 5th
  'major': {
    intervals: [0, 4, 7], // Root, Major 3rd, Perfect 5th
    notes: ['root', 'major3rd', 'perfect5th']
  },
  
  // Minor chords: Root, Minor 3rd, Perfect 5th
  'minor': {
    intervals: [0, 3, 7], // Root, Minor 3rd, Perfect 5th
    notes: ['root', 'minor3rd', 'perfect5th']
  },
  
  // Major 7th: Root, Major 3rd, Perfect 5th, Major 7th
  'maj7': {
    intervals: [0, 4, 7, 11],
    notes: ['root', 'major3rd', 'perfect5th', 'major7th']
  },
  
  // Minor 7th: Root, Minor 3rd, Perfect 5th, Minor 7th
  'm7': {
    intervals: [0, 3, 7, 10],
    notes: ['root', 'minor3rd', 'perfect5th', 'minor7th']
  },
  
  // 7th (Dominant): Root, Major 3rd, Perfect 5th, Minor 7th
  '7': {
    intervals: [0, 4, 7, 10],
    notes: ['root', 'major3rd', 'perfect5th', 'minor7th']
  },
  
  // Power chord (5th): Root, Perfect 5th
  '5': {
    intervals: [0, 7],
    notes: ['root', 'perfect5th']
  },
  
  // Suspended 4th: Root, Perfect 4th, Perfect 5th
  'sus4': {
    intervals: [0, 5, 7],
    notes: ['root', 'perfect4th', 'perfect5th']
  },
  
  // 6th: Root, Major 3rd, Perfect 5th, Major 6th
  '6': {
    intervals: [0, 4, 7, 9],
    notes: ['root', 'major3rd', 'perfect5th', 'major6th']
  },
  
  // Minor 6th: Root, Minor 3rd, Perfect 5th, Major 6th
  'm6': {
    intervals: [0, 3, 7, 9],
    notes: ['root', 'minor3rd', 'perfect5th', 'major6th']
  },
  
  // 9th: Root, Major 3rd, Perfect 5th, Minor 7th, Major 9th
  '9': {
    intervals: [0, 4, 7, 10, 14],
    notes: ['root', 'major3rd', 'perfect5th', 'minor7th', 'major9th']
  },
  
  // Major 9th: Root, Major 3rd, Perfect 5th, Major 7th, Major 9th
  'maj9': {
    intervals: [0, 4, 7, 11, 14],
    notes: ['root', 'major3rd', 'perfect5th', 'major7th', 'major9th']
  },
  
  // Augmented: Root, Major 3rd, Augmented 5th
  '+': {
    intervals: [0, 4, 8],
    notes: ['root', 'major3rd', 'augmented5th']
  },
  
  // Diminished: Root, Minor 3rd, Diminished 5th
  '°': {
    intervals: [0, 3, 6],
    notes: ['root', 'minor3rd', 'diminished5th']
  }
}

/**
 * 🎼 NOTE TO SEMITONE MAPPING
 * Maps note names to their semitone values (C = 0)
 */
const NOTE_SEMITONES = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
}

/**
 * 🔍 FIND NOTE ON STRING
 * Finds the fret position of a note on a specific string
 * @param {string} note - Note to find (e.g., 'C', 'F#')
 * @param {string} stringName - String name (e.g., 'E6', 'A5')
 * @returns {number|null} Fret position or null if not found in MVP range
 */
const findNoteOnString = (note, stringName) => {
  const stringMap = MVP_FRETBOARD_MAP[stringName]
  if (!stringMap) return null
  
  for (let fret = 0; fret <= 7; fret++) {
    if (stringMap[fret] === note) {
      return fret
    }
  }
  return null
}

/**
 * 🎯 CALCULATE CHORD NOTES
 * Calculates the actual notes that make up a chord
 * @param {string} rootNote - Root note of the chord (e.g., 'A', 'C')
 * @param {string} chordType - Type of chord (e.g., 'major', 'minor')
 * @returns {string[]} Array of notes in the chord
 */
const calculateChordNotes = (rootNote, chordType) => {
  const theory = CHORD_THEORY[chordType]
  if (!theory) return []
  
  const rootSemitone = NOTE_SEMITONES[rootNote]
  if (rootSemitone === undefined) return []
  
  const chordNotes = []
  for (const interval of theory.intervals) {
    const noteSemitone = (rootSemitone + interval) % 12
    // Find note name from semitone
    for (const [noteName, semitone] of Object.entries(NOTE_SEMITONES)) {
      if (semitone === noteSemitone) {
        chordNotes.push(noteName)
        break
      }
    }
  }
  
  return chordNotes
}

/**
 * 🎸 GENERATE CHORD FRETBOARD
 * Generates the actual fretboard positions for a chord
 * @param {string} rootNote - Root note of the chord
 * @param {string} chordType - Type of chord
 * @returns {Object} { strings, fingering, frets }
 */
const generateChordFretboard = (rootNote, chordType) => {
  const chordNotes = calculateChordNotes(rootNote, chordType)
  if (chordNotes.length === 0) return null
  

  
  const strings = ['X', 'X', 'X', 'X', 'X', 'X']
  const fingering = ['X', 'X', 'X', 'X', 'X', 'X']
  const frets = ['X', 'X', 'X', 'X', 'X', 'X']
  
  const stringKeys = ['E6', 'A5', 'D4', 'G3', 'B2', 'E1']
  
  // First, try to use open strings when possible
  for (let i = 0; i < stringKeys.length; i++) {
    const stringKey = stringKeys[i]
    const openNote = MVP_FRETBOARD_MAP[stringKey][0]
    
    if (chordNotes.includes(openNote)) {
      strings[i] = openNote
      frets[i] = '0'
      fingering[i] = 'X' // Open string, no finger needed
    }
  }
  
  // Then fill in fretted notes, prioritizing lower frets
  for (let i = 0; i < stringKeys.length; i++) {
    if (strings[i] !== 'X') continue // Already filled
    
    const stringKey = stringKeys[i]
    
    // Try each chord note on this string, prioritizing lower frets
    let bestFret = null
    let bestNote = null
    
    for (const note of chordNotes) {
      const fret = findNoteOnString(note, stringKey)
      if (fret !== null && fret > 0) {
        if (bestFret === null || fret < bestFret) {
          bestFret = fret
          bestNote = note
        }
      }
    }
    
    if (bestFret !== null) {
      strings[i] = bestNote
      frets[i] = bestFret.toString()
      fingering[i] = '1' // Assign finger 1 for now
    }
  }
  
  // Ensure we have at least 3 notes for a valid chord
  const activeStrings = strings.filter(note => note !== 'X')
  if (activeStrings.length < 3) {
    console.warn(`⚠️ Generated chord has only ${activeStrings.length} notes, need at least 3`)
    return null
  }
  
  // Optimize finger assignments using helper
  const assigned = assignErgonomicFingering(frets, fingering)
  for (let i = 0; i < fingering.length; i++) {
    fingering[i] = assigned[i]
  }
  
  // Always return canonical tuning labels for strings (Low E → High E)
  const tuningLabels = ['E', 'A', 'D', 'G', 'B', 'E']
  return { strings: tuningLabels, fingering, frets }
}

/**
 * 🎯 MAIN CHORD GENERATION FUNCTION
 * Generates chord data using real music theory
 * @param {string} chordName - Chord name (e.g., "Am", "Cmaj7")
 * @returns {ChordData|null} Generated chord data or null if invalid
 */
export const generateChordData = (chordName) => {
  if (!chordName || typeof chordName !== 'string') {
    return null
  }
  
  try {
    // Parse the chord name to extract root note and modifier
    const { rootNote, modifier } = parseChordName(chordName)
    
    if (!rootNote) {
      console.warn(`⚠️ Invalid chord name: ${chordName}`)
      return null
    }
    
    // Determine chord type and validate
    const chordType = determineChordType(modifier)
    
    if (!chordType || !CHORD_THEORY[chordType]) {
      console.warn(`⚠️ Unsupported chord type: ${chordType}`)
      return null
    }
    
    // Generate the fretboard positions
    const fretboard = generateChordFretboard(rootNote, chordType)
    if (!fretboard) {
      console.warn(`⚠️ Could not generate fretboard for ${chordName}`)
      return null
    }
    
    // Build the complete chord data
    const chordData = {
      name: chordName,
      type: chordType,
      root: rootNote,
      strings: fretboard.strings,
      fingering: fretboard.fingering,
      frets: fretboard.frets,
      metadata: {
        difficulty: 'beginner', // MVP assumption
        category: 'open_chords',
        barre: false,
        generated: true,
        method: 'music_theory'
      }
    }
    
    return chordData
    
  } catch (error) {
    console.error(`❌ Error generating chord data for ${chordName}:`, error)
    return null
  }
}

/**
 * Parse chord name into root note and modifier
 * @param {string} chordName - Chord name to parse
 * @returns {Object} { rootNote, modifier }
 */
const parseChordName = (chordName) => {
  if (!chordName) return { rootNote: '', modifier: '' }
  
  // Handle special cases first
  if (chordName.includes('°')) {
    return { rootNote: chordName.replace('°', ''), modifier: '°' }
  }
  
  // Handle maj9, maj7, etc. (special case for "maj" prefix)
  if (chordName.includes('maj')) {
    const majIndex = chordName.indexOf('maj')
    const rootNote = chordName.substring(0, majIndex)
    const modifier = chordName.substring(majIndex)
    return { rootNote, modifier }
  }
  
  // Handle compound modifiers like "m6" (minor 6th)
  if (chordName.includes('m6')) {
    const rootNote = chordName.replace('m6', '')
    return { rootNote, modifier: 'm6' }
  }
  
  // Handle minor chords (m modifier)
  if (chordName.endsWith('m')) {
    const rootNote = chordName.slice(0, -1)
    return { rootNote, modifier: 'minor' }
  }
  
  // Find other modifiers by checking from longest to shortest
  const modifiers = Object.keys(CHORD_THEORY)
    .filter(key => key !== 'minor' && key !== 'm6') // Already handled above
    .sort((a, b) => b.length - a.length) // Longest first
  
  for (const modifier of modifiers) {
    if (chordName.endsWith(modifier)) {
      const rootNote = chordName.slice(0, -modifier.length)
      // Validate that we have a valid root note (not empty)
      if (rootNote && rootNote.length > 0) {
        return { rootNote, modifier }
      }
    }
  }
  
  // No modifier found, assume major
  return { rootNote: chordName, modifier: 'major' }
}

/**
 * Determine chord type from modifier
 * @param {string} modifier - Chord modifier
 * @returns {string} Chord type
 */
const determineChordType = (modifier) => {
  return modifier || 'major'
}

/**
 * 🎸 LEGACY CHORD DATA (for backward compatibility)
 * These are the original hardcoded chords
 */
export const COMMON_CHORDS = {
  // A minor
  'Am': {
    name: 'Am',
    type: 'minor',
    root: 'A',
    strings: ['X', '0', '2', '2', '1', '0'],
    fingering: ['X', 'X', '2', '3', '1', 'X'],
    frets: ['X', '0', '2', '2', '1', '0'],
    metadata: {
      difficulty: 'beginner',
      category: 'open_chords',
      barre: false
    }
  },

  // C major
  'C': {
    name: 'C',
    type: 'major',
    root: 'C',
    strings: ['X', '3', '2', '0', '1', '0'],
    fingering: ['X', '3', '2', 'X', '1', 'X'],
    frets: ['X', '3', '2', '0', '1', '0'],
    metadata: {
      difficulty: 'beginner',
      category: 'open_chords',
      barre: false
    }
  },

  // F major (barre chord)
  'F': {
    name: 'F',
    type: 'major',
    root: 'F',
    strings: ['1', '1', '2', '3', '3', '1'],
    fingering: ['1', '1', '2', '4', '3', '1'],
    frets: ['1', '1', '2', '3', '3', '1'],
    metadata: {
      difficulty: 'intermediate',
      category: 'barre_chords',
      barre: true,
      barreFret: 1
    }
  }
}

/**
 * Get chord data by name (smart generation + legacy fallback)
 * @param {string} chordName - Chord name (e.g., "Am", "C", "Fmaj7")
 * @returns {ChordData|null} Chord data or null if not found
 */
export const getChordData = (chordName) => {
  // First try to get from legacy common chords
  if (COMMON_CHORDS[chordName]) {
    return COMMON_CHORDS[chordName]
  }
  
  // If not found, try to generate it
  const generatedChord = generateChordData(chordName)
  if (generatedChord) {
    return generatedChord
  }
  
  // If generation fails, return null
  return null
}

/**
 * Get all available chord names
 * @returns {string[]} Array of available chord names
 */
export const getAvailableChordNames = () => {
  return Object.keys(COMMON_CHORDS)
}

/**
 * Validate chord data structure
 * @param {ChordData} chordData - Chord data to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateChordData = (chordData) => {
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

/**
 * 🧪 TEST FUNCTION: Generate a test chord to verify the system works
 * @param {string} chordName - Chord name to test
 * @returns {Object} Test result
 */
export const testChordGeneration = (chordName) => {
  console.log(`🧪 Testing chord generation for: ${chordName}`)
  
  const result = generateChordData(chordName)
  
  if (result) {
    console.log('✅ Generated chord data:', result)
    return { success: true, data: result }
  } else {
    console.log('❌ Failed to generate chord data')
    return { success: false, error: 'Generation failed' }
  }
}
