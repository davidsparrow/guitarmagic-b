/**
 * 🎸 Ultimate Guitar Chord Data Service
 * 
 * Main service layer for Ultimate Guitar chord data integration
 * Bridges the existing chord UI with the UG scraper tool
 * 
 * Features:
 * - Ultimate Guitar scraper integration
 * - Data transformation from UG format to internal format
 * - Fallback to existing chordData.js if UG fails
 * - Caching and error handling
 */

import { generateChordData } from './chordData.js'

/**
 * Chord Data Structure (matches existing system)
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
 * 🎯 MAIN CHORD DATA SERVICE FUNCTION
 * Primary entry point for chord data requests
 * Attempts UG scraper first, falls back to existing system
 * 
 * @param {string} chordName - Chord name (e.g., "Am", "C", "F")
 * @returns {Promise<ChordData|null>} Chord data or null if not found
 */
export const getChordDataUG = async (chordName) => {
  if (!chordName || typeof chordName !== 'string') {
    console.warn('⚠️ Invalid chord name provided:', chordName)
    return null
  }

  try {
    console.log(`🎸 Fetching chord data for: ${chordName}`)
    
    // 🚀 PHASE 1: Try Ultimate Guitar scraper first
    const ugData = await fetchChordFromUG(chordName)
    
    if (ugData && ugData.success) {
      console.log(`✅ Successfully fetched ${chordName} from Ultimate Guitar`)
      return ugData.data
    }
    
    // 🔄 PHASE 2: Fallback to existing chordData.js system
    console.log(`🔄 UG scraper failed for ${chordName}, falling back to existing system`)
    const fallbackData = generateChordData(chordName)
    
    if (fallbackData) {
      console.log(`✅ Found ${chordName} in fallback system`)
      return fallbackData
    }
    
    // ❌ PHASE 3: No data found anywhere
    console.warn(`⚠️ No chord data found for ${chordName} in any system`)
    return null
    
  } catch (error) {
    console.error(`❌ Error in getChordDataUG for ${chordName}:`, error)
    
    // Emergency fallback to existing system
    try {
      const emergencyFallback = generateChordData(chordName)
      if (emergencyFallback) {
        console.log(`🆘 Emergency fallback successful for ${chordName}`)
        return emergencyFallback
      }
    } catch (fallbackError) {
      console.error(`❌ Emergency fallback also failed for ${chordName}:`, fallbackError)
    }
    
    return null
  }
}

/**
 * 🚀 Fetch chord data from Ultimate Guitar scraper
 * This will be implemented in the next step with ugScraperIntegration.js
 * 
 * @param {string} chordName - Chord name to fetch
 * @returns {Promise<Object>} Promise that resolves to UG data or error
 */
const fetchChordFromUG = async (chordName) => {
  // 🚧 PLACEHOLDER: Will be implemented in next step
  // This function will call the Go tool via ugScraperIntegration.js
  
  console.log(`🚧 fetchChordFromUG placeholder called for: ${chordName}`)
  console.log(`🚧 Next step: Implement ugScraperIntegration.js`)
  
  // Return failure to trigger fallback for now
  return {
    success: false,
    error: 'UG integration not yet implemented',
    fallbackData: null
  }
}

/**
 * 🧪 Test function to verify the service works
 * Tests both UG path and fallback path
 * 
 * @param {string} chordName - Chord name to test
 * @returns {Promise<Object>} Test results
 */
export const testChordDataServiceUG = async (chordName) => {
  console.log(`🧪 Testing Chord Data Service UG for: ${chordName}`)
  
  try {
    const startTime = Date.now()
    const result = await getChordDataUG(chordName)
    const endTime = Date.now()
    
    if (result) {
      console.log('✅ Test successful:', {
        chordName,
        dataSource: result.source || 'fallback',
        responseTime: `${endTime - startTime}ms`,
        hasData: !!result
      })
      return { success: true, data: result, responseTime: endTime - startTime }
    } else {
      console.log('❌ Test failed: No data returned')
      return { success: false, error: 'No data returned' }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all available chord names from the service
 * Combines UG data with fallback data
 * 
 * @returns {Promise<string[]>} Array of available chord names
 */
export const getAvailableChordNamesUG = async () => {
  try {
    // 🚧 PLACEHOLDER: Will be implemented when UG integration is complete
    // For now, return fallback system chord names
    
    console.log('🚧 getAvailableChordNamesUG placeholder - returning fallback names')
    
    // This would normally combine UG + fallback names
    // For now, just return some basic names
    return ['Am', 'C', 'F', 'G', 'Dm', 'Em']
    
  } catch (error) {
    console.error('❌ Error getting available chord names:', error)
    return []
  }
}

/**
 * Validate chord data structure
 * Ensures data matches expected format
 * 
 * @param {ChordData} chordData - Chord data to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateChordDataUG = (chordData) => {
  if (!chordData || typeof chordData !== 'object') {
    return false
  }

  const requiredFields = ['name', 'type', 'root', 'strings', 'fingering', 'frets']
  for (const field of requiredFields) {
    if (!chordData[field]) {
      console.warn(`⚠️ Missing required field: ${field}`)
      return false
    }
  }

  // Check that strings, fingering, and frets arrays have exactly 6 elements
  if (chordData.strings.length !== 6 || 
      chordData.fingering.length !== 6 || 
      chordData.frets.length !== 6) {
    console.warn('⚠️ Invalid array lengths - must have exactly 6 elements')
    return false
  }

  return true
}

/**
 * 🎯 Service Status Check
 * Returns the current status of the UG integration
 * 
 * @returns {Object} Service status information
 */
export const getChordDataServiceStatus = () => {
  return {
    service: 'Chord Data Service UG',
    status: 'initialized',
    ugIntegration: 'pending', // Will be 'active' when ugScraperIntegration.js is implemented
    fallbackSystem: 'active',
    lastUpdated: new Date().toISOString(),
    nextStep: 'Implement ugScraperIntegration.js'
  }
}
