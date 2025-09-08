/**
 * 🌐 Ultimate Guitar Web Scraper
 * 
 * Web scraping utility for Ultimate Guitar search pages
 * Fetches search results and extracts tab information
 * 
 * Features:
 * - Direct HTTP requests to UG search pages
 * - HTML parsing for search results
 * - Tab ID extraction and structured results
 * - Error handling and rate limiting
 */

import https from 'https'
import { URL } from 'url'
import { gunzip } from 'zlib'
import { promisify } from 'util'

// Promisify gunzip for async/await usage
const gunzipAsync = promisify(gunzip)

/**
 * 🔓 Decode Quoted-Printable content
 * 
 * @param {string} text - QP-encoded text
 * @returns {string} Decoded text
 */
const decodeQuotedPrintable = (text) => {
  try {
    // Replace =XX patterns with their hex equivalents
    return text.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })
  } catch (error) {
    console.warn('⚠️ QP decoding failed:', error.message)
    return text // Return original if decoding fails
  }
}

/**
 * Configuration for the UG web scraper
 */
const UG_SCRAPER_CONFIG = {
  // Base URL for UG search
  baseUrl: 'https://www.ultimate-guitar.com',
  
  // Search endpoints (the working one!)
  searchEndpoint: '/search.php', // Legacy - corrupted data
  exploreEndpoint: '/explore',   // Working - clean JSON data
  
  // User agent to avoid blocking
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15',
  
  // Request timeout (30 seconds)
  timeout: 30000,
  
  // Rate limiting delay between requests (2 seconds)
  rateLimitDelay: 2000,
  
  // Maximum retry attempts
  maxRetries: 2
}

/**
 * 🔍 MAIN FUNCTION: Search Ultimate Guitar for songs
 * 
 * @param {string} query - Search query (e.g., "Hotel California Eagles")
 * @param {Object} options - Optional configuration
 * @param {number} options.timeout - Request timeout in milliseconds
 * @param {number} options.retries - Number of retry attempts
 * @returns {Promise<Object>} Promise that resolves to search results or error
 */
