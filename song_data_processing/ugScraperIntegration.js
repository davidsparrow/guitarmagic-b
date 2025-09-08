/**
 * 🎸 Ultimate Guitar Scraper Integration
 * 
 * Direct integration with the Go scraper tool executable
 * Spawns the Go process and manages communication
 * 
 * Features:
 * - Subprocess management for Go tool
 * - Command execution with proper parameters
 * - JSON output parsing
 * - Error handling and timeout management
 * - Logging and debugging support
 * - Song search functionality
 */

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Configuration for the UG scraper integration
 */
const UG_SCRAPER_CONFIG = {
  // Path to the Go executable (relative path from song_data_processing directory)
  executablePath: path.join(__dirname, '../ultimate-guitar-scraper-setup/ultimate-guitar-scraper/ultimate-guitar-scraper'),
  
  // Default timeout for scraper calls (30 seconds)
  defaultTimeout: 30000,
  
  // Maximum retry attempts
  maxRetries: 2,
  
  // Delay between retries (1 second)
  retryDelay: 1000,
  
  // Environment variables for the Go process
  env: {
    ...process.env,
    // Add any specific environment variables needed by the Go tool
  }
}

/**
 * 🚀 MAIN FUNCTION: Call Ultimate Guitar scraper for song data
 * 
 * @param {number|string} tabId - Ultimate Guitar tab ID to fetch
 * @param {Object} options - Optional configuration
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.retries - Number of retry attempts
 * @returns {Promise<Object>} Promise that resolves to song data or error
 */
export const callUGScraper = async (tabId, options = {}) => {
  if (!tabId || (typeof tabId !== 'string' && typeof tabId !== 'number')) {
    throw new Error('Invalid tab ID provided')
  }

  const config = {
    timeout: options.timeout || UG_SCRAPER_CONFIG.defaultTimeout,
    retries: options.retries || UG_SCRAPER_CONFIG.maxRetries,
    retryDelay: options.retryDelay || UG_SCRAPER_CONFIG.retryDelay
  }

  console.log(`🎸 Calling UG scraper for tab ID: ${tabId}`)
  console.log(`⚙️ Configuration:`, config)

  let lastError = null
  
  // Retry loop
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${config.retries}`)
      
      const result = await executeUGScraper(tabId, config.timeout)
      
      if (result.success) {
        console.log(`✅ UG scraper successful on attempt ${attempt}`)
        return result
      } else {
        lastError = new Error(result.error || 'UG scraper failed')
        console.warn(`⚠️ Attempt ${attempt} failed:`, lastError.message)
      }
      
    } catch (error) {
      lastError = error
      console.error(`❌ Attempt ${attempt} error:`, error.message)
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < config.retries) {
        console.log(`⏳ Waiting ${config.retryDelay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, config.retryDelay))
      }
    }
  }

  // All retries failed
  console.error(`❌ All ${config.retries} attempts failed for tab ID: ${tabId}`)
  throw lastError || new Error('UG scraper failed after all retries')
}

/**
 * 🔍 NEW FUNCTION: Search for songs by name/artist
 * 
 * @param {string} query - Search query (e.g., "Hotel California Eagles")
 * @param {Object} options - Optional configuration
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.retries - Number of retry attempts
 * @returns {Promise<Object>} Promise that resolves to search results or error
 */
