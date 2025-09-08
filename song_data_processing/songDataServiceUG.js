/**
 * 🎸 Ultimate Guitar Song Data Service
 * 
 * Main service layer for Ultimate Guitar song data integration
 * Transforms raw UG tab data into structured song objects
 * Uses the enhanced database schema for optimal storage
 * 
 * Features:
 * - Ultimate Guitar scraper integration
 * - Tab data parsing and transformation
 * - Song section extraction with timing
 * - Chord progression analysis
 * - Database-ready data preparation
 */

import { callUGScraper } from './ugScraperIntegration.js'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Song Data Structure (matches enhanced database schema)
 * @typedef {Object} SongData
 * @property {string} title - Song title
 * @property {string} artist - Song artist
 * @property {number} ugTabId - Ultimate Guitar tab ID
 * @property {string} instrumentType - Instrument type (guitar, bass, etc.)
 * @property {string} tuning - Instrument tuning
 * @property {string} tabbedBy - Who created the tab
 * @property {SongSection[]} sections - Song sections with timing
 * @property {ChordProgression[]} chordProgressions - Chord changes with timing
 * @property {Object} metadata - Additional song information
 */

/**
 * Song Section Structure
 * @typedef {Object} SongSection
 * @property {string} sectionName - Section name (e.g., "Verse 1", "Chorus")
 * @property {string} sectionType - Section type (verse, chorus, bridge, solo, etc.)
 * @property {string} sectionLabel - Section label (e.g., "fig. a", "Guitar Solo")
 * @property {string} startTime - Start time in MM:SS format
 * @property {string} endTime - End time in MM:SS format
 * @property {number} repeatCount - How many times to repeat (2x, 6x, etc.)
 * @property {string} performanceNotes - Performance instructions
 * @property {Object} tabContent - Tab notation for this section
 * @property {Object} chordProgression - Chords in this section
 */

/**
 * Chord Progression Structure
 * @typedef {Object} ChordProgression
 * @property {string} chordName - Chord name (e.g., "Am", "C", "Fmaj7")
 * @property {string} chordType - Chord type (major, minor, 7th, etc.)
 * @property {string} rootNote - Root note (e.g., "A", "C", "F")
 * @property {string} startTime - Start time in MM:SS format
 * @property {string} endTime - End time in MM:SS format
 * @property {number} sequenceOrder - Order in the progression
 * @property {Object} chordData - Full chord information
 */

/**
 * 🎯 MAIN SONG DATA SERVICE FUNCTION
 * Primary entry point for song data requests
 * Fetches UG data and transforms it into structured format
 * 
 * @param {number|string} tabId - Ultimate Guitar tab ID
 * @returns {Promise<SongData|null>} Structured song data or null if not found
 */
export const getSongDataUG = async (tabId) => {
  if (!tabId || (typeof tabId !== 'string' && typeof tabId !== 'number')) {
    console.warn('⚠️ Invalid tab ID provided:', tabId)
    return null
  }

  try {
    console.log(`🎸 Fetching song data for tab ID: ${tabId}`)
    
    // 🚀 PHASE 1: Fetch raw data from Ultimate Guitar
    const ugResult = await callUGScraper(tabId)
    
    if (!ugResult || !ugResult.success) {
      console.warn(`⚠️ Failed to fetch UG data for tab ID: ${tabId}`)
      return null
    }
    
    console.log(`✅ Successfully fetched UG data for tab ID: ${tabId}`)
    
    // 🔄 PHASE 2: Transform raw UG data to structured format
    const songData = transformUGDataToSongData(ugResult.data, tabId)
    
    if (!songData) {
      console.warn(`⚠️ Failed to transform UG data for tab ID: ${tabId}`)
      return null
    }
    
    console.log(`✅ Successfully transformed song data for: ${songData.title} by ${songData.artist}`)
    
    // 🎬 PHASE 3: Create placeholder video if chord progressions exist
    if (songData.chordProgressions && songData.chordProgressions.length > 0) {
      console.log(`🎬 Found ${songData.chordProgressions.length} chord progressions - creating placeholder video`)
      
      // Note: We'll create the placeholder video after the song is stored in the database
      // This will be handled by the calling function (url_tab_id_processor.js or parent_script.js)
      songData.needsPlaceholderVideo = true
      songData.placeholderVideoData = {
        songTitle: songData.title,
        songArtist: songData.artist,
        chordCount: songData.chordProgressions.length
      }
    }
    
    return songData
    
  } catch (error) {
    console.error(`❌ Error in getSongDataUG for tab ID ${tabId}:`, error)
    return null
  }
}

/**
 * 🔄 Transform raw UG data to structured song data
 * Parses tab content and extracts song structure
 * 
 * @param {Object} ugData - Raw data from Ultimate Guitar
 * @param {number|string} tabId - Original tab ID
 * @returns {SongData|null} Structured song data
 */
const transformUGDataToSongData = (ugData, tabId) => {
  try {
    console.log(`🔄 Transforming UG data to structured song format`)
    
    // Extract basic song information
    const songInfo = extractSongInfo(ugData)
    if (!songInfo) {
      console.warn('⚠️ Failed to extract basic song information')
      return null
    }
    
    // Extract song sections with timing
    const sections = extractSongSections(ugData)
    console.log(`📊 Extracted ${sections.length} song sections`)
    
    // Extract chord progressions
    const chordProgressions = extractChordProgressions(ugData, sections)
    console.log(`🎵 Extracted ${chordProgressions.length} chord progressions`)
    
    // Build the complete song data object
    const songData = {
      title: songInfo.title,
      artist: songInfo.artist,
      ugTabId: parseInt(tabId),
      instrumentType: songInfo.instrumentType || 'guitar',
      tuning: songInfo.tuning || 'E A D G B E',
      tabbedBy: songInfo.tabbedBy,
      tabbedByEmail: songInfo.tabbedByEmail, // Pass through extracted email
      rawHtmlHeader: songInfo.rawHtmlHeader, // Pass through header metadata
      album: songInfo.album,
      sections: sections,
      chordProgressions: chordProgressions,
      hasRawHtml: ugData.hasRawHtml || false, // Pass through HTML completeness flag
      metadata: {
        source: 'ultimate_guitar',
        rawData: ugData,
        transformed: true,
        transformationDate: new Date().toISOString()
      }
    }
    
    return songData
    
  } catch (error) {
    console.error('❌ Error transforming UG data:', error)
    return null
  }
}