export const searchUGWeb = async (query, options = {}) => {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Invalid search query provided')
  }

  const config = {
    timeout: options.timeout || UG_SCRAPER_CONFIG.timeout,
    retries: options.retries || UG_SCRAPER_CONFIG.maxRetries,
    strategy: options.strategy || 'default'
  }

  console.log(`🔍 Searching UG web for: "${query}"`)
  console.log(`⚙️ Configuration:`, config)

  let lastError = null
  
  // Retry loop
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      console.log(`🔄 Search attempt ${attempt}/${config.retries}`)
      
      const results = await fetchUGSearchPage(query, config.timeout, config.strategy)
      
      if (results && results.success) {
        console.log(`✅ UG web search successful on attempt ${attempt}`)
        return results
      } else {
        lastError = new Error(results?.error || 'UG web search failed')
        console.warn(`⚠️ Search attempt ${attempt} failed:`, lastError.message)
      }
      
    } catch (error) {
      lastError = error
      console.error(`❌ Search attempt ${attempt} error:`, error.message)
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < config.retries) {
        console.log(`⏳ Waiting ${UG_SCRAPER_CONFIG.rateLimitDelay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, UG_SCRAPER_CONFIG.rateLimitDelay))
      }
    }
  }

  // All retries failed
  console.error(`❌ All ${config.retries} search attempts failed for query: "${query}"`)
  throw lastError || new Error('UG web search failed after all retries')
}

/**
 * 🌐 Fetch UG search page and extract results
 * 
 * @param {string} query - Search query
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<Object>} Promise that resolves to search results
 */
const fetchUGSearchPage = (query, timeout, strategy = 'default') => {
  return new Promise((resolve, reject) => {
    console.log(`🌐 Fetching UG search page for: "${query}"`)
    
    // Build search URL
    const searchUrl = buildSearchUrl(query, strategy)
    console.log(`📋 Search URL: ${searchUrl}`)
    
    // Parse URL for HTTPS request
    const url = new URL(searchUrl)
    
    // Set up request options
    const requestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': UG_SCRAPER_CONFIG.userAgent,
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
      reject(new Error(`UG search request timeout after ${timeout}ms`))
    }, timeout)
    
    // Make the HTTPS request
    const request = https.request(requestOptions, (response) => {
      console.log(`📡 Response status: ${response.statusCode}`)
      console.log(`📡 Response headers:`, response.headers)
      
      if (response.statusCode !== 200) {
        clearTimeout(timeoutId)
        reject(new Error(`UG search failed with status: ${response.statusCode}`))
        return
      }
      
      let htmlData = ''
      
      response.on('data', (chunk) => {
        htmlData += chunk
      })
      
      response.on('end', async () => {
        clearTimeout(timeoutId)
        console.log(`📄 Received ${htmlData.length} bytes of HTML data`)
        
        try {
          // 🔧 Handle GZIP decompression if needed
          let decompressedHtml = htmlData
          const contentEncoding = response.headers['content-encoding']
          
          if (contentEncoding === 'gzip') {
            console.log('🔧 Attempting GZIP decompression...')
            console.log(`🔍 Raw data type: ${typeof htmlData}`)
            console.log(`🔍 Raw data length: ${htmlData.length}`)
            console.log(`🔍 First 50 bytes: ${htmlData.substring(0, 50)}`)
            
            try {
              // Try to decompress as Buffer
              const bufferData = Buffer.from(htmlData, 'utf8')
              console.log(`🔍 Buffer length: ${bufferData.length}`)
              console.log(`🔍 Buffer first 50 bytes:`, bufferData.subarray(0, 50))
              
              decompressedHtml = await gunzipAsync(bufferData)
              console.log(`✅ GZIP decompression successful: ${decompressedHtml.length} bytes`)
            } catch (decompressError) {
              console.warn('⚠️ GZIP decompression failed:', decompressError.message)
              console.log('🔍 Trying alternative decompression methods...')
              
              // Try treating as raw buffer
              try {
                const rawBuffer = Buffer.from(htmlData)
                decompressedHtml = await gunzipAsync(rawBuffer)
                console.log(`✅ Alternative GZIP decompression successful: ${decompressedHtml.length} bytes`)
              } catch (altError) {
                console.warn('⚠️ Alternative decompression also failed:', altError.message)
                console.log('🔍 Using raw data as fallback')
                decompressedHtml = htmlData
              }
            }
          } else {
            console.log('ℹ️ No compression detected, using raw data')
          }
          
          // 🕵️‍♂️ ADVANCED DATA CORRUPTION ANALYSIS
          console.log('\n🔍 ADVANCED DATA ANALYSIS:')
          console.log('=' .repeat(50))
          
          // Try different character encodings
          const encodingAttempts = [
            { name: 'UTF-8', encoding: 'utf8' },
            { name: 'ISO-8859-1', encoding: 'latin1' },
            { name: 'Windows-1252', encoding: 'win1252' },
            { name: 'ASCII', encoding: 'ascii' }
          ]
          
          let bestDecodedData = decompressedHtml
          let bestEncoding = 'unknown'
          let bestReadability = 0
          
          for (const attempt of encodingAttempts) {
            try {
              console.log(`🔍 Trying ${attempt.name} encoding...`)
              
              // Convert to buffer and try different encoding
              const buffer = Buffer.from(htmlData)
              const decoded = buffer.toString(attempt.encoding)
              
              // Calculate readability score (ratio of printable ASCII characters)
              const printableChars = decoded.replace(/[^\x20-\x7E]/g, '').length
              const readability = printableChars / decoded.length
              
              console.log(`  📊 Readability: ${(readability * 100).toFixed(1)}% (${printableChars}/${decoded.length} chars)`)
              
              if (readability > bestReadability) {
                bestReadability = readability
                bestDecodedData = decoded
                bestEncoding = attempt.name
                console.log(`  🎯 New best encoding: ${attempt.name}`)
              }
              
              // Show sample of decoded data
              const sample = decoded.substring(0, 200).replace(/[^\x20-\x7E]/g, '?')
              console.log(`  📄 Sample: ${sample}`)
              
            } catch (encodingError) {
              console.log(`  ❌ ${attempt.name} failed: ${encodingError.message}`)
            }
          }
          
          console.log(`\n🏆 Best encoding found: ${bestEncoding} (${(bestReadability * 100).toFixed(1)}% readable)`)
          
          // Use the best decoded data
          decompressedHtml = bestDecodedData
          
          // 🔓 CHUNK 1: Try Quoted-Printable decoding
          console.log('\n🔓 Attempting Quoted-Printable decoding...')
          const qpDecoded = decodeQuotedPrintable(decompressedHtml)
          
          // Check if QP decoding made a difference
          const qpReadability = qpDecoded.replace(/[^\x20-\x7E]/g, '').length / qpDecoded.length
          console.log(`🔓 QP decoding result: ${(qpReadability * 100).toFixed(1)}% readable`)
          
          if (qpReadability > bestReadability) {
            console.log(`🎯 QP decoding improved readability! Using QP-decoded data.`)
            decompressedHtml = qpDecoded
          } else {
            console.log(`ℹ️ QP decoding didn't improve readability, using original decoded data.`)
          }
          
          // 🔐 CHUNK 2: Custom Cipher Analysis
          console.log('\n🔐 Analyzing UG custom cipher patterns...')
          console.log('=' .repeat(50))
          
          // Look for the o?= pattern and analyze what it might represent
          const oQuestionPattern = /o\?=/g
          const oQuestionMatches = decompressedHtml.match(oQuestionPattern)
          
          if (oQuestionMatches) {
            console.log(`🔍 Found ${oQuestionMatches.length} 'o?=' patterns`)
            
            // Try different substitution strategies
            const substitutionTests = [
              { name: 'Space replacement', pattern: /o\?=/g, replacement: ' ' },
              { name: 'Empty removal', pattern: /o\?=/g, replacement: '' },
              { name: 'Newline replacement', pattern: /o\?=/g, replacement: '\n' },
              { name: 'Tab replacement', pattern: /o\?=/g, replacement: '\t' }
            ]
            
            let bestSubstitution = decompressedHtml
            let bestSubstitutionScore = 0
            
            for (const test of substitutionTests) {
              const substituted = decompressedHtml.replace(test.pattern, test.replacement)
              const readability = substituted.replace(/[^\x20-\x7E]/g, '').length / substituted.length
              
              console.log(`  🔍 ${test.name}: ${(readability * 100).toFixed(1)}% readable`)
              
              if (readability > bestSubstitutionScore) {
                bestSubstitutionScore = readability
                bestSubstitution = substituted
                console.log(`    🎯 New best substitution: ${test.name}`)
              }
            }
            
            // Use the best substitution if it improved readability
            if (bestSubstitutionScore > qpReadability) {
              console.log(`🎯 Custom substitution improved readability to ${(bestSubstitutionScore * 100).toFixed(1)}%!`)
              decompressedHtml = bestSubstitution
            } else {
              console.log(`ℹ️ Custom substitution didn't improve readability, keeping QP-decoded data.`)
            }
          } else {
            console.log('ℹ️ No o?= patterns found in this data.')
          }
          
          // 🔍 CHUNK 3: Advanced Pattern Analysis
          console.log('\n🔍 Advanced Pattern Analysis...')
          console.log('=' .repeat(50))
          
          // Analyze the structure around o?= patterns
          const patternAnalysis = decompressedHtml.match(/([^o?=]*)(o\?=)([^o?=]*)/g)
          
          if (patternAnalysis && patternAnalysis.length > 0) {
            console.log(`🔍 Found ${patternAnalysis.length} pattern segments to analyze`)
            
            // Look for common patterns before and after o?=
            const beforePatterns = new Map()
            const afterPatterns = new Map()
            
            patternAnalysis.slice(0, 20).forEach((segment, index) => {
              const parts = segment.split('o?=')
              if (parts.length === 2) {
                const before = parts[0].trim()
                const after = parts[1].trim()
                
                if (before) {
                  beforePatterns.set(before, (beforePatterns.get(before) || 0) + 1)
                }
                if (after) {
                  afterPatterns.set(after, (afterPatterns.get(after) || 0) + 1)
                }
                
                if (index < 5) {
                  console.log(`  📋 Segment ${index + 1}: "${before}" |o?=| "${after}"`)
                }
              }
            })
            
            // Show most common patterns
            console.log('\n🔍 Most common patterns before o?=:')
            Array.from(beforePatterns.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .forEach(([pattern, count]) => {
                console.log(`  📊 "${pattern}": ${count} times`)
              })
            
            console.log('\n🔍 Most common patterns after o?=:')
            Array.from(afterPatterns.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .forEach(([pattern, count]) => {
                console.log(`  📊 "${pattern}": ${count} times`)
              })
            
            // Try to identify what o?= might represent
            console.log('\n🔍 Pattern Analysis Insights:')
            
            // Look for HTML-like patterns
            const htmlPatterns = decompressedHtml.match(/<[^>]*>/g)
            if (htmlPatterns) {
              console.log(`  🏷️ Found ${htmlPatterns.length} HTML-like tags`)
              const uniqueTags = [...new Set(htmlPatterns)].slice(0, 5)
              console.log(`  📋 Sample tags: ${uniqueTags.join(', ')}`)
            }
            
            // Look for potential js-store divs (even corrupted)
            const potentialJsStore = decompressedHtml.match(/js-store/g)
            if (potentialJsStore) {
              console.log(`  🎯 Found ${potentialJsStore.length} 'js-store' references!`)
            }
            
            // Look for potential data-content patterns
            const potentialDataContent = decompressedHtml.match(/data-content/g)
            if (potentialDataContent) {
              console.log(`  📄 Found ${potentialDataContent.length} 'data-content' references!`)
            }
          }
          
          // 🎯 CHUNK 4: Remove Delimiters & Find Tab IDs!
          console.log('\n🎯 Removing o?= delimiters to find Tab IDs...')
          console.log('=' .repeat(50))
          
          // Remove all o?= delimiters to reconstruct original HTML
          const cleanHtml = decompressedHtml.replace(/o\?=/g, '')
          console.log(`🔓 Removed ${decompressedHtml.match(/o\?=/g)?.length || 0} o?= delimiters`)
          
          // Check if cleaning improved readability
          const cleanReadability = cleanHtml.replace(/[^\x20-\x7E]/g, '').length / cleanHtml.length
          console.log(`📊 Clean HTML readability: ${(cleanReadability * 100).toFixed(1)}%`)
          
          // Look for js-store divs in the cleaned HTML
          const jsStorePattern = /<div class="js-store" data-content="(.+?)"><\/div>/g
          const jsStoreMatches = cleanHtml.match(jsStorePattern)
          
          if (jsStoreMatches) {
            console.log(`🎉 SUCCESS! Found ${jsStoreMatches.length} js-store divs with JSON data!`)
            console.log('🔍 This should contain the Tab IDs we need!')
          } else {
            console.log('⚠️ Still no js-store divs found after cleaning')
            
            // Look for any HTML structure that might contain tab data
            const htmlTags = cleanHtml.match(/<[^>]*>/g)
            if (htmlTags) {
              console.log(`🔍 Found ${htmlTags.length} HTML tags in cleaned data`)
              
              // Look for any patterns that might be tab-related
              const tabPatterns = ['tab', 'chord', 'guitar', 'song', 'artist']
              tabPatterns.forEach(pattern => {
                const matches = cleanHtml.match(new RegExp(pattern, 'gi'))
                if (matches) {
                  console.log(`✅ Found "${pattern}": ${matches.length} times`)
                }
              })
            }
            
            // 🔍 SHOW THE CLEANED HTML CONTENT!
            console.log('\n🔍 CLEANED HTML CONTENT ANALYSIS:')
            console.log('=' .repeat(60))
            console.log(`📄 Total cleaned HTML length: ${cleanHtml.length} characters`)
            
            // Show first 500 characters of cleaned HTML
            console.log('\n📄 First 500 characters of cleaned HTML:')
            console.log('─'.repeat(60))
            console.log(cleanHtml.substring(0, 500))
            console.log('─'.repeat(60))
            
            // Look for any numbers that might be Tab IDs
            const numberPatterns = cleanHtml.match(/\d{4,}/g)
            if (numberPatterns) {
              const uniqueNumbers = [...new Set(numberPatterns)]
              console.log(`\n🔢 Found ${uniqueNumbers.length} potential Tab ID numbers:`)
              console.log(`  📋 Sample: ${uniqueNumbers.slice(0, 10).join(', ')}`)
            }
            
            // Look for any URLs or links
            const urlPatterns = cleanHtml.match(/https?:\/\/[^\s"<>]+/g)
            if (urlPatterns) {
              const uniqueUrls = [...new Set(urlPatterns)]
              console.log(`\n🔗 Found ${uniqueUrls.length} potential URLs:`)
              console.log(`  📋 Sample: ${uniqueUrls.slice(0, 5).join('\n    ')}`)
            }
            
            // Look for any JSON-like patterns
            const jsonPatterns = cleanHtml.match(/\{[^}]*\}/g)
            if (jsonPatterns) {
              console.log(`\n📄 Found ${jsonPatterns.length} potential JSON objects:`)
              console.log(`  📋 Sample: ${jsonPatterns[0]?.substring(0, 200)}...`)
            }
          }
          
          // Use the cleaned HTML for parsing
          const searchResults = parseSearchResults(cleanHtml, query)
          resolve({
            success: true,
            query: query,
            results: searchResults,
            rawHtml: decompressedHtml.toString(),
            statusCode: response.statusCode,
            wasCompressed: contentEncoding === 'gzip'
          })
        } catch (parseError) {
          reject(new Error(`Failed to parse UG search results: ${parseError.message}`))
        }
      })
    })
    
    request.on('error', (error) => {
      clearTimeout(timeoutId)
      reject(new Error(`UG search request failed: ${error.message}`))
    })
    
    request.end()
  })
}

