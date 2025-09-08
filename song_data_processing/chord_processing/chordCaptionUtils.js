/**
 * 🎸 Chord Caption Management Utilities
 * 
 * Simplified validation system for chord captions:
 * - No overlap prevention (multiple chords can share same time ranges)
 * - Focus on time format and boundary validation
 * - Sync group management for master/child relationships
 * 
 * Validation Rules (4 total):
 * 1. Start ≤ End (valid duration)
 * 2. Start ≥ 0:00 (minimum start)
 * 3. End ≤ Video Duration (maximum end)
 * 4. Time format validation (MM:SS or H:MM:SS)
 */

import { supabase } from '../../lib/supabase/client'

/**
 * Time Format Validation
 * Ensures time strings are in MM:SS or H:MM:SS format
 * Rejects invalid ranges like 1:60, 60:00, 1:30:60
 * Rejects non-time strings like 222, 000, --, ::, abc
 */
export const isValidTimeFormat = (timeString) => {
  if (!timeString || typeof timeString !== 'string') {
    return false
  }
  
  // Split by colon to get parts
  const parts = timeString.split(':')
  
  // Must have exactly 2 or 3 parts
  if (parts.length !== 2 && parts.length !== 3) {
    return false
  }
  
  // All parts must be numeric (reject --, ::, abc, etc.)
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      return false
    }
  }
  
  // Convert to numbers for validation
  const numbers = parts.map(Number)
  
  if (parts.length === 2) {
    // MM:SS format
    const minutes = numbers[0]
    const seconds = numbers[1]
    
    // Validate ranges: minutes 0-59, seconds 0-59
    // Reject 60:00, 1:60, etc.
    return minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59
  } else if (parts.length === 3) {
    // H:MM:SS format
    const hours = numbers[0]
    const minutes = numbers[1]
    const seconds = numbers[2]
    
    // Validate ranges: hours 0-99, minutes 0-59, seconds 0-59
    // Reject 1:60:00, 1:30:60, etc.
    return hours >= 0 && hours <= 99 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59
  }
  
  return false
}

/**
 * Get helpful suggestion for invalid time format
 * Provides specific guidance like "Use 2:00 instead of 1:60"
 */
export const getTimeFormatSuggestion = (timeString) => {
  if (!timeString || typeof timeString !== 'string') {
    return 'Enter a valid time in MM:SS or H:MM:SS format'
  }
  
  // Handle non-time strings
  if (!timeString.includes(':')) {
    return 'Use MM:SS format (e.g., 1:30) or H:MM:SS format (e.g., 1:30:45)'
  }
  
  const parts = timeString.split(':')
  
  // Handle wrong number of colons
  if (parts.length === 1) {
    return 'Use MM:SS format (e.g., 1:30) or H:MM:SS format (e.g., 1:30:45)'
  }
  
  if (parts.length > 3) {
    return 'Use MM:SS format (e.g., 1:30) or H:MM:SS format (e.g., 1:30:45)'
  }
  
  // Handle non-numeric parts
  for (let i = 0; i < parts.length; i++) {
    if (!/^\d+$/.test(parts[i])) {
      return 'Only use numbers and colons (e.g., 1:30, 2:15:45)'
    }
  }
  
  // Handle invalid ranges
  if (parts.length === 2) {
    const minutes = parseInt(parts[0])
    const seconds = parseInt(parts[1])
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `Use ${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} instead of ${timeString}`
    }
    
    if (seconds >= 60) {
      const newMinutes = minutes + Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `Use ${newMinutes}:${remainingSeconds.toString().padStart(2, '0')} instead of ${timeString}`
    }
  }
  
  if (parts.length === 3) {
    const hours = parseInt(parts[0])
    const minutes = parseInt(parts[1])
    const seconds = parseInt(parts[2])
    
    if (minutes >= 60) {
      const newHours = hours + Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `Use ${newHours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} instead of ${timeString}`
    }
    
    if (seconds >= 60) {
      const newMinutes = minutes + Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `Use ${hours}:${newMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')} instead of ${timeString}`
    }
  }
  
  return 'Enter time in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)'
}

/**
 * Parse time string to seconds
 * Supports MM:SS and H:MM:SS formats
 */
export const parseTimeToSeconds = (timeString) => {
  if (!isValidTimeFormat(timeString)) {
    return 0
  }
  
  const parts = timeString.split(':').map(Number)
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    // H:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  
  return 0
}