/**
 * 📋 Extract basic song information from UG data
 * 
 * @param {Object} ugData - Raw UG data (HTML parsed or text format)
 * @returns {Object|null} Basic song information
 */
const extractSongInfo = (ugData) => {
  try {
    console.log(`🔍 Extracting song info from UG data structure:`, Object.keys(ugData))
    
    let songInfo = {}
    
    // Check if this is HTML-parsed data (new format)
    if (ugData.title && ugData.artist) {
      console.log(`✅ Using HTML-parsed data structure`)
      songInfo.title = ugData.title
      songInfo.artist = ugData.artist
      
      // Extract additional metadata from HTML structure
      if (ugData.tabContent) {
        // Look for album info in tab content
        const albumMatch = ugData.tabContent.match(/Album[:\s]+([^\n]+)/i)
        if (albumMatch) songInfo.album = albumMatch[1].trim()
        
        // Look for tabbed by info
        const tabbedByMatch = ugData.tabContent.match(/Tabbed by[:\s]+([^\n]+)/i)
        if (tabbedByMatch) songInfo.tabbedBy = tabbedByMatch[1].trim()
        
        // Look for year info
        const yearMatch = ugData.tabContent.match(/(\d{4})/)
        if (yearMatch) songInfo.year = yearMatch[1]
        
        // Look for tuning info
        const tuningMatch = ugData.tabContent.match(/Tuning[:\s]+([^\n]+)/i)
        if (tuningMatch) songInfo.tuning = tuningMatch[1].trim()
        
        // Look for capo info
        const capoMatch = ugData.tabContent.match(/Capo[:\s]+([^\n]+)/i)
        if (capoMatch) songInfo.capoPosition = capoMatch[1].trim()
      }
      
      // Extract email addresses from HTML content
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
      const emailMatch = ugData.rawHTML ? ugData.rawHTML.match(emailRegex) : null
      if (emailMatch) {
        songInfo.tabbedByEmail = emailMatch[0]
        console.log(`📧 Found email: ${songInfo.tabbedByEmail}`)
      }
      
      // Extract header metadata (everything above lyrics, excluding footer)
      if (ugData.rawHTML) {
        const headerMetadata = extractHeaderMetadata(ugData.rawHTML)
        if (headerMetadata) {
          songInfo.rawHtmlHeader = headerMetadata
          console.log(`📋 Extracted header metadata with ${Object.keys(headerMetadata).length} fields`)
        }
      }
      
      // Determine instrument type from content or default to guitar
      songInfo.instrumentType = 'guitar' // Default for most UG tabs
      
      // Use default tuning if not found
      if (!songInfo.tuning) {
        songInfo.tuning = 'E A D G B E'
      }
      
      console.log(`✅ Extracted from HTML: ${songInfo.title} by ${songInfo.artist}`)
      return songInfo
    }
    
    // Fallback: Check if this is old text format (legacy support)
    if (ugData.rawOutput) {
      console.log(`⚠️ Falling back to legacy text format parsing`)
      const rawOutput = ugData.rawOutput
      const lines = rawOutput.split('\n')
      
      // Extract song name and artist from header
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
      
      // Extract additional metadata
      for (const line of lines) {
        if (line.includes('Album:')) {
          const match = line.match(/Album:\s*(.+)/)
          if (match) songInfo.album = match[1].trim()
        }
        if (line.includes('Tabbed by:')) {
          const match = line.match(/Tabbed by:\s*(.+)/)
          if (match) songInfo.tabbedBy = match[1].trim()
        }
      }
      
      // Determine instrument type from content
      if (rawOutput.includes('G|---') || rawOutput.includes('G|--')) {
        songInfo.instrumentType = 'guitar'
      } else if (rawOutput.includes('B|---') || rawOutput.includes('B|--')) {
        songInfo.instrumentType = 'bass'
      } else {
        songInfo.instrumentType = 'guitar' // Default
      }
      
      // Determine tuning (default to standard guitar)
      songInfo.tuning = 'E A D G B E'
      
      if (songInfo.title && songInfo.artist) {
        console.log(`✅ Extracted from legacy text: ${songInfo.title} by ${songInfo.artist}`)
        return songInfo
      }
    }
    
    console.warn(`⚠️ Could not extract song info from any supported format`)
    return null
    
  } catch (error) {
    console.error('❌ Error extracting song info:', error)
    return null
  }
}

/**
 * 📋 Extract header metadata from raw HTML
 * Extracts everything above the lyrics (excluding footer)
 * 
 * @param {string} rawHTML - Raw HTML content from UG scraper
 * @returns {Object|null} Structured header metadata
 */
const extractHeaderMetadata = (rawHTML) => {
  try {
    console.log(`🔍 Extracting header metadata from raw HTML`)
    
    // Find the boundary between header and lyrics content
    const tabContentStart = rawHTML.indexOf('<div class="tab-content')
    if (tabContentStart === -1) {
      console.warn(`⚠️ Could not find tab-content boundary in HTML`)
      return null
    }
    
    // Extract header content (everything before tab-content)
    const headerContent = rawHTML.substring(0, tabContentStart)
    
    // Parse header content to extract structured metadata
    const metadata = {}
    
    // Extract title from HTML title tag
    const titleMatch = headerContent.match(/<title>([^<]+)<\/title>/)
    if (titleMatch) {
      metadata.title = titleMatch[1].trim()
    }
    
    // Extract song title from h1 tag
    const h1Match = headerContent.match(/<h1[^>]*>([^<]+)<\/h1>/)
    if (h1Match) {
      metadata.displayTitle = h1Match[1].trim()
    }
    
    // Extract artist from h1 tag (after "by")
    const artistMatch = headerContent.match(/by\s+<span[^>]*>([^<]+)<\/span>/)
    if (artistMatch) {
      metadata.artist = artistMatch[1].trim()
    }
    
    // Extract chord definitions
    const chordDefinitions = []
    const chordRegex = /<strong[^>]*>([^<]+)<\/strong>\s+([^<]+)/g
    let chordMatch
    while ((chordMatch = chordRegex.exec(headerContent)) !== null) {
      chordDefinitions.push({
        chord: chordMatch[1].trim(),
        fingering: chordMatch[2].trim()
      })
    }
    
    if (chordDefinitions.length > 0) {
      metadata.chordDefinitions = chordDefinitions
    }
    
    // Extract CSS classes and styling info
    const cssClasses = []
    const classRegex = /class="([^"]+)"/g
    let classMatch
    while ((classMatch = classRegex.exec(headerContent)) !== null) {
      cssClasses.push(classMatch[1])
    }
    
    if (cssClasses.length > 0) {
      metadata.cssClasses = [...new Set(cssClasses)] // Remove duplicates
    }
    
    // Extract external resources (CSS, JS)
    const externalResources = []
    const linkRegex = /<link[^>]+href="([^"]+)"[^>]*>/g
    let linkMatch
    while ((linkMatch = linkRegex.exec(headerContent)) !== null) {
      externalResources.push(linkMatch[1])
    }
    
    const scriptRegex = /<script[^>]+src="([^"]+)"[^>]*>/g
    let scriptMatch
    while ((scriptMatch = scriptRegex.exec(headerContent)) !== null) {
      externalResources.push(scriptMatch[1])
    }
    
    if (externalResources.length > 0) {
      metadata.externalResources = externalResources
    }
    
    // Extract raw header HTML for reference
    metadata.rawHeaderHtml = headerContent
    
    console.log(`✅ Extracted header metadata with ${Object.keys(metadata).length} fields`)
    return metadata
    
  } catch (error) {
    console.error('❌ Error extracting header metadata:', error)
    return null
  }
}