/**
 * 🔗 Build search URL for UG with multiple strategies
 * 
 * @param {string} query - Search query
 * @param {string} strategy - Search strategy to try
 * @returns {string} Complete search URL
 */
const buildSearchUrl = (query, strategy = 'default') => {
  const encodedQuery = encodeURIComponent(query.trim())
  
  const searchStrategies = {
    // Strategy 1: Working explore endpoint with search query (based on Perl script discovery!)
    default: `${UG_SCRAPER_CONFIG.baseUrl}${UG_SCRAPER_CONFIG.exploreEndpoint}?search=${encodedQuery}&type[]=Tabs`,
    
    // Strategy 2: Explore with search query
    explore_search: `${UG_SCRAPER_CONFIG.baseUrl}${UG_SCRAPER_CONFIG.exploreEndpoint}?search=${encodedQuery}&type[]=Tabs`,
    
    // Strategy 3: Explore with artist search
    explore_artist: `${UG_SCRAPER_CONFIG.baseUrl}${UG_SCRAPER_CONFIG.exploreEndpoint}?artist=${encodedQuery}&type[]=Tabs`,
    
    // Strategy 4: Legacy search endpoint (for comparison)
    legacy: `${UG_SCRAPER_CONFIG.baseUrl}${UG_SCRAPER_CONFIG.searchEndpoint}?search_type=title&value=${encodedQuery}`,
    
    // Strategy 5: Explore with different tab type
    explore_chords: `${UG_SCRAPER_CONFIG.baseUrl}${UG_SCRAPER_CONFIG.exploreEndpoint}?type[]=Chords`
  }
  
  const url = searchStrategies[strategy] || searchStrategies.default
  console.log(`🔗 Using search strategy: ${strategy}`)
  console.log(`🔗 Search URL: ${url}`)
  
  return url
}

