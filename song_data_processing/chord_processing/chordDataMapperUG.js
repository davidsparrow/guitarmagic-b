/**
 * 🎸 Ultimate Guitar Data Mapper
 * 
 * Transforms Ultimate Guitar data format to internal chord data format
 * Handles the conversion from UG's Applicature structure to our chord system
 * 
 * Features:
 * - UG to internal format conversion
 * - String/fret/finger mapping
 * - Metadata enrichment
 * - Error handling and validation
 */

/**
 * Ultimate Guitar Data Structure (from Go tool)
 * @typedef {Object} UGApplicature
 * @property {string} chord - Chord name (e.g., "Am", "C")
 * @property {Array} variations - Array of chord variations
 * @property {Object} variations[].frets - Fret positions array
 * @property {Object} variations[].fingers - Finger assignments array
 * @property {Object} variations[].notes - Note values array
 */

/**
 * Internal Chord Data Structure (our system)
 * @typedef {Object} InternalChordData
 * @property {string} name - Chord name (e.g., "Am", "C")
 * @property {string} type - Chord type (e.g., "minor", "major")
 * @property {string} root - Root note (e.g., "A", "C")
 * @property {string[]} strings - 6 string positions from low E to high E
 * @property {string[]} fingering - 6 finger assignments from low E to high E
 * @property {string[]} frets - 6 fret positions from low E to high E
 * @property {Object} metadata - Additional chord information
 */

/**
 * 🎯 MAIN TRANSFORMATION FUNCTION
 * Converts UG data to internal chord format
 * 
 * @param {Object} ugData - Raw data from Ultimate Guitar scraper
 * @param {string} chordName - Original chord name requested
 * @returns {InternalChordData|null} Transformed chord data or null if failed
 */
export const transformUGDataToInternal = (ugData, chordName) => {
  if (!ugData || !chordName) {
    console.warn('⚠️ Invalid input for transformation:', { ugData, chordName })
    return null
  }

  try {
    console.log(`🔄 Transforming UG data for chord: ${chordName}`)
    console.log(`📄 UG data structure:`, Object.keys(ugData))
    
    // Handle different UG data formats
    if (Array.isArray(ugData)) {
      // Multiple applicatures returned
      return transformApplicatureArray(ugData, chordName)
    } else if (ugData.chord && ugData.variations) {
      // Single applicature with variations
      return transformSingleApplicature(ugData, chordName)
    } else {
      // Unknown format - try to extract what we can
      console.warn(`⚠️ Unknown UG data format for ${chordName}:`, ugData)
      return createFallbackChordData(chordName, ugData)
    }
    
  } catch (error) {
    console.error(`❌ Error transforming UG data for ${chordName}:`, error)
    return createFallbackChordData(chordName, ugData)
  }
}

/**
 * Transform an array of applicatures (multiple chord variations)
 * 
 * @param {Array} applicatures - Array of UG applicature objects
 * @param {string} chordName - Original chord name
 * @returns {InternalChordData|null} Best variation or null
 */
const transformApplicatureArray = (applicatures, chordName) => {
  console.log(`🔄 Processing ${applicatures.length} applicature variations`)
  
  if (applicatures.length === 0) {
    console.warn(`⚠️ No applicature variations found for ${chordName}`)
    return null
  }
  
  // Find the best variation (usually the first one is most common)
  const bestVariation = applicatures[0]
  console.log(`✅ Using first variation for ${chordName}`)
  
  return transformSingleApplicature(bestVariation, chordName)
}

/**
 * Transform a single applicature with variations
 * 
 * @param {Object} applicature - Single UG applicature object
 * @param {string} chordName - Original chord name
 * @returns {InternalChordData|null} Transformed chord data
 */
const transformSingleApplicature = (applicature, chordName) => {
  console.log(`🔄 Processing applicature for chord: ${applicature.chord}`)
  
  if (!applicature.variations || applicature.variations.length === 0) {
    console.warn(`⚠️ No variations found in applicature for ${chordName}`)
    return createFallbackChordData(chordName, applicature)
  }
  
  // Use the first variation (most common)
  const variation = applicature.variations[0]
  console.log(`✅ Using first variation with ${Object.keys(variation).length} properties`)
  
  return transformVariation(variation, chordName, applicature)
}

/**
 * Transform a single variation to internal format
 * 
 * @param {Object} variation - Chord variation data
 * @param {string} chordName - Original chord name
 * @param {Object} applicature - Full applicature object for metadata
 * @returns {InternalChordData} Transformed chord data
 */