/**
 * 📊 Extract song sections with timing from UG data
 * 
 * @param {Object} ugData - Raw UG data
 * @returns {SongSection[]} Array of song sections
 */
const extractSongSections = (ugData) => {
  try {
    console.log(`🔍 Extracting song sections from UG data structure`)
    
    // Check if this is HTML-parsed data (new format)
    if (ugData.sections && Array.isArray(ugData.sections)) {
      console.log(`✅ Using HTML-parsed sections: ${ugData.sections.length} sections found`)
      
      // Transform HTML sections to our internal format
      const sections = ugData.sections.map((section, index) => ({
        sectionName: section.label || `Section ${index + 1}`,
        sectionType: section.type || 'verse',
        sectionLabel: section.label || null,
        startTime: section.time || '0:00',
        endTime: null, // Will be calculated from next section
        repeatCount: section.repeatCount || 1,
        performanceNotes: null,
        tabContent: {},
        chordProgression: {},
        sequenceOrder: index
      }))
      
      // Calculate end times for sections
      for (let i = 0; i < sections.length; i++) {
        if (i < sections.length - 1) {
          sections[i].endTime = sections[i + 1].startTime
        } else {
          // Last section - set end time to a reasonable duration
          const startTime = sections[i].startTime
          const [minutes, seconds] = startTime.split(':').map(Number)
          const endMinutes = minutes + 1
          const endSeconds = seconds
          sections[i].endTime = `${endMinutes}:${endSeconds.toString().padStart(2, '0')}`
        }
      }
      
      console.log(`📊 Successfully extracted ${sections.length} song sections from HTML`)
      return sections
    }
    
    // Fallback: Check if this is old text format (legacy support)
    if (ugData.rawOutput) {
      console.log(`⚠️ Falling back to legacy text format section extraction`)
      const rawOutput = ugData.rawOutput
      const lines = rawOutput.split('\n')
      
      const sections = []
      let currentSection = null
      let sectionOrder = 0
      
      // Extract timing markers for reference
      const timingMarkers = ugData.timingMarkers || []
      console.log(`🔍 Found ${timingMarkers.length} timing markers:`, timingMarkers)
      
      // If we have timing markers, use them for section detection
      if (timingMarkers.length > 0) {
        sections.push(...extractSectionsFromTimingMarkers(lines, timingMarkers, sectionOrder))
      } else {
        // Fallback: extract sections from tab structure and figure labels
        console.log(`⚠️ No timing markers found, using fallback section detection`)
        sections.push(...extractSectionsFromTabStructure(lines, sectionOrder))
      }
      
      console.log(`📊 Successfully extracted ${sections.length} song sections from legacy text`)
      return sections
    }
    
    console.warn(`⚠️ No supported format found for section extraction`)
    return []
    
  } catch (error) {
    console.error('❌ Error extracting song sections:', error)
    return []
  }
}

/**
 * 🎯 Extract sections from timing markers (primary method)
 * 
 * @param {string[]} lines - All lines from UG data
 * @param {string[]} timingMarkers - Array of timing markers
 * @param {number} startOrder - Starting section order
 * @returns {SongSection[]} Array of song sections
 */
const extractSectionsFromTimingMarkers = (lines, timingMarkers, startOrder) => {
  const sections = []
  let currentSection = null
  let sectionOrder = startOrder
  
  // Process each line to identify sections
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Look for timing markers (MM:SS format) - ANYWHERE in the line
    const timingMatch = line.match(/(\d+:\d+)/)
    if (timingMatch) {
      const time = timingMatch[1]
      
      // Close previous section if exists
      if (currentSection) {
        currentSection.endTime = time
        sections.push(currentSection)
      }
      
      // Extract section label from the same line (before the timing marker)
      let sectionLabel = line.replace(/\d+:\d+.*/, '').trim()
      let sectionName = sectionLabel || `Section at ${time}`
      let sectionType = 'verse' // Default type
      
      // Determine section type based on label content
      if (sectionLabel.includes('Guitar Solo')) {
        sectionType = 'solo'
        sectionName = 'Guitar Solo'
      } else if (sectionLabel.includes('Drums')) {
        sectionType = 'instrumental'
        sectionName = 'Drums'
      } else if (sectionLabel.includes('Bass Out')) {
        sectionType = 'instrumental'
        sectionName = 'Bass Out'
      } else if (sectionLabel.includes('Organ') || sectionLabel.includes('Violins')) {
        sectionType = 'instrumental'
        sectionName = sectionLabel
      } else if (sectionLabel) {
        sectionType = 'verse'
        sectionName = sectionLabel
      }
      
      // Start new section
      currentSection = {
        sectionName: sectionName,
        sectionType: sectionType,
        sectionLabel: sectionLabel || null,
        startTime: time,
        endTime: null,
        repeatCount: 1,
        performanceNotes: null,
        tabContent: {},
        chordProgression: {},
        sequenceOrder: sectionOrder++
      }
      
      console.log(`🎯 Created timed section: ${sectionName} (${sectionType}) at ${time}`)
    }
    
    // Look for repeat instructions (2x, 6x, etc.)
    if (line.includes('x') && /\d+x/.test(line)) {
      const repeatMatch = line.match(/(\d+)x/)
      if (repeatMatch && currentSection) {
        currentSection.repeatCount = parseInt(repeatMatch[1])
        console.log(`🔄 Section ${currentSection.sectionName} repeats ${currentSection.repeatCount}x`)
      }
    }
    
    // Look for performance notes
    if (line.includes('play like this:') || line.includes('>=play')) {
      if (currentSection) {
        currentSection.performanceNotes = line
        console.log(`📝 Performance note for ${currentSection.sectionName}: ${line}`)
      }
    }
    
    // Look for figure labels
    if (line.includes('fig.') && currentSection) {
      const figMatch = line.match(/fig\.\s*([a-z])/i)
      if (figMatch) {
        currentSection.sectionLabel = `fig. ${figMatch[1]}`
        console.log(`🏷️ Figure label for ${currentSection.sectionName}: fig. ${figMatch[1]}`)
      }
    }
  }
  
  // Close the last section if exists
  if (currentSection) {
    // Estimate end time if not set
    if (!currentSection.endTime && timingMarkers.length > 1) {
      const currentIndex = timingMarkers.indexOf(currentSection.startTime)
      if (currentIndex < timingMarkers.length - 1) {
        currentSection.endTime = timingMarkers[currentIndex + 1]
      }
    }
    sections.push(currentSection)
  }
  
  // Post-process sections to improve timing
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    
    // If no end time, use next section's start time
    if (!section.endTime && i < sections.length - 1) {
      section.endTime = sections[i + 1].startTime
    }
    
    // Calculate duration if we have both times
    if (section.startTime && section.endTime) {
      section.durationSeconds = calculateDurationSeconds(section.startTime, section.endTime)
    }
  }
  
  return sections
}

