/**
 * 🌐 URL Parser - Shared Module
 * 
 * Extracts Tab ID and Song Type from Ultimate Guitar URLs
 * Supports various URL formats and extracts both the numeric Tab ID and song type
 * Extracted from url_tab_id_processor.js for reuse across different processing workflows
 * 
 * @param {string} url - Ultimate Guitar URL
 * @returns {Object|null} Object with tabId and songType, or null if not found
 */

/**
 * Extract Tab ID and Song Type from Ultimate Guitar URL
 * Supports various URL formats and extracts both the numeric Tab ID and song type
 * 
 * @param {string} url - Ultimate Guitar URL
 * @returns {Object|null} Object with tabId and songType, or null if not found
 */
export function extractTabIdAndTypeFromUrl(url) {
  try {
    // Validate URL format
    if (!url || typeof url !== 'string') {
      return null
    }

    // Check if it's a valid Ultimate Guitar URL
    if (!url.includes('ultimate-guitar.com') && !url.includes('tabs.ultimate-guitar.com')) {
      return null
    }

    // Pattern 1: /tab/artist/song-type-TAB_ID (most common)
    // This captures: chords, tabs, guitar-pro, etc.
    // Look for common song types at the end of the URL
    const songTypes = ['chords', 'tabs', 'guitar-pro', 'bass', 'ukulele', 'piano']
    for (const songType of songTypes) {
      const pattern = new RegExp(`-${songType}-(\\d+)$`)
      let match = url.match(pattern)
      if (match) {
        return {
          tabId: match[1],
          songType: songType
        }
      }
    }

    // Pattern 2: /tab/TAB_ID (direct tab access - no type info)
    const pattern2 = /\/tab\/(\d+)$/
    let match = url.match(pattern2)
    if (match) {
      return {
        tabId: match[1],
        songType: 'tab' // Default to 'tab' for direct access
      }
    }

    // Pattern 3: /tab/artist/song-TAB_ID (no type specified)
    const pattern3 = /\/tab\/[^\/]+\/[^\/]+-(\d+)$/
    match = url.match(pattern3)
    if (match) {
      return {
        tabId: match[1],
        songType: 'tab' // Default to 'tab' when no type specified
      }
    }

    // Pattern 4: Query parameter ?tab=TAB_ID
    const pattern4 = /[?&]tab=(\d+)/
    match = url.match(pattern4)
    if (match) {
      return {
        tabId: match[1],
        songType: 'tab' // Default to 'tab' for query parameters
      }
    }

    // Pattern 5: URL fragment #tab-TAB_ID
    const pattern5 = /#tab-(\d+)/
    match = url.match(pattern5)
    if (match) {
      return {
        tabId: match[1],
        songType: 'tab' // Default to 'tab' for URL fragments
      }
    }

    console.log(`⚠️ Could not extract Tab ID and type from URL: ${url}`)
    return null

  } catch (error) {
    console.error(`❌ Error extracting Tab ID and type from URL: ${error.message}`)
    return null
  }
}

/**
 * Extract Tab ID from Ultimate Guitar URL (backward compatibility)
 * @deprecated Use extractTabIdAndTypeFromUrl instead
 * 
 * @param {string} url - Ultimate Guitar URL
 * @returns {string|null} Extracted Tab ID or null if not found
 */
export function extractTabIdFromUrl(url) {
  const result = extractTabIdAndTypeFromUrl(url)
  return result ? result.tabId : null
}