export const searchSongs = async (query, options = {}) => {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Invalid search query provided')
  }

  const config = {
    timeout: options.timeout || UG_SCRAPER_CONFIG.defaultTimeout,
    retries: options.retries || UG_SCRAPER_CONFIG.maxRetries,
    retryDelay: options.retryDelay || UG_SCRAPER_CONFIG.retryDelay
  }

  console.log(`🔍 Searching UG for: "${query}"`)
  console.log(`⚙️ Configuration:`, config)

  let lastError = null
  
  // Retry loop
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      console.log(`🔄 Search attempt ${attempt}/${config.retries}`)
      
      const result = await executeUGSearch(query, config.timeout)
      
      if (result.success) {
        console.log(`✅ UG search successful on attempt ${attempt}`)
        return result
      } else {
        lastError = new Error(result.error || 'UG search failed')
        console.warn(`⚠️ Search attempt ${attempt} failed:`, lastError.message)
      }
      
    } catch (error) {
      lastError = error
      console.error(`❌ Search attempt ${attempt} error:`, error.message)
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < config.retries) {
        console.log(`⏳ Waiting ${config.retryDelay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, config.retryDelay))
      }
    }
  }

  // All retries failed
  console.error(`❌ All ${config.retries} search attempts failed for query: "${query}"`)
  throw lastError || new Error('UG search failed after all retries')
}

/**
 * Execute the UG scraper with timeout and error handling
 * 
 * @param {number|string} tabId - Ultimate Guitar tab ID to fetch
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} Promise that resolves to result or error
 */
const executeUGScraper = (tabId, timeout) => {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Executing UG scraper for tab ID: ${tabId}`)
    
    // Build the command and arguments
    const command = path.resolve(UG_SCRAPER_CONFIG.executablePath)
    const args = buildScraperArgs(tabId)
    
    console.log(`📋 Command: ${command}`)
    console.log(`📋 Args:`, args)
    
    // Spawn the Go process
    const scraperProcess = spawn(command, args, {
      env: UG_SCRAPER_CONFIG.env,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let stdout = ''
    let stderr = ''
    let processKilled = false
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (!processKilled) {
        processKilled = true
        scraperProcess.kill('SIGTERM')
        reject(new Error(`UG scraper timeout after ${timeout}ms`))
      }
    }, timeout)
    
    // Handle stdout (data output)
    scraperProcess.stdout.on('data', (data) => {
      stdout += data.toString()
      console.log(`📤 UG scraper stdout:`, data.toString().trim())
    })
    
    // Handle stderr (error output)
    scraperProcess.stderr.on('data', (data) => {
      stderr += data.toString()
      console.warn(`⚠️ UG scraper stderr:`, data.toString().trim())
    })
    
    // Handle process completion
    scraperProcess.on('close', (code) => {
      clearTimeout(timeoutId)
      
      if (processKilled) {
        return // Already handled by timeout
      }
      
      console.log(`🏁 UG scraper process closed with code: ${code}`)
      
      if (code === 0) {
        // Process completed successfully
        try {
          const parsedData = parseScraperOutput(stdout, tabId)
          resolve({
            success: true,
            data: parsedData,
            rawOutput: stdout,
            processCode: code
          })
        } catch (parseError) {
          reject(new Error(`Failed to parse UG scraper output: ${parseError.message}`))
        }
      } else {
        // Process failed
        const errorMessage = stderr || `Process exited with code ${code}`
        reject(new Error(`UG scraper failed: ${errorMessage}`))
      }
    })
    
    // Handle process errors
    scraperProcess.on('error', (error) => {
      clearTimeout(timeoutId)
      if (!processKilled) {
        reject(new Error(`Failed to start UG scraper: ${error.message}`))
      }
    })
  })
}

/**
 * Execute the UG scraper's search command with timeout and error handling
 * 
 * @param {string} query - Search query (e.g., "Hotel California Eagles")
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} Promise that resolves to search results or error
 */