/**
 * 🎵 Extract sections from tab structure (fallback method)
 * Creates sections based on figure labels, performance instructions, and tab structure
 * 
 * @param {string[]} lines - All lines from UG data
 * @param {number} startOrder - Starting section order
 * @returns {SongSection[]} Array of song sections
 */
const extractSectionsFromTabStructure = (lines, startOrder) => {
  const sections = []
  let sectionOrder = startOrder
  let currentSection = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Look for figure labels (fig. a, fig. b, etc.)
    const figMatch = line.match(/fig\.\s*([a-z])/i)
    if (figMatch) {
      // Close previous section if exists
      if (currentSection) {
        sections.push(currentSection)
      }
      
      // Start new section based on figure
      currentSection = {
        sectionName: `Figure ${figMatch[1].toUpperCase()}`,
        sectionType: 'instrumental',
        sectionLabel: `fig. ${figMatch[1]}`,
        startTime: null, // No timing available
        endTime: null,
        repeatCount: 1,
        performanceNotes: null,
        tabContent: {},
        chordProgression: {},
        sequenceOrder: sectionOrder++
      }
      
      console.log(`🎯 Created figure section: Figure ${figMatch[1].toUpperCase()}`)
    }
    
    // Look for performance instructions
    if (line.includes('play like this:') || line.includes('>=play')) {
      if (currentSection) {
        currentSection.performanceNotes = line
        console.log(`📝 Performance note for ${currentSection.sectionName}: ${line}`)
      }
    }
    
    // Look for repeat instructions
    if (line.includes('x') && /\d+x/.test(line)) {
      const repeatMatch = line.match(/(\d+)x/)
      if (repeatMatch && currentSection) {
        currentSection.repeatCount = parseInt(repeatMatch[1])
        console.log(`🔄 Section ${currentSection.sectionName} repeats ${currentSection.repeatCount}x`)
      }
    }
    
    // Look for section descriptions
    if (line.includes('fill') || line.includes('solo') || line.includes('verse') || line.includes('chorus')) {
      if (currentSection) {
        currentSection.sectionName = line.trim()
        console.log(`🏷️ Updated section name: ${line.trim()}`)
      }
    }
  }
  
  // Close the last section if exists
  if (currentSection) {
    sections.push(currentSection)
  }
  
  // If no sections were created, create a default one
  if (sections.length === 0) {
    sections.push({
      sectionName: 'Main Tab',
      sectionType: 'instrumental',
      sectionLabel: null,
      startTime: null,
      endTime: null,
      repeatCount: 1,
      performanceNotes: null,
      tabContent: {},
      chordProgression: {},
      sequenceOrder: 0
    })
    console.log(`🎯 Created default section: Main Tab`)
  }
  
  return sections
}

/**
 * 🎵 Extract chord progressions from UG data
 * 
 * @param {Object} ugData - Raw UG data
 * @param {SongSection[]} sections - Song sections for context
 * @returns {ChordProgression[]} Array of chord progressions
 */