/**
 * Format seconds to MM:SS or H:MM:SS
 * Automatically chooses format based on duration
 */
export const formatSecondsToTime = (seconds) => {
  if (seconds < 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

/**
 * Rule 4: Validate Start ≤ End (valid duration)
 */
export const validateStartBeforeEnd = (startTime, endTime) => {
  // First check format
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return {
      isValid: false,
      rule: 4,
      reason: `Time values must be in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)`,
      suggestion: `Enter times in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)`
    }
  }
  
  const startSeconds = parseTimeToSeconds(startTime)
  const endSeconds = parseTimeToSeconds(endTime)
  
  // Check for zero duration (start = end)
  if (startSeconds === endSeconds) {
    return {
      isValid: false,
      rule: 4,
      reason: `Start time (${startTime}) cannot equal end time (${endTime}) - chord must have duration`,
      suggestion: `End time must be after start time to create a valid chord duration`
    }
  }
  
  // Check for invalid order (start > end)
  if (startSeconds > endSeconds) {
    return {
      isValid: false,
      rule: 4,
      reason: `Start time (${startTime}) cannot be after end time (${endTime})`,
      suggestion: `Start time must be before end time`
    }
  }
  
  return { isValid: true, rule: 4 }
}

/**
 * Rule 5: Validate Start ≥ 0:00 (minimum start)
 */
export const validateMinimumStartTime = (startTime) => {
  // First check format
  if (!isValidTimeFormat(startTime)) {
    return {
      isValid: false,
      rule: 5,
      reason: `Start time (${startTime}) must be in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)`,
      suggestion: `Enter time in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)`
    }
  }
  
  const startSeconds = parseTimeToSeconds(startTime)
  
  if (startSeconds < 0) {
    return {
      isValid: false,
      rule: 5,
      reason: `Start time (${startTime}) cannot be negative`,
      suggestion: `Start time must be at least 0:00`
    }
  }
  
  return { isValid: true, rule: 5 }
}

/**
 * Rule 6: Validate End ≤ Video Duration (maximum end)
 */
export const validateMaximumEndTime = (endTime, videoDurationSeconds) => {
  // First check format
  if (!isValidTimeFormat(endTime)) {
    return {
      isValid: false,
      rule: 6,
      reason: `End time (${endTime}) must be in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)`,
      suggestion: `Enter time in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)`
    }
  }
  
  if (!videoDurationSeconds || videoDurationSeconds <= 0) {
    return { isValid: true, rule: 6 } // Skip validation if video duration unknown
  }
  
  const endSeconds = parseTimeToSeconds(endTime)
  
  if (endSeconds > videoDurationSeconds) {
    return {
      isValid: false,
      rule: 6,
      reason: `End time (${endTime}) is beyond video duration (${formatSecondsToTime(videoDurationSeconds)})`,
      suggestion: `End time must be within video duration`
    }
  }
  
  return { isValid: true, rule: 6 }
}

/**
 * Main validation function for chord captions
 * Applies all 4 validation rules
 */
export const validateChordTimes = (chord, videoDurationSeconds) => {
  const results = {
    isValid: true,
    failures: [],
    suggestions: []
  }
  
  // Rule 4: Start ≤ End
  const startEndValidation = validateStartBeforeEnd(chord.start_time, chord.end_time)
  if (!startEndValidation.isValid) {
    results.isValid = false
    results.failures.push(startEndValidation)
  }
  
  // Rule 5: Start ≥ 0:00
  const minStartValidation = validateMinimumStartTime(chord.start_time)
  if (!minStartValidation.isValid) {
    results.isValid = false
    results.failures.push(minStartValidation)
  }
  
  // Rule 6: End ≤ Video Duration
  const maxEndValidation = validateMaximumEndTime(chord.end_time, videoDurationSeconds)
  if (!maxEndValidation.isValid) {
    results.isValid = false
    results.failures.push(maxEndValidation)
  }
  
  // Collect all suggestions
  results.suggestions = results.failures.map(failure => failure.suggestion)
  
  return results
}

/**
 * Validates all chord captions in an array
 */
export const validateAllChordCaptions = (chords, videoDurationSeconds) => {
  const results = {
    isValid: true,
    totalFailures: 0,
    chordResults: [],
    allFailures: []
  }
  
  for (let i = 0; i < chords.length; i++) {
    const chordResult = validateChordTimes(chords[i], videoDurationSeconds)
    results.chordResults.push(chordResult)
    
    if (!chordResult.isValid) {
      results.isValid = false
      results.totalFailures += chordResult.failures.length
      results.allFailures.push(...chordResult.failures)
    }
  }
  
  return results
}

/**
 * 🗄️ CHORD CAPTION CRUD OPERATIONS
 */

/**
 * Create a new chord caption
 */
export const createChordCaption = async (chordData, favoriteId, userId) => {
  try {
    // Calculate next serial number for this favorite
    const { data: existingChords } = await supabase
      .from('chord_captions')
      .select('serial_number')
      .eq('favorite_id', favoriteId)
      .order('serial_number', { ascending: false })
      .limit(1)
    
    const nextSerialNumber = existingChords && existingChords.length > 0 
      ? existingChords[0].serial_number + 1 
      : 1
    
    // Calculate display order based on start time
    const { data: allChords } = await supabase
      .from('chord_captions')
      .select('start_time, display_order')
      .eq('favorite_id', favoriteId)
      .order('start_time', { ascending: true })
    
    // Find insertion point for display order
    let newDisplayOrder = 1
    if (allChords && allChords.length > 0) {
      const startSeconds = parseTimeToSeconds(chordData.start_time)
      for (let i = 0; i < allChords.length; i++) {
        const existingStartSeconds = parseTimeToSeconds(allChords[i].start_time)
        if (startSeconds < existingStartSeconds) {
          newDisplayOrder = allChords[i].display_order
          break
        }
        newDisplayOrder = allChords[i].display_order + 1
      }
    }
    
    // Insert new chord caption
    const { data, error } = await supabase
      .from('chord_captions')
      .insert({
        favorite_id: favoriteId,
        user_id: userId,
        chord_name: chordData.chord_name,
        start_time: chordData.start_time,
        end_time: chordData.end_time,
        chord_data: chordData.chord_data || null,
        display_order: newDisplayOrder,
        serial_number: nextSerialNumber,
        sync_group_id: null,
        is_master: false
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating chord caption:', error)
      throw error
    }
    
    console.log('✅ Chord caption created successfully:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Error in createChordCaption:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Load all chord captions for a favorite
 */
export const loadChordCaptions = async (favoriteId) => {
  try {
    const { data, error } = await supabase
      .from('chord_captions')
      .select('*')
      .eq('favorite_id', favoriteId)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('❌ Error loading chord captions:', error)
      throw error
    }
    
    console.log('✅ Chord captions loaded successfully:', data?.length || 0, 'chords')
    return { success: true, data: data || [] }
    
  } catch (error) {
    console.error('❌ Error in loadChordCaptions:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Update an existing chord caption
 */
export const updateChordCaption = async (chordId, updates, favoriteId) => {
  try {
    // If timing changed, recalculate display order
    if (updates.start_time || updates.end_time) {
      const { data: allChords } = await supabase
        .from('chord_captions')
        .select('id, start_time, display_order')
        .eq('favorite_id', favoriteId)
        .neq('id', chordId) // Exclude current chord
        .order('start_time', { ascending: true })
      
      // Calculate new display order based on updated start time
      const newStartTime = updates.start_time || updates.start_time
      let newDisplayOrder = 1
      
      if (allChords && allChords.length > 0) {
        const startSeconds = parseTimeToSeconds(newStartTime)
        for (let i = 0; i < allChords.length; i++) {
          const existingStartSeconds = parseTimeToSeconds(allChords[i].start_time)
          if (startSeconds < existingStartSeconds) {
            newDisplayOrder = allChords[i].display_order
            break
          }
          newDisplayOrder = allChords[i].display_order + 1
        }
      }
      
      updates.display_order = newDisplayOrder
    }
    
    // Update the chord caption
    const { data, error } = await supabase
      .from('chord_captions')
      .update(updates)
      .eq('id', chordId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating chord caption:', error)
      throw error
    }
    
    console.log('✅ Chord caption updated successfully:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Error in updateChordCaption:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a chord caption
 */
export const deleteChordCaption = async (chordId) => {
  try {
    const { error } = await supabase
      .from('chord_captions')
      .delete()
      .eq('id', chordId)
    
    if (error) {
      console.error('❌ Error deleting chord caption:', error)
      throw error
    }
    
    console.log('✅ Chord caption deleted successfully')
    return { success: true }
    
  } catch (error) {
    console.error('❌ Error in deleteChordCaption:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 🎯 SYNC GROUP MANAGEMENT
 */

/**
 * Create a new sync group
 */
export const createSyncGroup = async (favoriteId, userId) => {
  try {
    // Get next available color from our 12-color palette
    const { data: existingGroups } = await supabase
      .from('chord_sync_groups')
      .select('group_color')
      .eq('favorite_id', favoriteId)
    
    const colorPalette = [
      '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFB3F7', '#B3FFE6',
      '#FFD4B3', '#E6B3FF', '#B3FFB3', '#FFE6B3', '#B3D4FF', '#FFB3D4'
    ]
    
    const nextColor = colorPalette[(existingGroups?.length || 0) % 12]
    
    // Create the sync group
    const { data, error } = await supabase
      .from('chord_sync_groups')
      .insert({
        favorite_id: favoriteId,
        user_id: userId,
        group_color: nextColor
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating sync group:', error)
      throw error
    }
    
    console.log('✅ Sync group created successfully:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Error in createSyncGroup:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Link a chord to a sync group
 */
export const linkChordToGroup = async (chordId, syncGroupId, isMaster = false) => {
  try {
    const { data, error } = await supabase
      .from('chord_captions')
      .update({
        sync_group_id: syncGroupId,
        is_master: isMaster
      })
      .eq('id', chordId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error linking chord to group:', error)
      throw error
    }
    
    console.log('✅ Chord linked to sync group successfully:', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Error in linkChordToGroup:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update sync group timing (master controls children)
 */
export const updateSyncGroupTiming = async (masterChordId, newStartTime, newEndTime) => {
  try {
    // Get the sync group ID from master chord
    const { data: masterChord } = await supabase
      .from('chord_captions')
      .select('sync_group_id')
      .eq('id', masterChordId)
      .single()
    
    if (!masterChord?.sync_group_id) {
      throw new Error('Master chord not found or not in sync group')
    }
    
    // Update master chord timing
    const { error: masterError } = await supabase
      .from('chord_captions')
      .update({
        start_time: newStartTime,
        end_time: newEndTime
      })
      .eq('id', masterChordId)
    
    if (masterError) {
      console.error('❌ Error updating master chord timing:', masterError)
      throw masterError
    }
    
    // Update all child chords to match master timing
    const { error: childrenError } = await supabase
      .from('chord_captions')
      .update({
        start_time: newStartTime,
        end_time: newEndTime
      })
      .eq('sync_group_id', masterChord.sync_group_id)
      .eq('is_master', false)
    
    if (childrenError) {
      console.error('❌ Error updating child chord timing:', childrenError)
      throw childrenError
    }
    
    console.log('✅ Sync group timing updated successfully')
    return { success: true }
    
  } catch (error) {
    console.error('❌ Error in updateSyncGroupTiming:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all chords in a sync group
 */
export const getSyncGroupChords = async (syncGroupId) => {
  try {
    const { data, error } = await supabase
      .from('chord_captions')
      .select('*')
      .eq('sync_group_id', syncGroupId)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('❌ Error getting sync group chords:', error)
      throw error
    }
    
    return { success: true, data: data || [] }
    
  } catch (error) {
    console.error('❌ Error in getSyncGroupChords:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * 🎸 CHORD SELECTION SYSTEM
 */

/**
 * Root notes for chord selection (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
 */
export const ROOT_NOTES = [
  { value: 'C', label: 'C' },
  { value: 'C#', label: 'C#' },
  { value: 'D', label: 'D' },
  { value: 'D#', label: 'D#' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'F#', label: 'F#' },
  { value: 'G', label: 'G' },
  { value: 'G#', label: 'G#' },
  { value: 'A', label: 'A' },
  { value: 'A#', label: 'A#' },
  { value: 'B', label: 'B' }
]

/**
 * Chord modifiers for selection
 */
export const CHORD_MODIFIERS = [
  { value: '', label: 'Major' },
  { value: 'm', label: 'Minor' },
  { value: 'maj7', label: 'Major 7th' },
  { value: 'm7', label: 'Minor 7th' },
  { value: 'sus4', label: 'Suspended 4th' },
  { value: '7sus4', label: '7th Suspended 4th' },
  { value: '6', label: '6th' },
  { value: 'm6', label: 'Minor 6th' },
  { value: '7', label: '7th' },
  { value: '9', label: '9th' },
  { value: '5', label: '5th' },
  { value: '6add9', label: '6th Add 9th' },
  { value: '11', label: '11th' },
  { value: '13', label: '13th' },
  { value: 'add9', label: 'Add 9th' },
  { value: 'm9', label: 'Minor 9th' },
  { value: 'maj9', label: 'Major 9th' },
  { value: '+', label: 'Augmented' },
  { value: '°', label: 'Diminished' }
]

/**
 * Build chord name from root note and modifier
 */
export const buildChordName = (rootNote, modifier) => {
  if (!rootNote) return ''
  if (!modifier) return rootNote
  return `${rootNote}${modifier}`
}

/**
 * Parse chord name into root note and modifier
 */
export const parseChordName = (chordName) => {
  if (!chordName) return { rootNote: '', modifier: '' }
  
  // Handle special cases first
  if (chordName.includes('°')) {
    return { rootNote: chordName.replace('°', ''), modifier: '°' }
  }
  
  // Find the modifier by checking from longest to shortest
  const modifiers = CHORD_MODIFIERS
    .map(m => m.value)
    .filter(m => m.length > 0)
    .sort((a, b) => b.length - a.length) // Longest first
  
  for (const modifier of modifiers) {
    if (chordName.endsWith(modifier)) {
      const rootNote = chordName.slice(0, -modifier.length)
      return { rootNote, modifier }
    }
  }
  
  // No modifier found, assume major
  return { rootNote: chordName, modifier: '' }
}

/**
 * 🚀 UBERCHORD API INTEGRATION
 */

/**
 * Fetch chord diagram data from UberChord API
 * Note: This requires an API key and proper CORS setup
 */
export const fetchChordData = async (chordName) => {
  try {
    // TODO: Replace with actual UberChord API endpoint and key
    const apiUrl = `https://api.uberchord.com/v1/chords/${encodeURIComponent(chordName)}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${UBERCHORD_API_KEY}` // Add when available
      }
    })
    
    if (!response.ok) {
      throw new Error(`UberChord API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Expected response format:
    // {
    //   "strings": "1 X 2 2 1 0",
    //   "fingering": "1 X 3 4 2 X", 
    //   "chordName": "F,maj,7,"
    // }
    
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Error fetching chord data from UberChord:', error)
    
    // Return fallback data for development/testing
    return {
      success: false,
      error: error.message,
      fallbackData: {
        strings: "X 0 2 2 1 0",
        fingering: "X X 3 4 2 X",
        chordName: chordName
      }
    }
  }
}

/**
 * 🎨 DISPLAY ORDER MANAGEMENT
 */

/**
 * Recalculate display order for all chords in a favorite
 * Called when timing changes affect the order
 */
export const recalculateDisplayOrder = async (favoriteId) => {
  try {
    // Get all chords ordered by start time
    const { data: chords, error } = await supabase
      .from('chord_captions')
      .select('id, start_time')
      .eq('favorite_id', favoriteId)
      .order('start_time', { ascending: true })
    
    if (error) {
      console.error('❌ Error loading chords for display order recalculation:', error)
      throw error
    }
    
    // Update display order for each chord
    const updatePromises = chords.map((chord, index) => {
      return supabase
        .from('chord_captions')
        .update({ display_order: index + 1 })
        .eq('id', chord.id)
    })
    
    await Promise.all(updatePromises)
    
    console.log('✅ Display order recalculated successfully')
    return { success: true }
    
  } catch (error) {
    console.error('❌ Error in recalculateDisplayOrder:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get chords that should be displayed at a specific video time
 */
export const getChordsAtTime = (chords, currentTimeSeconds) => {
  if (!chords || !Array.isArray(chords)) return []
  
  return chords.filter(chord => {
    const startSeconds = parseTimeToSeconds(chord.start_time)
    const endSeconds = parseTimeToSeconds(chord.end_time)
    
    return currentTimeSeconds >= startSeconds && currentTimeSeconds <= endSeconds
  }).sort((a, b) => a.display_order - b.display_order)
}

/**
 * Calculate optimal grid layout for chord display
 * Returns number of columns based on chord count and screen size
 */
export const calculateGridLayout = (chordCount, screenWidth) => {
  if (chordCount <= 0) return { columns: 1, rows: 1 }
  
  // Mobile vertical: max 4 columns
  if (screenWidth < 768) {
    const columns = Math.min(chordCount, 4)
    const rows = Math.ceil(chordCount / columns)
    return { columns, rows }
  }
  
  // Tablet: max 6 columns
  if (screenWidth < 1024) {
    const columns = Math.min(chordCount, 6)
    const rows = Math.ceil(chordCount / columns)
    return { columns, rows }
  }
  
  // Desktop: max 8-9 columns
  const columns = Math.min(chordCount, 9)
  const rows = Math.ceil(chordCount / columns)
  return { columns, rows }
}

/**
 * 🎯 UTILITY HELPERS
 */

/**
 * Check if a chord is currently active at video time
 */
export const isChordActive = (chord, currentTimeSeconds) => {
  const startSeconds = parseTimeToSeconds(chord.start_time)
  const endSeconds = parseTimeToSeconds(chord.end_time)
  return currentTimeSeconds >= startSeconds && currentTimeSeconds <= endSeconds
}

/**
 * Get the next chord that will become active
 */
export const getNextActiveChord = (chords, currentTimeSeconds) => {
  if (!chords || !Array.isArray(chords)) return null
  
  const futureChords = chords.filter(chord => {
    const startSeconds = parseTimeToSeconds(chord.start_time)
    return startSeconds > currentTimeSeconds
  }).sort((a, b) => parseTimeToSeconds(a.start_time) - parseTimeToSeconds(b.start_time))
  
  return futureChords.length > 0 ? futureChords[0] : null
}

/**
 * Get the previous chord that was active
 */
export const getPreviousActiveChord = (chords, currentTimeSeconds) => {
  if (!chords || !Array.isArray(chords)) return null
  
  const pastChords = chords.filter(chord => {
    const endSeconds = parseTimeToSeconds(chord.end_time)
    return endSeconds < currentTimeSeconds
  }).sort((a, b) => parseTimeToSeconds(b.end_time) - parseTimeToSeconds(a.end_time))
  
  return pastChords.length > 0 ? pastChords[0] : null
}

/**
 * 🗑️ DELETE ALL FUNCTIONALITY
 */

/**
 * Delete all chord captions for a specific favorite
 * 
 * @param {string} favoriteId - The UUID of the favorite video
 * @returns {Object} - { success: boolean, deletedCount?: number, error?: string }
 */
export const deleteAllChordCaptionsForFavorite = async (favoriteId) => {
  try {
    if (!favoriteId) {
      throw new Error('favoriteId is required')
    }
    
    console.log(`🗑️  Deleting all chord captions for favorite: ${favoriteId}`)
    
    // First, count how many chords we're about to delete
    const { count: beforeCount, error: countError } = await supabase
      .from('chord_captions')
      .select('*', { count: 'exact', head: true })
      .eq('favorite_id', favoriteId)
    
    if (countError) {
      console.error('❌ Error counting chords before deletion:', countError)
      throw countError
    }
    
    if (beforeCount === 0) {
      console.log('ℹ️  No chord captions found for this favorite')
      return { success: true, deletedCount: 0 }
    }
    
    console.log(`Found ${beforeCount} chord captions to delete`)
    
    // Delete all chord captions for this favorite
    const { error: deleteError } = await supabase
      .from('chord_captions')
      .delete()
      .eq('favorite_id', favoriteId)
    
    if (deleteError) {
      console.error('❌ Error deleting all chord captions:', deleteError)
      throw deleteError
    }
    
    // Verify deletion
    const { count: afterCount, error: verifyError } = await supabase
      .from('chord_captions')
      .select('*', { count: 'exact', head: true })
      .eq('favorite_id', favoriteId)
    
    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError)
      throw verifyError
    }
    
    if (afterCount > 0) {
      console.error(`❌ Delete All failed! Still have ${afterCount} chords`)
      throw new Error(`Delete All failed - still have ${afterCount} chords`)
    }
    
    console.log(`✅ Successfully deleted ${beforeCount} chord captions`)
    
    return { 
      success: true, 
      deletedCount: beforeCount 
    }
    
  } catch (error) {
    console.error('❌ Error in deleteAllChordCaptionsForFavorite:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}