const transformVariation = (variation, chordName, applicature) => {
  console.log(`🔄 Transforming variation for ${chordName}`)
  
  // Extract basic chord information
  const chordInfo = analyzeChordName(chordName)
  
  // Transform the core data
  const transformedData = {
    name: chordName,
    type: chordInfo.type,
    root: chordInfo.root,
    strings: ['E', 'A', 'D', 'G', 'B', 'E'], // Standard guitar strings
    frets: transformFrets(variation.frets),
    fingering: transformFingers(variation.fingers),
    metadata: {
      source: 'ultimate_guitar',
      variation: 1,
      difficulty: determineDifficulty(variation),
      category: determineCategory(chordInfo.type),
      barre: hasBarreChord(variation.frets),
      popularity: 'high', // UG data is generally popular
      alternativeVoicings: applicature.variations.length > 1 ? applicature.variations.length - 1 : 0,
      rawData: variation, // Keep original data for debugging
      transformed: true
    }
  }
  
  console.log(`✅ Transformation complete for ${chordName}`)
  return transformedData
}

/**
 * Transform fret positions array to internal format
 * 
 * @param {Array} ugFrets - UG fret positions array
 * @returns {string[]} 6-string fret array
 */
const transformFrets = (ugFrets) => {
  if (!ugFrets || !Array.isArray(ugFrets)) {
    console.warn('⚠️ Invalid UG frets data, using defaults')
    return ['X', 'X', 'X', 'X', 'X', 'X']
  }
  
  // UG frets might be in different order or have different structure
  // We need to map them to our 6-string format
  const frets = ['X', 'X', 'X', 'X', 'X', 'X'] // Default: all muted
  
  try {
    // 🚧 PLACEHOLDER: This mapping logic needs to be refined based on actual UG output
    // For now, we'll use a basic approach
    
    if (ugFrets.length >= 6) {
      // Direct mapping if we have 6 values
      for (let i = 0; i < 6; i++) {
        const fret = ugFrets[i]
        frets[i] = fret !== null && fret !== undefined ? fret.toString() : 'X'
      }
    } else {
      // Partial mapping - this needs refinement
      console.warn('⚠️ UG frets array has less than 6 elements, partial mapping')
      for (let i = 0; i < ugFrets.length; i++) {
        const fret = ugFrets[i]
        frets[i] = fret !== null && fret !== undefined ? fret.toString() : 'X'
      }
    }
    
  } catch (error) {
    console.error('❌ Error transforming frets:', error)
  }
  
  return frets
}

/**
 * Transform finger assignments array to internal format
 * 
 * @param {Array} ugFingers - UG finger assignments array
 * @returns {string[]} 6-string finger array
 */
const transformFingers = (ugFingers) => {
  if (!ugFingers || !Array.isArray(ugFingers)) {
    console.warn('⚠️ Invalid UG fingers data, using defaults')
    return ['X', 'X', 'X', 'X', 'X', 'X']
  }
  
  const fingers = ['X', 'X', 'X', 'X', 'X', 'X'] // Default: no fingers
  
  try {
    // Similar logic to frets transformation
    if (ugFingers.length >= 6) {
      for (let i = 0; i < 6; i++) {
        const finger = ugFingers[i]
        fingers[i] = finger !== null && finger !== undefined ? finger.toString() : 'X'
      }
    } else {
      console.warn('⚠️ UG fingers array has less than 6 elements, partial mapping')
      for (let i = 0; i < ugFingers.length; i++) {
        const finger = ugFingers[i]
        fingers[i] = finger !== null && finger !== undefined ? finger.toString() : 'X'
      }
    }
    
  } catch (error) {
    console.error('❌ Error transforming fingers:', error)
  }
  
  return fingers
}

/**
 * Analyze chord name to extract root note and type
 * 
 * @param {string} chordName - Chord name (e.g., "Am", "C", "Fmaj7")
 * @returns {Object} { root: string, type: string }
 */
const analyzeChordName = (chordName) => {
  if (!chordName || typeof chordName !== 'string') {
    return { root: 'C', type: 'major' }
  }
  
  // Basic chord analysis - can be enhanced later
  const root = chordName.charAt(0)
  let type = 'major'
  
  if (chordName.includes('m') && !chordName.includes('maj')) {
    type = 'minor'
  } else if (chordName.includes('maj')) {
    type = 'major'
  } else if (chordName.includes('7')) {
    type = '7th'
  } else if (chordName.includes('dim')) {
    type = 'diminished'
  } else if (chordName.includes('aug')) {
    type = 'augmented'
  }
  
  return { root, type }
}