const extractChordProgressions = (ugData, sections) => {
  try {
    console.log(`🔍 Extracting chord progressions from UG data structure`)
    
    // 🎯 ERROR LOGGING: Capture ingress data for debugging
    console.log(`📊 CHORD EXTRACTION INGRESS DATA:`)
    console.log(`   - ugData keys: ${Object.keys(ugData).join(', ')}`)
    console.log(`   - tabContent type: ${typeof ugData.tabContent}`)
    console.log(`   - tabContent length: ${ugData.tabContent ? ugData.tabContent.length : 'null'}`)
    console.log(`   - rawHTML type: ${typeof ugData.rawHTML}`)
    console.log(`   - rawHTML length: ${ugData.rawHTML ? ugData.rawHTML.length : 'null'}`)
    
    let chordProgressions = []
    
    // 🎸 APPROACH 1: HTML Chord Extraction (for CHORD type songs)
    if (ugData.tabContent && ugData.tabContent.length > 0) {
      console.log(`🎸 APPROACH 1: Attempting HTML chord extraction`)
      
      const htmlChordProgressions = extractChordsFromHTML(ugData, sections)
      console.log(`🎵 HTML approach found ${htmlChordProgressions.length} chord progressions`)
      
      if (htmlChordProgressions.length > 0) {
        chordProgressions = htmlChordProgressions
      }
    }
    
    // 🎸 APPROACH 2: Tab Line Extraction (for TAB type songs or fallback)
    if (chordProgressions.length === 0 && ugData.tabContent && ugData.tabContent.length > 0) {
      console.log(`🎸 APPROACH 2: Attempting tab line extraction`)
      
      const tabLineChordProgressions = extractChordsFromTabLines(ugData, sections)
      console.log(`🎵 Tab line approach found ${tabLineChordProgressions.length} chord progressions`)
      
      if (tabLineChordProgressions.length > 0) {
        chordProgressions = tabLineChordProgressions
      }
    }
    
    // 🎸 APPROACH 3: Legacy Text Format (fallback)
    if (chordProgressions.length === 0 && ugData.rawOutput) {
      console.log(`🎸 APPROACH 3: Attempting legacy text format extraction`)
      
      const legacyChordProgressions = extractChordsFromLegacyText(ugData, sections)
      console.log(`🎵 Legacy approach found ${legacyChordProgressions.length} chord progressions`)
      
      if (legacyChordProgressions.length > 0) {
        chordProgressions = legacyChordProgressions
      }
    }
    
    // 🎯 ERROR LOGGING: Capture egress data for debugging
    console.log(`📊 CHORD EXTRACTION EGRESS DATA:`)
    console.log(`   - Total chord progressions: ${chordProgressions.length}`)
    console.log(`   - Chord names found: ${chordProgressions.map(c => c.chordName).join(', ')}`)
    console.log(`   - Unique chord names: ${[...new Set(chordProgressions.map(c => c.chordName))].join(', ')}`)
    
    console.log(`🎵 Extracted ${chordProgressions.length} chord progressions total`)
    return chordProgressions
    
    // Fallback: Check if this is old text format (legacy support)
    if (ugData.rawOutput) {
      console.log(`⚠️ Falling back to legacy text format chord extraction`)
      const rawOutput = ugData.rawOutput
      const lines = rawOutput.split('\n')
      
      const chordProgressions = []
      let chordOrder = 0
      
      // Extract timing markers for chord positioning
      const timingMarkers = ugData.timingMarkers || []
      
      // Look for chord patterns in tab lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Look for tab lines (containing G|, D|, A|, E|)
        if (line.includes('G|') || line.includes('D|') || line.includes('A|') || line.includes('E|')) {
          
          // Extract potential chord information from tab
          const chordInfo = extractChordFromTabLine(line)
          if (chordInfo) {
            
            // Find the section this chord belongs to
            const section = findSectionForTime(timingMarkers, sections, i, lines)
            
            // Ensure we have valid timing for the chord
            let startTime = section ? section.startTime : null
            let endTime = section ? section.endTime : null
            
            // If no section timing, try to find the closest timing marker
            if (!startTime) {
              // Look backwards from current line for timing markers
              for (let j = i; j >= 0; j--) {
                const prevLine = lines[j].trim()
                const timingMatch = prevLine.match(/(\d+:\d+)/)
                if (timingMatch) {
                  startTime = timingMatch[1]
                  break
                }
              }
            }
            
            // If still no timing, use a default
            if (!startTime) {
              startTime = '0:00'
            }
            
            // If no end time, estimate based on sequence
            if (!endTime && chordOrder < chordProgressions.length + 10) {
              // Estimate 10 seconds per chord if no timing available
              const startSeconds = startTime ? parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]) : 0
              const endSeconds = startSeconds + 10
              endTime = `${Math.floor(endSeconds / 60)}:${(endSeconds % 60).toString().padStart(2, '0')}`
            }
            
            const chordProgression = {
              chordName: chordInfo.chordName,
              chordType: chordInfo.chordType,
              rootNote: chordInfo.rootNote,
              startTime: startTime,
              endTime: endTime,
              sequenceOrder: chordOrder++,
              barPosition: null, // Will be calculated later
              chordData: {
                tabLine: line,
                fingering: chordInfo.fingering,
                notes: chordInfo.notes
              }
            }
            
            chordProgressions.push(chordProgression)
          }
        }
      }
      
      console.log(`🎵 Extracted ${chordProgressions.length} chord progressions from legacy text`)
      return chordProgressions
    }
    
    console.warn(`⚠️ No supported format found for chord progression extraction`)
    return []
    
  } catch (error) {
    console.error('❌ Error extracting chord progressions:', error)
    return []
  }
}

/**
 * 🎯 Extract chord information from a tab line
 * 
 * @param {string} tabLine - Tab notation line
 * @returns {Object|null} Chord information
 */
const extractChordFromTabLine = (tabLine) => {
  try {
    // This is a simplified chord extraction
    // In a full implementation, you'd analyze the fret positions
    
    // Look for common chord patterns
    if (tabLine.includes('0') && tabLine.includes('2') && tabLine.includes('3')) {
      return {
        chordName: 'Am',
        chordType: 'minor',
        rootNote: 'A',
        fingering: ['X', '0', '2', '2', '1', '0'],
        notes: ['A', 'E', 'A', 'C', 'E']
      }

    }
    
    if (tabLine.includes('0') && tabLine.includes('3')) {
      return {
        chordName: 'C',
        chordType: 'major',
        rootNote: 'C',
        fingering: ['X', '3', '2', '0', '1', '0'],
        notes: ['C', 'E', 'G', 'C', 'E']
      }
    }
    
    // Default chord if no pattern matches
    return {
      chordName: 'Unknown',
      chordType: 'unknown',
      rootNote: '?',
      fingering: ['X', 'X', 'X', 'X', 'X', 'X'],
      notes: []
    }
    
  } catch (error) {
    console.error('❌ Error extracting chord from tab line:', error)
    return null
  }
}

/**
 * 🔍 Find the section a chord belongs to based on timing
 * 
 * @param {string[]} timingMarkers - Array of timing markers
 * @param {SongSection[]} sections - Song sections
 * @param {number} lineIndex - Current line index
 * @param {string[]} lines - All lines for context
 * @returns {SongSection|null} Matching section
 */
const findSectionForTime = (timingMarkers, sections, lineIndex, lines) => {
  try {
    // Look backwards from current line for timing markers
    for (let i = lineIndex; i >= 0; i--) {
      const line = lines[i].trim()
      const timingMatch = line.match(/^(\d+:\d+)/)
      
      if (timingMatch) {
        const time = timingMatch[1]
        
        // Find section that starts at this time
        const section = sections.find(s => s.startTime === time)
        if (section) {
          return section
        }
      }
    }
    
    return null
    
  } catch (error) {
    console.error('❌ Error finding section for time:', error)
    return null
  }
}

/**
 * ⏱️ Calculate duration between two time strings
 * 
 * @param {string} startTime - Start time in MM:SS format
 * @param {string} endTime - End time in MM:SS format
 * @returns {number} Duration in seconds
 */