/**
 * 🔍 Parse search results from HTML using regex patterns
 * 
 * @param {string} html - Raw HTML from search page (may be corrupted)
 * @param {string} query - Original search query
 * @returns {Object} Parsed search results with Tab IDs
 */
const parseSearchResults = (html, query) => {
  console.log(`🔍 Parsing search results for query: "${query}"`)
  console.log(`📄 HTML length: ${html.length} characters`)
  
  try {
      // 🎯 THE WORKING APPROACH: Extract JSON from js-store div
  console.log('🔍 Using the WORKING approach: JSON extraction from js-store div')
  
  // Pattern to find the js-store div with JSON data
  const jsStorePattern = /<div class="js-store" data-content="(.+?)"><\/div>/g
  
  const jsStoreMatches = []
  let match
  
  // Find all js-store divs
  while ((match = jsStorePattern.exec(html)) !== null) {
    jsStoreMatches.push(match[1])
  }
  
  console.log(`✅ Found ${jsStoreMatches.length} js-store divs with JSON data`)
  
  // 🔍 ADDITIONAL DETAILED LOGGING FOR LEGACY ENDPOINT
  if (jsStoreMatches.length === 0) {
    console.log('⚠️ No js-store divs found - this might not be the right page')
    
    // 🔍 DETAILED ANALYSIS: Look for alternative data patterns
    console.log('\n🔍 DETAILED DATA ANALYSIS:')
    console.log('=' .repeat(50))
    
    // Look for any divs with data attributes
    const dataDivPattern = /<div[^>]*data-[^>]*>/g
    const dataDivs = html.match(dataDivPattern)
    console.log(`📋 Found ${dataDivs?.length || 0} divs with data attributes`)
    if (dataDivs) {
      console.log('📋 Sample data divs:')
      dataDivs.slice(0, 3).forEach((div, i) => {
        console.log(`  ${i + 1}. ${div.substring(0, 100)}...`)
      })
    }
    
    // Look for any script tags with data
    const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/g
    const scripts = []
    while ((match = scriptPattern.exec(html)) !== null) {
      scripts.push(match[1])
    }
    console.log(`📋 Found ${scripts.length} script tags`)
    if (scripts.length > 0) {
      console.log('📋 First script content (first 200 chars):')
      console.log(`  ${scripts[0].substring(0, 200)}...`)
    }
    
    // Look for any JSON-like patterns in the entire HTML
    const jsonPatterns = html.match(/\{[^}]*\}/g)
    console.log(`📋 Found ${jsonPatterns?.length || 0} JSON-like patterns`)
    if (jsonPatterns && jsonPatterns.length > 0) {
      console.log('📋 Sample JSON patterns:')
      jsonPatterns.slice(0, 3).forEach((pattern, i) => {
        console.log(`  ${i + 1}. ${pattern.substring(0, 150)}...`)
      })
    }
    
    // Look for any tab-related text
    const tabTextPattern = /tab|chord|guitar|song|artist/gi
    const tabTextMatches = html.match(tabTextPattern)
    console.log(`📋 Found ${tabTextMatches?.length || 0} tab-related text matches`)
    
    console.log('=' .repeat(50))
    
    return {
      query: query,
      type: 'search_results',
      source: 'ultimate_guitar_web',
      totalResults: 0,
      results: [],
      note: 'No js-store divs found - page might not contain tab data'
    }
  }
    
    // Process each js-store div to extract tab information
    const allTabs = []
    
    for (let i = 0; i < jsStoreMatches.length; i++) {
      const rawJson = jsStoreMatches[i]
      console.log(`🔍 Processing js-store div ${i + 1}/${jsStoreMatches.length}`)
      
      try {
        // Clean up the JSON (replace &quot; with quotes)
        const cleanJson = rawJson.replace(/&quot;/g, '"')
        
        // Parse the JSON
        const jsonData = JSON.parse(cleanJson)
        
        // Extract tabs from the JSON structure (based on Perl script)
        if (jsonData.store && jsonData.store.page && jsonData.store.page.data) {
          const pageData = jsonData.store.page.data
          
          // Look for tabs in different possible locations
          let tabs = []
          if (pageData.data && pageData.data.tabs) {
            tabs = pageData.data.tabs
          } else if (pageData.tabs) {
            tabs = pageData.tabs
          }
          
          if (tabs && Array.isArray(tabs)) {
            console.log(`✅ Found ${tabs.length} tabs in js-store div ${i + 1}`)
            
            // Process each tab
            tabs.forEach(tab => {
              if (tab.tab_url) {
                // Extract Tab ID from URL
                const tabIdMatch = tab.tab_url.match(/\/tab\/(\d+)/)
                const tabId = tabIdMatch ? parseInt(tabIdMatch[1]) : null
                
                if (tabId) {
                  const tabInfo = {
                    tabId: tabId,
                    source: 'ultimate_guitar_web',
                    url: tab.tab_url,
                    songName: tab.song_name || 'Unknown',
                    artistName: tab.artist_name || 'Unknown',
                    type: tab.type_name || 'Unknown',
                    version: tab.version || 'Unknown',
                    rating: tab.rating || 'Unknown',
                    votes: tab.votes || 'Unknown',
                    difficulty: tab.difficulty || 'Unknown'
                  }
                  
                  allTabs.push(tabInfo)
                  console.log(`✅ Extracted Tab ID: ${tabId} - ${tab.artist_name} - ${tab.song_name}`)
                }
              }
            })
          } else {
            console.log(`⚠️ No tabs found in js-store div ${i + 1}`)
          }
        } else {
          console.log(`⚠️ Unexpected JSON structure in js-store div ${i + 1}`)
        }
        
      } catch (jsonError) {
        console.warn(`⚠️ Failed to parse JSON from js-store div ${i + 1}:`, jsonError.message)
      }
    }
    
    // Remove duplicates based on Tab ID
    const uniqueTabs = []
    const seenTabIds = new Set()
    
    allTabs.forEach(tab => {
      if (!seenTabIds.has(tab.tabId)) {
        seenTabIds.add(tab.tabId)
        uniqueTabs.push(tab)
      }
    })
    
    console.log(`🎯 Parsing complete: Found ${uniqueTabs.length} unique Tab IDs`)
    
    return {
      query: query,
      type: 'search_results',
      source: 'ultimate_guitar_web',
      totalResults: uniqueTabs.length,
      results: uniqueTabs,
      parsingStats: {
        jsStoreDivsFound: jsStoreMatches.length,
        totalTabsExtracted: allTabs.length,
        uniqueTabIdsFound: uniqueTabs.length
      }
    }
    
  } catch (parseError) {
    console.error('❌ JSON parsing failed:', parseError.message)
    
    // Return fallback structure
    return {
      query: query,
      type: 'search_results',
      source: 'ultimate_guitar_web',
      totalResults: 0,
      results: [],
      error: parseError.message,
      note: 'JSON parsing failed, but raw data received'
    }
  }
}
    


