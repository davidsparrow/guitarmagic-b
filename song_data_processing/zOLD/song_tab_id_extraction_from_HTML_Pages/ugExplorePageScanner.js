/**
 * 🎸 Ultimate Guitar Explore Page Scanner
 * 
 * Utility to scan Ultimate Guitar explore pages and extract song information
 * Extracts: Band name, Song title, Tab ID from song links
 * 
 * Purpose: Parse explore pages to get structured song data for further processing
 */

import https from 'https'
import { URL } from 'url'

/**
 * Configuration for the UG explore page scanner
 */
const UG_EXPLORE_CONFIG = {
  // Base URL for UG explore pages
  baseUrl: 'https://www.ultimate-guitar.com',
  
  // User agent to avoid blocking
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15',
  
  // Request timeout (30 seconds)
  timeout: 30000,
  
  // Rate limiting delay between requests (1 second)
  rateLimitDelay: 1000
}

/**
 * 🔍 MAIN FUNCTION: Scan Ultimate Guitar explore page for song links
 * 
 * @param {string} explorePageUrl - URL of the explore page to scan
 * @returns {Promise<Object>} Promise that resolves to song data or error
 */
export const scanUGExplorePage = async (explorePageUrl) => {
  if (!explorePageUrl || typeof explorePageUrl !== 'string') {
    throw new Error('Invalid explore page URL provided')
  }

  console.log(`🔍 Scanning UG explore page: ${explorePageUrl}`)

  try {
    // Fetch the explore page HTML
    const htmlContent = await fetchExplorePage(explorePageUrl)
    
    // Extract song links from the HTML
    const songLinks = extractSongLinks(htmlContent)
    
    // Parse each song link to extract band, title, and tab ID
    const songsData = parseSongLinks(songLinks)
    
    console.log(`✅ Successfully extracted data for ${songsData.length} songs`)
    
    return {
      success: true,
      explorePageUrl: explorePageUrl,
      totalSongs: songsData.length,
      songs: songsData,
      rawHtml: htmlContent, // Include raw HTML for debugging
      htmlLength: htmlContent.length,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ Failed to scan explore page:', error.message)
    throw error
  }
}

/**
 * 🌐 Fetch the explore page HTML content
 * 
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} HTML content
 */
const fetchExplorePage = (url) => {
  return new Promise((resolve, reject) => {
    console.log(`🌐 Fetching explore page: ${url}`)
    
    // Parse URL for HTTPS request
    const parsedUrl = new URL(url)
    
    // Set up request options
    const requestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': UG_EXPLORE_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    }
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      request.abort()
      reject(new Error(`Explore page request timeout after ${UG_EXPLORE_CONFIG.timeout}ms`))
    }, UG_EXPLORE_CONFIG.timeout)
    
    // Make the HTTPS request
    const request = https.request(requestOptions, (response) => {
      console.log(`📡 Response status: ${response.statusCode}`)
      
      if (response.statusCode !== 200) {
        clearTimeout(timeoutId)
        reject(new Error(`Explore page request failed with status: ${response.statusCode}`))
        return
      }
      
      let htmlData = ''
      
      response.on('data', (chunk) => {
        htmlData += chunk
      })
      
      response.on('end', () => {
        clearTimeout(timeoutId)
        console.log(`📄 Received ${htmlData.length} bytes of HTML data`)
        resolve(htmlData)
      })
    })
    
    request.on('error', (error) => {
      clearTimeout(timeoutId)
      reject(new Error(`Explore page request failed: ${error.message}`))
    })
    
    request.end()
  })
}

/**
 * 🔍 Extract song links from HTML content
 * 
 * @param {string} html - Raw HTML content
 * @returns {Array<string>} Array of song URLs
 */
const extractSongLinks = (html) => {
  console.log('🔍 Extracting song links from HTML...')
  
  // Pattern to find song links in the HTML
  // Look for links that contain /tab/ pattern
  const songLinkPattern = /href=["']([^"']*\/tab\/[^"']*)["']/g
  
  const songLinks = []
  let match
  
  // Find all song links
  while ((match = songLinkPattern.exec(html)) !== null) {
    const link = match[1]
    
    // Only include links that are actual tab URLs (not relative paths)
    if (link.includes('/tab/') && (link.startsWith('http') || link.startsWith('/'))) {
      // Convert relative URLs to absolute URLs
      const absoluteLink = link.startsWith('/') ? `https://www.ultimate-guitar.com${link}` : link
      songLinks.push(absoluteLink)
    }
  }
  
  // Remove duplicates
  const uniqueLinks = [...new Set(songLinks)]
  
  console.log(`✅ Found ${uniqueLinks.length} unique song links`)
  
  return uniqueLinks
}