const calculateDurationSeconds = (startTime, endTime) => {
  try {
    if (!startTime || !endTime) return 0
    
    const startParts = startTime.split(':').map(Number)
    const endParts = endTime.split(':').map(Number)
    
    const startSeconds = startParts[0] * 60 + startParts[1]
    const endSeconds = endParts[0] * 60 + endParts[1]
    
    return Math.max(0, endSeconds - startSeconds)
    
  } catch (error) {
    console.error('❌ Error calculating duration:', error)
    return 0
  }
}

/**
 * 🧪 Test function to verify the song data service works
 * 
 * @param {number|string} tabId - Ultimate Guitar tab ID to test
 * @returns {Promise<Object>} Test results
 */
export const testSongDataService = async (tabId = 100) => {
  console.log(`🧪 Testing Song Data Service for tab ID: ${tabId}`)
  
  try {
    const startTime = Date.now()
    const songData = await getSongDataUG(tabId)
    const endTime = Date.now()
    
    if (songData) {
      console.log('✅ Test successful:', {
        tabId,
        title: songData.title,
        artist: songData.artist,
        sections: songData.sections.length,
        chordProgressions: songData.chordProgressions.length,
        responseTime: `${endTime - startTime}ms`
      })
      
      return { success: true, songData, responseTime: endTime - startTime }
    } else {
      console.error('❌ Test failed: No song data returned')
      return { success: false, error: 'No song data returned' }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 🎬 Create placeholder video record for songs with chord progressions
 * Creates a favorite record that links to the song for chord caption creation
 * 
 * @param {string} songId - UUID of the song record
 * @param {string} songTitle - Song title
 * @param {string} songArtist - Song artist
 * @returns {Promise<Object>} Result with favorite ID and status
 */
export const createPlaceholderVideoForSong = async (songId, songTitle, songArtist) => {
  try {
    console.log(`🎬 Creating placeholder video for song: ${songTitle} by ${songArtist}`)
    
    // Check if placeholder video already exists for this song
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('uuid_song', songId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking for existing placeholder video:', checkError)
      return { success: false, error: checkError.message }
    }
    
    if (existingFavorite) {
      console.log(`✅ Placeholder video already exists for song ${songId}`)
      return { 
        success: true, 
        favoriteId: existingFavorite.id, 
        message: 'Placeholder video already exists' 
      }
    }
    
    // Create placeholder video record
    const placeholderVideoData = {
      user_id: 'c47a8186-32ff-4bcc-8d54-b44caafa4660', // Your user profile ID
      video_id: `placeholder_${songId}`, // Special format for placeholder videos
      video_title: `Placeholder: ${songTitle}`, // Add "Placeholder" prefix
      video_thumbnail: null, // No thumbnail for placeholder videos
      video_channel: songArtist, // Use artist as channel name
      video_duration_seconds: null, // Unknown duration for placeholder
      is_public: false, // Private by default
      uuid_song: songId, // Link to the song record
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert([placeholderVideoData])
      .select('id')
      .single()
    
    if (error) {
      console.error('❌ Error creating placeholder video:', error)
      return { success: false, error: error.message }
    }
    
    console.log(`✅ Created placeholder video with favorite ID: ${favorite.id}`)
    return { 
      success: true, 
      favoriteId: favorite.id, 
      message: 'Placeholder video created successfully' 
    }
    
  } catch (error) {
    console.error('❌ Error in createPlaceholderVideoForSong:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 🎯 Service Status Check
 * Returns the current status of the UG song data service
 * 
 * @returns {Object} Service status information
 */
export const getSongDataServiceStatus = () => {
  return {
    service: 'Ultimate Guitar Song Data Service',
    status: 'ready',
    purpose: 'Fetch and transform UG song data',
    capabilities: [
      'UG data fetching via Go scraper',
      'Song information extraction',
      'Section and chord progression parsing',
      'Placeholder video creation for chord captions',
      'Data transformation to internal format'
    ],
    lastUpdated: new Date().toISOString(),
    nextStep: 'Integrate with chord caption creation workflow'
  }
}

/**
 * 🎸 APPROACH 1: Extract chords from HTML chord spans and definitions
 * For CHORD type songs with rich HTML structure
 * 
 * @param {Object} ugData - Raw UG data
 * @param {SongSection[]} sections - Song sections for context
 * @returns {ChordProgression[]} Array of chord progressions
 */
const extractChordsFromHTML = (ugData, sections) => {
  try {
    console.log(`🎸 Extracting chords from HTML structure`)
    
    const chordProgressions = []
    let chordOrder = 0
    
    // Step 1: Extract chord definitions from the "chords-used" section
    const chordDefinitions = extractChordDefinitionsFromHTML(ugData.rawHTML || ugData.tabContent || '')
    console.log(`🎸 Found ${chordDefinitions.length} chord definitions:`, chordDefinitions.map(c => c.name).join(', '))
    
    // Step 2: Extract chord progressions from tab content with proper chord names
    if (ugData.tabContent && ugData.tabContent.length > 0) {
      const tabContent = ugData.tabContent
      const lines = tabContent.split('\n')
      
      // Look for chord spans in the tab content
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Look for chord spans: <span class="chord">ChordName</span>
        const chordSpanMatches = line.match(/<span class="chord">([^<]+)<\/span>/g)
        
        if (chordSpanMatches && chordSpanMatches.length > 0) {
          for (const chordSpan of chordSpanMatches) {
            // Extract chord name from span
            const chordNameMatch = chordSpan.match(/<span class="chord">([^<]+)<\/span>/)
            if (chordNameMatch) {
              const chordName = chordNameMatch[1].trim()
              
              // Find chord definition for this chord name
              const chordDef = chordDefinitions.find(def => def.name === chordName)
              
              // Find the section this chord belongs to
              const section = findSectionForTime(ugData.timingMarkers || [], sections, i, lines)
              
              // Ensure we have valid timing for the chord
              let startTime = section ? section.startTime : null
              let endTime = section ? section.endTime : null
              
              // If no section timing, try to find the closest timing marker
              if (!startTime) {
                // Look backwards from current line for timing markers
                for (let j = i; j >= 0; j--) {
                  const prevLine = lines[j].trim()
                  const timingMatch = prevLine.match(/(\d+:\d+)/)
                  if (timingMatch) {
                    startTime = timingMatch[1]
                    break
                  }
                }
              }
              
              // If still no timing, use a default
              if (!startTime) {
                startTime = '0:00'
              }
              
              // If no end time, estimate based on sequence
              if (!endTime && chordOrder < chordProgressions.length + 10) {
                // Estimate 10 seconds per chord if no timing available
                const startSeconds = startTime ? parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]) : 0
                const endSeconds = startSeconds + 10
                endTime = `${Math.floor(endSeconds / 60)}:${(endSeconds % 60).toString().padStart(2, '0')}`
              }
              
              const chordProgression = {
                chordName: chordName,
                chordType: chordDef ? chordDef.type : 'unknown',
                rootNote: chordDef ? chordDef.rootNote : '?',
                startTime: startTime,
                endTime: endTime,
                sequenceOrder: chordOrder++,
                barPosition: null, // Will be calculated later
                chordData: {
                  tabLine: line,
                  fingering: chordDef ? chordDef.fingering : null,
                  notes: chordDef ? chordDef.notes : []
                }
              }
              
              chordProgressions.push(chordProgression)
            }
          }
        }
      }
    }
    
    console.log(`🎵 HTML extraction found ${chordProgressions.length} chord progressions`)
    return chordProgressions
    
  } catch (error) {
    console.error('❌ Error extracting chords from HTML:', error)
    return []
  }
}

/**
 * 🎸 APPROACH 2: Extract chords from tab lines (existing logic)
 * For TAB type songs with tab notation
 * 
 * @param {Object} ugData - Raw UG data
 * @param {SongSection[]} sections - Song sections for context
 * @returns {ChordProgression[]} Array of chord progressions
 */
const extractChordsFromTabLines = (ugData, sections) => {
  try {
    console.log(`🎸 Extracting chords from tab lines`)
    
    const chordProgressions = []
    let chordOrder = 0
    
    // Extract chords from the tab content
    const tabContent = ugData.tabContent
    const lines = tabContent.split('\n')
    
    // Look for chord patterns in tab lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Look for tab lines (containing G|, D|, A|, E|)
      if (line.includes('G|') || line.includes('D|') || line.includes('A|') || line.includes('E|')) {
        
        // Extract potential chord information from tab
        const chordInfo = extractChordFromTabLine(line)
        if (chordInfo) {
          
          // Find the section this chord belongs to
          const section = findSectionForTime(ugData.timingMarkers || [], sections, i, lines)
          
          // Ensure we have valid timing for the chord
          let startTime = section ? section.startTime : null
          let endTime = section ? section.endTime : null
          
          // If no section timing, try to find the closest timing marker
          if (!startTime) {
            // Look backwards from current line for timing markers
            for (let j = i; j >= 0; j--) {
              const prevLine = lines[j].trim()
              const timingMatch = prevLine.match(/(\d+:\d+)/)
              if (timingMatch) {
                startTime = timingMatch[1]
                break
              }
            }
          }
          
          // If still no timing, use a default
          if (!startTime) {
            startTime = '0:00'
          }
          
          // If no end time, estimate based on sequence
          if (!endTime && chordOrder < chordProgressions.length + 10) {
            // Estimate 10 seconds per chord if no timing available
            const startSeconds = startTime ? parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]) : 0
            const endSeconds = startSeconds + 10
            endTime = `${Math.floor(endSeconds / 60)}:${(endSeconds % 60).toString().padStart(2, '0')}`
          }
          
          const chordProgression = {
            chordName: chordInfo.chordName,
            chordType: chordInfo.chordType,
            rootNote: chordInfo.rootNote,
            startTime: startTime,
            endTime: endTime,
            sequenceOrder: chordOrder++,
            barPosition: null, // Will be calculated later
            chordData: {
              tabLine: line,
              fingering: chordInfo.fingering,
              notes: chordInfo.notes
            }
          }
          
          chordProgressions.push(chordProgression)
        }
      }
    }
    
    console.log(`🎵 Tab line extraction found ${chordProgressions.length} chord progressions`)
    return chordProgressions
    
  } catch (error) {
    console.error('❌ Error extracting chords from tab lines:', error)
    return []
  }
}

/**
 * 🎸 APPROACH 3: Extract chords from legacy text format
 * For older UG data formats
 * 
 * @param {Object} ugData - Raw UG data
 * @param {SongSection[]} sections - Song sections for context
 * @returns {ChordProgression[]} Array of chord progressions
 */
const extractChordsFromLegacyText = (ugData, sections) => {
  try {
    console.log(`🎸 Extracting chords from legacy text format`)
    
    const rawOutput = ugData.rawOutput
    const lines = rawOutput.split('\n')
    
    const chordProgressions = []
    let chordOrder = 0
    
    // Extract timing markers for chord positioning
    const timingMarkers = ugData.timingMarkers || []
    
    // Look for chord patterns in tab lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Look for tab lines (containing G|, D|, A|, E|)
      if (line.includes('G|') || line.includes('D|') || line.includes('A|') || line.includes('E|')) {
        
        // Extract potential chord information from tab
        const chordInfo = extractChordFromTabLine(line)
        if (chordInfo) {
          
          // Find the section this chord belongs to
          const section = findSectionForTime(timingMarkers, sections, i, lines)
          
          // Ensure we have valid timing for the chord
          let startTime = section ? section.startTime : null
          let endTime = section ? section.endTime : null
          
          // If no section timing, try to find the closest timing marker
          if (!startTime) {
            // Look backwards from current line for timing markers
            for (let j = i; j >= 0; j--) {
              const prevLine = lines[j].trim()
              const timingMatch = prevLine.match(/(\d+:\d+)/)
              if (timingMatch) {
                startTime = timingMatch[1]
                break
              }
            }
          }
          
          // If still no timing, use a default
          if (!startTime) {
            startTime = '0:00'
          }
          
          // If no end time, estimate based on sequence
          if (!endTime && chordOrder < chordProgressions.length + 10) {
            // Estimate 10 seconds per chord if no timing available
            const startSeconds = startTime ? parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]) : 0
            const endSeconds = startSeconds + 10
            endTime = `${Math.floor(endSeconds / 60)}:${(endSeconds % 60).toString().padStart(2, '0')}`
          }
          
          const chordProgression = {
            chordName: chordInfo.chordName,
            chordType: chordInfo.chordType,
            rootNote: chordInfo.rootNote,
            startTime: startTime,
            endTime: endTime,
            sequenceOrder: chordOrder++,
            barPosition: null, // Will be calculated later
            chordData: {
              tabLine: line,
              fingering: chordInfo.fingering,
              notes: chordInfo.notes
            }
          }
          
          chordProgressions.push(chordProgression)
        }
      }
    }
    
    console.log(`🎵 Legacy text extraction found ${chordProgressions.length} chord progressions`)
    return chordProgressions
    
  } catch (error) {
    console.error('❌ Error extracting chords from legacy text:', error)
    return []
  }
}