/**
 * 🧪 Test function to verify the web scraper works
 * 
 * @param {string} query - Search query to test
 * @returns {Promise<Object>} Test results
 */
export const testUGWebScraper = async (query = 'Hotel California Eagles') => {
  console.log(`🧪 Testing UG Web Scraper for query: "${query}"`)
  
  try {
    const startTime = Date.now()
    const results = await searchUGWeb(query, { timeout: 15000, retries: 1 })
    const endTime = Date.now()
    
    console.log('✅ Test successful:', {
      query,
      responseTime: `${endTime - startTime}ms`,
      hasResults: !!results.results,
      totalResults: results.results?.length || 0
    })
    
    return { success: true, results, responseTime: endTime - startTime }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 🚀 Multi-strategy search - try different approaches to find working data
 * 
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Best results found
 */
export const searchUGMultiStrategy = async (query, options = {}) => {
  console.log(`🚀 Starting multi-strategy search for: "${query}"`)
  
  const strategies = ['legacy', 'default', 'band', 'alt', 'simple', 'mobile']
  const results = []
  
  for (const strategy of strategies) {
    try {
      console.log(`\n🎯 Trying strategy: ${strategy}`)
      
      const strategyResults = await searchUGWeb(query, { 
        ...options, 
        strategy: strategy,
        timeout: 20000,
        retries: 1
      })
      
      if (strategyResults && strategyResults.success) {
        console.log(`✅ Strategy ${strategy} successful`)
        results.push({
          strategy,
          results: strategyResults,
          tabIdsFound: strategyResults.results?.totalResults || 0
        })
        
        // If we found Tab IDs, this strategy worked!
        if (strategyResults.results?.totalResults > 0) {
          console.log(`🎉 Strategy ${strategy} found ${strategyResults.results.totalResults} Tab IDs!`)
          return {
            success: true,
            bestStrategy: strategy,
            results: strategyResults,
            allStrategies: results
          }
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Strategy ${strategy} failed:`, error.message)
      results.push({
        strategy,
        error: error.message,
        tabIdsFound: 0
      })
    }
    
    // Small delay between strategies
    if (strategy !== strategies[strategies.length - 1]) {
      console.log('⏳ Waiting 2 seconds before next strategy...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  // Return best results even if no Tab IDs found
  const bestResult = results.reduce((best, current) => 
    current.tabIdsFound > best.tabIdsFound ? current : best
  , { tabIdsFound: 0 })
  
  console.log(`\n📊 Multi-strategy search complete. Best result: ${bestResult.strategy} with ${bestResult.tabIdsFound} Tab IDs`)
  
  return {
    success: bestResult.tabIdsFound > 0,
    bestStrategy: bestResult.strategy,
    results: bestResult.results || null,
    allStrategies: results,
    summary: `Tried ${strategies.length} strategies, best found ${bestResult.tabIdsFound} Tab IDs`
  }
}

/**
 * 🎯 Scraper Status Check
 * Returns the current status of the UG web scraper
 * 
 * @returns {Object} Scraper status information
 */
export const getUGWebScraperStatus = () => {
  return {
    service: 'UG Web Scraper',
    status: 'basic_structure_ready',
    baseUrl: UG_SCRAPER_CONFIG.baseUrl,
    searchEndpoint: UG_SCRAPER_CONFIG.searchEndpoint,
    timeout: UG_SCRAPER_CONFIG.timeout,
    maxRetries: UG_SCRAPER_CONFIG.maxRetries,
    lastUpdated: new Date().toISOString(),
    nextStep: 'Implement HTML parsing for search results'
  }
}