/**
 * 🎯 Parse song links to extract band, title, and tab ID
 * 
 * @param {Array<string>} songLinks - Array of song URLs
 * @returns {Array<Object>} Array of parsed song data
 */
const parseSongLinks = (songLinks) => {
  console.log('🎯 Parsing song links to extract data...')
  
  const songsData = []
  
  songLinks.forEach((link, index) => {
    try {
      // Parse the URL to extract components
      const url = new URL(link)
      const pathParts = url.pathname.split('/')
      
      // Look for the tab pattern: /tab/{band}/{song-title}-{tab-id}
      const tabIndex = pathParts.findIndex(part => part === 'tab')
      
      if (tabIndex !== -1 && tabIndex + 2 < pathParts.length) {
        const band = pathParts[tabIndex + 1]
        const songWithId = pathParts[tabIndex + 2]
        
        // Extract tab ID from the end of the song title
        // Pattern: song-title-{tab-id}
        const tabIdMatch = songWithId.match(/-(\d+)$/)
        
        if (tabIdMatch) {
          const tabId = tabIdMatch[1]
          const songTitle = songWithId.replace(`-${tabId}`, '')
          
          const songData = {
            band: band,
            songTitle: songTitle,
            tabId: tabId,
            fullUrl: link,
            parsedIndex: index + 1
          }
          
          songsData.push(songData)
          console.log(`✅ Parsed song ${index + 1}: ${band} - ${songTitle} (ID: ${tabId})`)
        } else {
          console.warn(`⚠️ Could not extract tab ID from: ${songWithId}`)
        }
      } else {
        console.warn(`⚠️ Unexpected URL structure: ${link}`)
      }
      
    } catch (parseError) {
      console.warn(`⚠️ Failed to parse link ${index + 1}: ${parseError.message}`)
    }
  })
  
  console.log(`🎯 Successfully parsed ${songsData.length} songs`)
  return songsData
}

/**
 * 🧪 Test function to verify the explore page scanner works
 * 
 * @param {string} explorePageUrl - URL to test (defaults to the Pro tabs explore page)
 * @returns {Promise<Object>} Test results
 */
export const testUGExploreScanner = async (explorePageUrl = 'https://www.ultimate-guitar.com/explore?order=hitstotal_desc&type[]=Pro') => {
  console.log(`🧪 Testing UG Explore Page Scanner with URL: ${explorePageUrl}`)
  
  try {
    const startTime = Date.now()
    const results = await scanUGExplorePage(explorePageUrl)
    const endTime = Date.now()
    
    console.log('✅ Test successful:', {
      explorePageUrl,
      responseTime: `${endTime - startTime}ms`,
      totalSongs: results.totalSongs,
      hasSongData: results.songs && results.songs.length > 0
    })
    
    // Show first few songs as sample
    if (results.songs && results.songs.length > 0) {
      console.log('\n📋 Sample songs found:')
      results.songs.slice(0, 5).forEach((song, index) => {
        console.log(`  ${index + 1}. ${song.band} - ${song.songTitle} (ID: ${song.tabId})`)
      })
    }
    
    return { success: true, results, responseTime: endTime - startTime }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 🎯 Scanner Status Check
 * Returns the current status of the UG explore page scanner
 * 
 * @returns {Object} Scanner status information
 */
export const getUGExploreScannerStatus = () => {
  return {
    service: 'UG Explore Page Scanner',
    status: 'ready',
    purpose: 'Extract song data from Ultimate Guitar explore pages',
    capabilities: [
      'Scan explore page HTML',
      'Extract song links',
      'Parse band names, song titles, and tab IDs',
      'Return structured JSON data'
    ],
    baseUrl: UG_EXPLORE_CONFIG.baseUrl,
    timeout: UG_EXPLORE_CONFIG.timeout,
    lastUpdated: new Date().toISOString()
  }
}

/**
 * 📊 Get statistics about the scanner's capabilities
 * 
 * @returns {Object} Scanner statistics
 */
export const getUGExploreScannerStats = () => {
  return {
    maxSongsPerPage: '50+ (based on typical explore page layout)',
    supportedUrlPatterns: [
      '/tab/{band}/{song-title}-{tab-id}',
      'https://tabs.ultimate-guitar.com/tab/{band}/{song-title}-{tab-id}'
    ],
    dataExtraction: {
      band: 'string',
      songTitle: 'string', 
      tabId: 'string',
      fullUrl: 'string',
      parsedIndex: 'number'
    },
    outputFormat: 'JSON with songs array'
  }
}