/**
 * 🎸 Extract chord definitions from HTML "chords-used" section
 * 
 * @param {string} htmlContent - HTML content from UG scraper
 * @returns {Array} Array of chord definition objects
 */
const extractChordDefinitionsFromHTML = (htmlContent) => {
  try {
    console.log(`🔍 Extracting chord definitions from HTML content (length: ${htmlContent.length})`)
    
    const chordDefinitions = []
    
    // Look for the "chords-used" section - find the complete section
    const chordsUsedMatch = htmlContent.match(/<div class="chords-used[^>]*>([\s\S]*?)<\/div>\s*<div class="tab-content/i)
    
    if (chordsUsedMatch) {
      console.log(`✅ Found chords-used section`)
      const chordsUsedSection = chordsUsedMatch[1]
      console.log(`📄 Chords-used section length: ${chordsUsedSection.length}`)
      console.log(`📄 Chords-used section content: ${chordsUsedSection}`)
      
      // Use simple line-by-line parsing with improved logic
      console.log(`🎸 Using simple line-by-line parsing approach`)
      
      const lines = chordsUsedSection.split('\n')
      let currentChordName = null
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Look for chord name in strong tags
        const nameMatch = line.match(/<strong[^>]*>([^<]+)<\/strong>/i)
        if (nameMatch) {
          currentChordName = nameMatch[1].trim()
          console.log(`🎵 Found chord name: ${currentChordName}`)
        }
        
        // Look for fingering pattern (6 characters of numbers and x) anywhere on the line
        const fingeringMatch = line.match(/([0-9x]{6})/i)
        if (fingeringMatch && currentChordName) {
          const fingering = fingeringMatch[1]
          console.log(`🎵 Found fingering: ${fingering} for chord: ${currentChordName}`)
          
          // Determine chord type and root note from chord name
          const chordInfo = analyzeChordName(currentChordName)
          
          chordDefinitions.push({
            name: currentChordName,
            type: chordInfo.type,
            rootNote: chordInfo.rootNote,
            fingering: fingering,
            notes: chordInfo.notes
          })
          
          console.log(`✅ Added chord definition: ${currentChordName} (${chordInfo.type}, root: ${chordInfo.rootNote})`)
          
          // Reset for next chord
          currentChordName = null
        }
      }
      
      console.log(`🎸 Parsed ${chordDefinitions.length} chord definitions with line-by-line approach`)
    } else {
      console.log(`⚠️ No chords-used section found in HTML`)
      console.log(`📄 HTML preview: ${htmlContent.substring(0, 500)}...`)
    }
    
    console.log(`🎸 Total chord definitions extracted: ${chordDefinitions.length}`)
    return chordDefinitions
    
  } catch (error) {
    console.error('❌ Error extracting chord definitions from HTML:', error)
    return []
  }
}