const executeUGSearch = (query, timeout) => {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Executing UG search for query: "${query}"`)
    
    // Build the command and arguments
    const command = path.resolve(UG_SCRAPER_CONFIG.executablePath)
    const args = buildSearchArgs(query)
    
    console.log(`📋 Command: ${command}`)
    console.log(`📋 Args:`, args)
    
    // Spawn the Go process
    const searchProcess = spawn(command, args, {
      env: UG_SCRAPER_CONFIG.env,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let stdout = ''
    let stderr = ''
    let processKilled = false
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (!processKilled) {
        processKilled = true
        searchProcess.kill('SIGTERM')
        reject(new Error(`UG search timeout after ${timeout}ms`))
      }
    }, timeout)
    
    // Handle stdout (data output)
    searchProcess.stdout.on('data', (data) => {
      stdout += data.toString()
      console.log(`📤 UG search stdout:`, data.toString().trim())
    })
    
    // Handle stderr (error output)
    searchProcess.stderr.on('data', (data) => {
      stderr += data.toString()
      console.warn(`⚠️ UG search stderr:`, data.toString().trim())
    })
    
    // Handle process completion
    searchProcess.on('close', (code) => {
      clearTimeout(timeoutId)
      
      if (processKilled) {
        return // Already handled by timeout
      }
      
      console.log(`🏁 UG search process closed with code: ${code}`)
      
      if (code === 0) {
        // Process completed successfully
        try {
          const parsedData = parseSearchOutput(stdout, query)
          resolve({
            success: true,
            data: parsedData,
            rawOutput: stdout,
            processCode: code
          })
        } catch (parseError) {
          reject(new Error(`Failed to parse UG search output: ${parseError.message}`))
        }
      } else {
        // Process failed
        const errorMessage = stderr || `Process exited with code ${code}`
        reject(new Error(`UG search failed: ${errorMessage}`))
      }
    })
    
    // Handle process errors
    searchProcess.on('error', (error) => {
      clearTimeout(timeoutId)
      if (!processKilled) {
        reject(new Error(`Failed to start UG search: ${error.message}`))
      }
    })
  })
}

/**
 * Build command line arguments for the UG scraper
 * Based on the Go tool's actual command structure
 * 
 * @param {number|string} tabId - Ultimate Guitar tab ID to fetch
 * @returns {string[]} Array of command line arguments
 */
const buildScraperArgs = (tabId) => {
  // Based on the Go tool's actual export command structure
  // The tool expects: ./ultimate-guitar-scraper export -id {tabId}
  // This returns rich HTML with timing markers and section information
  
  return [
    'export',                        // Command: export song data as HTML
    '-id', tabId.toString()          // Tab ID to export
  ]
}

/**
 * Build command line arguments for the UG scraper's search command
 * Based on the Go tool's actual command structure
 * 
 * @param {string} query - Search query (e.g., "Hotel California Eagles")
 * @returns {string[]} Array of command line arguments
 */
const buildSearchArgs = (query) => {
  // Based on the Go tool's actual search command structure
  // The tool expects: ./ultimate-guitar-scraper search -query "Hotel California Eagles"
  
  return [
    'search',                        // Command: search songs
    '-query', query                  // Search query
  ]
}

/**
 * Parse the output from the UG scraper
 * Converts the raw output to structured song data
 * 
 * @param {string} output - Raw output from the Go tool
 * @param {number|string} tabId - Original tab ID requested
 * @returns {Object} Parsed song data in internal format
 */
const parseScraperOutput = (output, tabId) => {
  console.log(`🔍 Parsing UG scraper output for tab ID: ${tabId}`)
  console.log(`📄 Raw output length:`, output.length)
  
  // 💾 Save raw HTML output to file for inspection
  try {
    const outputDir = path.join(__dirname, 'song_raw_html')
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
      console.log(`📁 Created directory: song_raw_html`)
    }
    
    const filename = `song_raw_output_${tabId}.html`
    const filepath = path.join(outputDir, filename)
    fs.writeFileSync(filepath, output, 'utf8')
    console.log(`💾 Raw HTML output saved to: song_raw_html/${filename}`)
    
    // 🧹 Create clean HTML version (title + lyrics only, no footer)
    const cleanHtml = createCleanHtmlOutput(output)
    if (cleanHtml) {
      const cleanFilename = `song_clean_output_${tabId}.html`
      const cleanFilepath = path.join(outputDir, cleanFilename)
      fs.writeFileSync(cleanFilepath, cleanHtml, 'utf8')
      console.log(`🧹 Clean HTML output saved to: song_raw_html/${cleanFilename}`)
    }
  } catch (fileError) {
    console.warn(`⚠️ Failed to save raw HTML output: ${fileError.message}`)
  }
  
  // 🔍 Validate HTML completeness for raw HTML UI
  const isHtmlComplete = validateHtmlCompleteness(output)
  
  // Since we're now using the 'export' command, we get HTML output
  // The HTML contains rich data with timing markers and section information
  console.log(`✅ Parsing HTML output from export command`)
  
  // Parse HTML output to extract rich song data
  const parsedData = parseHTMLOutput(output, tabId)
  
  // Add HTML completeness flag to parsed data
  parsedData.hasRawHtml = isHtmlComplete
  
  return parsedData
}

/**
 * Parse the output from the UG scraper's search command
 * Converts the raw output to structured search results
 * 
 * @param {string} output - Raw output from the Go tool
 * @param {string} query - Original search query
 * @returns {Object} Parsed search results in internal format
 */
const parseSearchOutput = (output, query) => {
  console.log(`🔍 Parsing UG search output for query: "${query}"`)
  console.log(`📄 Raw output length:`, output.length)
  
  try {
    // Try to parse as JSON first
    const jsonData = JSON.parse(output.trim())
    console.log(`✅ Successfully parsed JSON output`)
    
    // Transform UG format to internal format
    return transformUGSearchDataToInternal(jsonData, query)
    
  } catch (jsonError) {
    console.warn(`⚠️ Failed to parse as JSON, trying text parsing:`, jsonError.message)
    
    // Fallback to text parsing if JSON fails
    return parseTextSearchOutput(output, query)
  }
}

/**
 * Transform UG data format to internal song data format
 * 
 * @param {Object} ugData - Data from Ultimate Guitar
 * @param {number|string} tabId - Original tab ID
 * @returns {Object} Internal song data format
 */
const transformUGDataToInternal = (ugData, tabId) => {
  console.log(`🔄 Transforming UG data to internal song format`)
  
  // 🚧 PLACEHOLDER: This will be implemented in the next step
  // For now, return a basic structure that indicates transformation is needed
  
  return {
    tabId: tabId,
    type: 'song_data', // Will be determined from UG data
    source: 'ultimate_guitar',
    rawData: ugData,
    transformed: false, // Flag indicating this needs proper transformation
    note: 'Song data transformation not yet implemented'
  }
}

/**
 * Transform UG search data format to internal search results format
 * 
 * @param {Object} ugData - Data from Ultimate Guitar
 * @param {string} query - Original search query
 * @returns {Object} Internal search results format
 */
const transformUGSearchDataToInternal = (ugData, query) => {
  console.log(`🔄 Transforming UG search data to internal search results format`)
  
  // 🚧 PLACEHOLDER: This will be implemented in the next step
  // For now, return a basic structure that indicates transformation is needed
  
  return {
    query: query,
    type: 'search_results', // Will be determined from UG data
    source: 'ultimate_guitar',
    rawData: ugData,
    transformed: false, // Flag indicating this needs proper transformation
    note: 'Search results transformation not yet implemented'
  }
}

/**
 * Parse HTML output from the export command
 * Extracts rich song data including timing markers and section information
 * 
 * @param {string} output - Raw HTML output from export command
 * @param {number|string} tabId - Original tab ID
 * @returns {Object} Rich song data structure
 */
const parseHTMLOutput = (output, tabId) => {
  console.log(`🔍 Parsing HTML output for rich song data`)
  
  try {
    // Extract song title and artist from HTML
    const titleMatch = output.match(/<title>([^<]+)<\/title>/)
    let title = titleMatch ? titleMatch[1].trim() : 'Unknown Title'
    
    // Extract artist from title (usually "Song Title by Artist")
    let artist = 'Unknown Artist'
    if (title.includes(' by ')) {
      const parts = title.split(' by ')
      if (parts.length >= 2) {
        // The title is everything before "by", the artist is everything after
        const songTitle = parts[0].trim()
        artist = parts.slice(1).join(' by ').trim() // Handle cases where artist name contains "by"
        
        // Update title to be just the song name
        title = songTitle
      }
    }
    
    // Extract timing markers and section information
    const timingMarkers = []
    const sections = []
    const lines = output.split('\n')
    
    for (const line of lines) {
      // Look for timing markers (e.g., "1:34", "2:42")
      const timingMatch = line.match(/(\d+:\d+)/)
      if (timingMatch) {
        const time = timingMatch[1]
        const sectionText = line.trim()
        
        // Extract section label if present
        let sectionLabel = ''
        if (line.includes('Guitar Solo')) sectionLabel = 'Guitar Solo'
        else if (line.includes('Bass Out')) sectionLabel = 'Bass Out'
        else if (line.includes('Organ, Violins')) sectionLabel = 'Organ, Violins'
        else if (line.includes('Drums')) sectionLabel = 'Drums'
        else if (line.includes('Organ, Guitar')) sectionLabel = 'Organ, Guitar'
        
        timingMarkers.push(time)
        
        if (sectionLabel) {
          sections.push({
            time: time,
            label: sectionLabel,
            type: determineSectionType(sectionLabel)
          })
        }
      }
      
      // Look for repeat instructions (e.g., "2x", "6x")
      const repeatMatch = line.match(/(\d+)x/)
      if (repeatMatch) {
        const repeatCount = parseInt(repeatMatch[1], 10)
        sections.push({
          time: timingMarkers[timingMarkers.length - 1] || '0:00',
          label: `Repeat ${repeatCount}x`,
          type: 'repeat',
          repeatCount: repeatCount
        })
      }
      
      // Look for section labels in brackets (e.g., [Verse], [Chorus], [Intro])
      const sectionMatch = line.match(/\[([^\]]+)\]/)
      if (sectionMatch) {
        const sectionName = sectionMatch[1].trim()
        const sectionType = determineSectionType(sectionName)
        
        // Find the closest timing marker for this section
        let sectionTime = '0:00'
        for (let i = lines.indexOf(line) - 1; i >= 0; i--) {
          const prevLine = lines[i].trim()
          const prevTimingMatch = prevLine.match(/(\d+:\d+)/)
          if (prevTimingMatch) {
            sectionTime = prevTimingMatch[1]
            break
          }
        }
        
        sections.push({
          time: sectionTime,
          label: sectionName,
          type: sectionType
        })
        
        console.log(`🎯 Found section: ${sectionName} (${sectionType}) at ${sectionTime}`)
      }
    }
    
    // Extract tab content
    const tabContentMatch = output.match(/<pre>([\s\S]*?)<\/pre>/)
    const tabContent = tabContentMatch ? tabContentMatch[1].trim() : ''
    
    return {
      tabId: tabId,
      type: 'rich_song_data',
      source: 'ultimate_guitar_html',
      title: title,
      artist: artist,
      timingMarkers: [...new Set(timingMarkers)].sort(),
      sections: sections,
      tabContent: tabContent,
      rawHTML: output,
      parsed: true,
      note: 'Rich HTML data parsed with timing markers and sections'
    }
    
  } catch (error) {
    console.error('❌ Error parsing HTML output:', error.message)
    return {
      tabId: tabId,
      type: 'parse_error',
      source: 'ultimate_guitar_html',
      error: error.message,
      rawHTML: output,
      parsed: false
    }
  }
}

/**
 * Determine section type based on label
 * 
 * @param {string} label - Section label
 * @returns {string} Section type
 */
const determineSectionType = (label) => {
  const lowerLabel = label.toLowerCase()
  
  if (lowerLabel.includes('solo')) return 'solo'
  if (lowerLabel.includes('bass')) return 'bass'
  if (lowerLabel.includes('guitar')) return 'guitar'
  if (lowerLabel.includes('organ')) return 'instrumental'
  if (lowerLabel.includes('drums')) return 'drums'
  if (lowerLabel.includes('repeat')) return 'repeat'
  if (lowerLabel.includes('intro')) return 'intro'
  if (lowerLabel.includes('verse')) return 'verse'
  if (lowerLabel.includes('chorus')) return 'chorus'
  if (lowerLabel.includes('bridge')) return 'bridge'
  if (lowerLabel.includes('outro')) return 'outro'
  if (lowerLabel.includes('instrumental')) return 'instrumental'
  
  return 'section'
}

/**
 * Parse text output if JSON parsing fails
 * Fallback parsing method for song data
 * 
 * @param {string} output - Raw text output
 * @param {number|string} tabId - Original tab ID
 * @returns {Object} Basic song data structure
 */
const parseTextOutput = (output, tabId) => {
  console.log(`📝 Parsing text output as fallback for song data`)
  
  // Parse the text output to extract basic song information
  const lines = output.split('\n')
  let songInfo = {
    tabId: tabId,
    type: 'song_data',
    source: 'ultimate_guitar_text',
    rawOutput: output,
    parsed: true
  }
  
  // Extract song name and artist from the header
  for (const line of lines) {
    if (line.includes('Song name:')) {
      const match = line.match(/Song name:\s*(.+?)\s+by\s+(.+)/)
      if (match) {
        songInfo.title = match[1].trim()
        songInfo.artist = match[2].trim()
      }
      break
    }
  }
  
  // Extract timing markers (e.g., "1:34", "2:42")
  const timingMarkers = []
  const timingRegex = /(\d+:\d+)/g
  for (const line of lines) {
    const matches = line.match(timingRegex)
    if (matches) {
      timingMarkers.push(...matches)
    }
  }
  
  songInfo.timingMarkers = [...new Set(timingMarkers)].sort()
  songInfo.note = 'Basic text parsing completed - needs enhancement'
  
  return songInfo
}

/**
 * Parse text output if JSON parsing fails for search
 * Fallback parsing method for search results
 * 
 * @param {string} output - Raw text output
 * @param {string} query - Original search query
 * @returns {Object} Basic search results structure
 */
const parseTextSearchOutput = (output, query) => {
  console.log(`📝 Parsing text output as fallback for search results`)
  
  // Parse the text output to extract basic search information
  const lines = output.split('\n')
  let searchInfo = {
    query: query,
    type: 'search_results',
    source: 'ultimate_guitar_text',
    rawOutput: output,
    parsed: true
  }
  
  // Extract search results count
  for (const line of lines) {
    if (line.includes('Found')) {
      const match = line.match(/Found\s+(\d+)\s+results/)
      if (match) {
        searchInfo.totalResults = parseInt(match[1], 10)
      }
      break
    }
  }
  
  // Extract song names and artists from the results
  const results = []
  let currentResult = {}
  for (const line of lines) {
    if (line.includes('Song name:')) {
      if (Object.keys(currentResult).length > 0) {
        results.push(currentResult)
        currentResult = {}
      }
      const match = line.match(/Song name:\s*(.+?)\s+by\s+(.+)/)
      if (match) {
        currentResult.title = match[1].trim()
        currentResult.artist = match[2].trim()
      }
    }
  }
  if (Object.keys(currentResult).length > 0) {
    results.push(currentResult)
  }
  
  searchInfo.results = results
  searchInfo.note = 'Basic text parsing completed - needs enhancement'
  
  return searchInfo
}

/**
 * 🧪 Test function to verify the integration works
 * 
 * @param {number|string} tabId - Ultimate Guitar tab ID to test
 * @returns {Promise<Object>} Test results
 */
export const testUGScraperIntegration = async (tabId = 100) => {
  console.log(`🧪 Testing UG Scraper Integration for tab ID: ${tabId}`)
  
  try {
    const startTime = Date.now()
    const result = await callUGScraper(tabId, { timeout: 10000, retries: 1 })
    const endTime = Date.now()
    
    console.log('✅ Test successful:', {
      tabId,
      responseTime: `${endTime - startTime}ms`,
      hasData: !!result.data,
      processCode: result.processCode
    })
    
    return { success: true, result, responseTime: endTime - startTime }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 🎯 Integration Status Check
 * Returns the current status of the UG scraper integration
 * 
 * @returns {Object} Integration status information
 */
export const getUGScraperStatus = () => {
  return {
    service: 'UG Scraper Integration',
    status: 'updated_for_rich_html_data',
    command: 'export', // Now using export command for rich HTML data
    executablePath: UG_SCRAPER_CONFIG.executablePath,
    executableExists: false, // Will be checked at runtime
    timeout: UG_SCRAPER_CONFIG.defaultTimeout,
    maxRetries: UG_SCRAPER_CONFIG.maxRetries,
    lastUpdated: new Date().toISOString(),
    nextStep: 'Test with real tab IDs to verify rich HTML data retrieval with timing markers'
  }
}

/**
 * 🔍 Validate HTML completeness for raw HTML UI
 * Checks if the HTML content contains sufficient song data
 * 
 * @param {string} htmlContent - Raw HTML output from UG scraper
 * @returns {boolean} True if HTML is complete and suitable for UI display
 */
const validateHtmlCompleteness = (htmlContent) => {
  console.log(`🔍 Validating HTML completeness for raw HTML UI`)
  
  const checks = [
    {
      name: 'Minimum Content Length',
      condition: htmlContent.length > 1000,
      description: 'HTML must be at least 1000 characters'
    },
    {
      name: 'Chord Definitions Section',
      condition: htmlContent.includes('chords-used') && htmlContent.includes('<div class="'),
      description: 'Must have chord definitions section (with any CSS classes)'
    },
    {
      name: 'Chord Progressions',
      condition: htmlContent.includes('<span class="chord">'),
      description: 'Must have chord progression elements'
    },
    {
      name: 'Song Title',
      condition: htmlContent.includes('<title>') && htmlContent.includes('Chords'),
      description: 'Must have title with song information'
    },
    {
      name: 'Tab Content Section',
      condition: htmlContent.includes('tab-content') && htmlContent.includes('<div class="'),
      description: 'Must have tab content section (with any CSS classes)'
    }
  ]
  
  const results = checks.map(check => ({
    ...check,
    passed: check.condition
  }))
  
  const passedChecks = results.filter(check => check.passed)
  const failedChecks = results.filter(check => !check.passed)
  
  console.log(`📊 HTML Validation Results:`)
  console.log(`✅ Passed: ${passedChecks.length}/${checks.length}`)
  
  if (failedChecks.length > 0) {
    console.log(`❌ Failed checks:`)
    failedChecks.forEach(check => {
      console.log(`   - ${check.name}: ${check.description}`)
    })
  }
  
  const isComplete = passedChecks.length === checks.length
  
  console.log(`🎯 HTML Completeness: ${isComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`)
  
  return isComplete
}

/**
 * 🧹 Create clean HTML output for UI display
 * Extracts title and lyrics content, removes footer and unnecessary elements
 * 
 * @param {string} rawHtml - Raw HTML output from UG scraper
 * @returns {string|null} Clean HTML content for UI display
 */
const createCleanHtmlOutput = (rawHtml) => {
  try {
    console.log(`🧹 Creating clean HTML output for UI display`)
    
    // Find the boundaries for clean content
    const tabContentStart = rawHtml.indexOf('<div class="tab-content')
    const footerStart = rawHtml.indexOf('<div class="mt-4">Sourced from:')
    
    if (tabContentStart === -1) {
      console.warn(`⚠️ Could not find tab-content boundary in HTML`)
      return null
    }
    
    // Extract the title section (from start to tab-content)
    const titleSection = rawHtml.substring(0, tabContentStart)
    
    // Extract the lyrics content (from tab-content to footer or end)
    let lyricsSection
    if (footerStart !== -1) {
      lyricsSection = rawHtml.substring(tabContentStart, footerStart)
    } else {
      lyricsSection = rawHtml.substring(tabContentStart)
    }
    
    // Create clean HTML structure
    const cleanHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clean Song Content</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 20px; 
      background: #f5f5f5; 
    }
    .song-container { 
      max-width: 800px; 
      margin: 0 auto; 
      background: white; 
      padding: 20px; 
      border-radius: 8px; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
    }
    .song-title { 
      text-align: center; 
      margin-bottom: 30px; 
      color: #333; 
    }
    .chord { 
      color: #e74c3c; 
      font-weight: bold; 
    }
    .gtab { 
      margin: 8px 0; 
      line-height: 1.6; 
      font-family: monospace; 
    }
    pre { 
      white-space: pre-wrap; 
      font-family: inherit; 
    }
  </style>
</head>
<body>
  <div class="song-container">
    ${titleSection}
    ${lyricsSection}
  </div>
</body>
</html>`
    
    console.log(`✅ Clean HTML created successfully`)
    return cleanHtml
    
  } catch (error) {
    console.error('❌ Error creating clean HTML:', error)
    return null
  }
}