/**
 * Determine chord difficulty based on variation data
 * 
 * @param {Object} variation - Chord variation data
 * @returns {string} Difficulty level
 */
const determineDifficulty = (variation) => {
  // 🚧 PLACEHOLDER: This logic needs refinement based on actual UG data
  // For now, return a default difficulty
  
  if (!variation) return 'beginner'
  
  // Basic difficulty logic based on fret positions
  try {
    const frets = variation.frets || []
    const maxFret = Math.max(...frets.filter(f => f !== null && f !== undefined))
    
    if (maxFret <= 3) return 'beginner'
    if (maxFret <= 7) return 'intermediate'
    return 'advanced'
  } catch (error) {
    return 'beginner'
  }
}

/**
 * Determine chord category based on type
 * 
 * @param {string} type - Chord type
 * @returns {string} Category
 */
const determineCategory = (type) => {
  switch (type) {
    case 'minor':
    case 'major':
      return 'open_chords'
    case '7th':
    case 'maj7':
    case 'm7':
      return 'seventh_chords'
    case 'diminished':
    case 'augmented':
      return 'complex_chords'
    default:
      return 'basic_chords'
  }
}

/**
 * Check if chord has barre technique
 * 
 * @param {Array} frets - Fret positions array
 * @returns {boolean} True if barre chord
 */
const hasBarreChord = (frets) => {
  if (!frets || !Array.isArray(frets)) return false
  
  try {
    // Check for barre chord patterns
    const validFrets = frets.filter(f => f !== null && f !== undefined && f !== 'X' && f !== '0')
    
    if (validFrets.length < 3) return false
    
    // Simple barre detection: multiple strings on same fret
    const fretCounts = {}
    validFrets.forEach(fret => {
      fretCounts[fret] = (fretCounts[fret] || 0) + 1
    })
    
    // If 3+ strings on same fret, likely a barre chord
    return Object.values(fretCounts).some(count => count >= 3)
    
  } catch (error) {
    return false
  }
}

/**
 * Create fallback chord data when transformation fails
 * 
 * @param {string} chordName - Chord name
 * @param {Object} ugData - Original UG data
 * @returns {InternalChordData} Basic fallback data
 */
const createFallbackChordData = (chordName, ugData) => {
  console.log(`🔄 Creating fallback data for ${chordName}`)
  
  const chordInfo = analyzeChordName(chordName)
  
  return {
    name: chordName,
    type: chordInfo.type,
    root: chordInfo.root,
    strings: ['E', 'A', 'D', 'G', 'B', 'E'],
    frets: ['X', 'X', 'X', 'X', 'X', 'X'],
    fingering: ['X', 'X', 'X', 'X', 'X', 'X'],
    metadata: {
      source: 'ultimate_guitar_fallback',
      difficulty: 'unknown',
      category: 'unknown',
      barre: false,
      popularity: 'unknown',
      alternativeVoicings: 0,
      rawData: ugData,
      transformed: false,
      note: 'Fallback data - transformation failed'
    }
  }
}

/**
 * 🧪 Test function to verify the mapper works
 * 
 * @param {Object} testData - Test UG data
 * @param {string} chordName - Test chord name
 * @returns {Object} Test results
 */
export const testChordDataMapperUG = (testData, chordName = 'Am') => {
  console.log(`🧪 Testing Chord Data Mapper UG for: ${chordName}`)
  
  try {
    const result = transformUGDataToInternal(testData, chordName)
    
    if (result) {
      console.log('✅ Mapper test successful:', {
        chordName,
        hasData: !!result,
        fields: Object.keys(result),
        metadata: result.metadata
      })
      return { success: true, data: result }
    } else {
      console.log('❌ Mapper test failed: No data returned')
      return { success: false, error: 'No data returned' }
    }
    
  } catch (error) {
    console.error('❌ Mapper test error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 🎯 Mapper Status Check
 * Returns the current status of the data transformation
 * 
 * @returns {Object} Mapper status information
 */
export const getChordDataMapperStatus = () => {
  return {
    service: 'Chord Data Mapper UG',
    status: 'initialized',
    transformation: 'basic', // Will be 'complete' when refined
    fallbackSupport: true,
    lastUpdated: new Date().toISOString(),
    nextStep: 'Refine fret/finger mapping based on actual UG output'
  }
}