/**
 * 🎯 Analyze chord name to determine type, root note, and notes
 * 
 * @param {string} chordName - Chord name (e.g., "Em7", "G", "A7sus4")
 * @returns {Object} Chord analysis
 */
const analyzeChordName = (chordName) => {
  try {
    // Basic chord analysis - can be enhanced with a proper chord library
    const cleanName = chordName.trim()
    
    // Extract root note (first character or first two characters)
    let rootNote = cleanName.charAt(0)
    let type = 'major' // default
    let notes = []
    
    // Handle two-character root notes (like "Am", "Em")
    if (cleanName.length > 1 && cleanName.charAt(1) === 'm') {
      rootNote = cleanName.charAt(0)
      type = 'minor'
    } else if (cleanName.length > 1 && cleanName.charAt(1) === 'b') {
      rootNote = cleanName.substring(0, 2)
    } else if (cleanName.length > 1 && cleanName.charAt(1) === '#') {
      rootNote = cleanName.substring(0, 2)
    }
    
    // Handle specific chord types
    if (cleanName.includes('m7')) {
      type = 'minor7'
    } else if (cleanName.includes('7')) {
      type = 'dominant7'
    } else if (cleanName.includes('sus4')) {
      type = 'suspended4'
    } else if (cleanName.includes('sus2')) {
      type = 'suspended2'
    } else if (cleanName.includes('maj7')) {
      type = 'major7'
    } else if (cleanName.includes('dim')) {
      type = 'diminished'
    } else if (cleanName.includes('aug')) {
      type = 'augmented'
    } else if (cleanName.includes('m')) {
      type = 'minor'
    }
    
    // Basic note calculation (simplified)
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const rootIndex = noteOrder.indexOf(rootNote.toUpperCase())
    
    if (rootIndex !== -1) {
      if (type === 'major') {
        notes = [
          noteOrder[rootIndex],
          noteOrder[(rootIndex + 4) % 12], // major third
          noteOrder[(rootIndex + 7) % 12]  // perfect fifth
        ]
      } else if (type === 'minor') {
        notes = [
          noteOrder[rootIndex],
          noteOrder[(rootIndex + 3) % 12], // minor third
          noteOrder[(rootIndex + 7) % 12]  // perfect fifth
        ]
      } else if (type === 'dominant7') {
        notes = [
          noteOrder[rootIndex],
          noteOrder[(rootIndex + 4) % 12], // major third
          noteOrder[(rootIndex + 7) % 12], // perfect fifth
          noteOrder[(rootIndex + 10) % 12] // minor seventh
        ]
      } else if (type === 'minor7') {
        notes = [
          noteOrder[rootIndex],
          noteOrder[(rootIndex + 3) % 12], // minor third
          noteOrder[(rootIndex + 7) % 12], // perfect fifth
          noteOrder[(rootIndex + 10) % 12] // minor seventh
        ]
      }
    }
    
    return {
      type: type,
      rootNote: rootNote.toUpperCase(),
      notes: notes
    }
    
  } catch (error) {
    console.error('❌ Error analyzing chord name:', error)
    return {
      type: 'unknown',
      rootNote: '?',
      notes: []
    }
  }
}

