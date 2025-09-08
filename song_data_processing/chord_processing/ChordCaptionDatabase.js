import { supabase } from '../../lib/supabase'

/**
 * 🎸 Chord Caption Database Operations
 * Contains all chord caption-related database functions extracted from components/ChordCaptionModal.js
 * These functions handle CRUD operations for chord captions and follow the exact pattern of CaptionDatabase.js
 */

/**
 * Load chord captions for a specific video
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID
 * @param {Function} setIsLoadingChords - Loading state setter
 * @param {Function} setDbError - Error state setter
 * @returns {Promise<Array>} Array of chord captions
 */
export const loadChordCaptions = async (videoId, userId, setIsLoadingChords, setDbError) => {
  try {
    setIsLoadingChords(true)
    setDbError(null)
    
    // First get the favorite record for this video
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()
    
    if (favoriteError) {
      if (favoriteError.code === 'PGRST116') {
        // No favorite found, return empty array
        return []
      }
      throw favoriteError
    }
    
    // Now get chord captions for this favorite
    const { data, error } = await supabase
      .from('chord_captions')
      .select('*')
      .eq('favorite_id', favoriteData.id)
      .order('display_order', { ascending: true })
    
    if (error) throw error
    
    // Transform database field names to frontend field names
    const transformedChordCaptions = (data || []).map(chord => ({
      id: chord.id,
      chord_name: chord.chord_name,
      start_time: chord.start_time,
      end_time: chord.end_time,
      chord_data: chord.chord_data,
      display_order: chord.display_order,
      serial_number: chord.serial_number,
      sync_group_id: chord.sync_group_id,
      is_master: chord.is_master,
      favorite_id: chord.favorite_id,
      user_id: chord.user_id,
      created_at: chord.created_at,
      updated_at: chord.updated_at
    }))
    
    return transformedChordCaptions
  } catch (error) {
    console.error('❌ Error loading chord captions:', error)
    setDbError('Failed to load chord captions')
    return []
  } finally {
    setIsLoadingChords(false)
  }
}

/**
 * Save chord captions array to database (for cancel/restore functionality)
 * @param {Array} chordCaptions - Array of chord caption objects
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID
 * @param {Function} setIsLoadingChords - Loading state setter
 * @param {Function} setDbError - Error state setter
 * @returns {Promise<boolean>} True if successful, false if failed
 */
export const saveChordCaptions = async (chordCaptions, videoId, userId, setIsLoadingChords, setDbError) => {
  try {
    setIsLoadingChords(true)
    setDbError(null)
    
    // First ensure the video is favorited
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()
    
    if (favoriteError) {
      console.error('❌ Cannot save chord captions: video not favorited')
      setDbError('Video must be favorited to save chord captions')
      return false
    }
    
    // Delete all existing chord captions for this favorite
    const { error: deleteError } = await supabase
      .from('chord_captions')
      .delete()
      .eq('favorite_id', favoriteData.id)
    
    if (deleteError) throw deleteError
    
    // If no chord captions to save, we're done
    if (!chordCaptions || chordCaptions.length === 0) {
      return true
    }
    
    // Transform frontend field names back to database field names
    const dbChordCaptions = chordCaptions.map(chord => ({
      favorite_id: favoriteData.id,
      user_id: userId,
      chord_name: chord.chord_name,
      start_time: chord.start_time,
      end_time: chord.end_time,
      chord_data: chord.chord_data || null,
      display_order: chord.display_order,
      serial_number: chord.serial_number,
      sync_group_id: chord.sync_group_id || null,
      is_master: chord.is_master || false
    }))
    
    // Insert all chord captions
    const { error: insertError } = await supabase
      .from('chord_captions')
      .insert(dbChordCaptions)
    
    if (insertError) throw insertError
    
    return true
  } catch (error) {
    console.error('❌ Error saving chord captions:', error)
    setDbError('Failed to save chord captions')
    return false
  } finally {
    setIsLoadingChords(false)
  }
}

/**
 * Update an existing chord caption in the database
 * @param {string} chordId - Chord caption ID to update
 * @param {Object} updates - Object containing updates
 * @param {string} userId - User ID for security
 * @param {Function} setIsLoadingChords - Loading state setter
 * @param {Function} setDbError - Error state setter
 * @returns {Promise<Object|null>} Updated chord caption or null if failed
 */
export const updateChordCaption = async (chordId, updates, userId, setIsLoadingChords, setDbError) => {
  try {
    setIsLoadingChords(true)
    setDbError(null)
    
    const { data, error } = await supabase
      .from('chord_captions')
      .update({
        chord_name: updates.chord_name,
        start_time: updates.start_time,
        end_time: updates.end_time,
        chord_data: updates.chord_data || null,
        display_order: updates.display_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', chordId)
      .eq('user_id', userId) // Security: only update own chord captions
      .select()
    
    if (error) throw error
    
    // Transform the updated chord caption to frontend format
    const updatedChordCaption = data[0]
    const transformedChordCaption = {
      id: updatedChordCaption.id,
      chord_name: updatedChordCaption.chord_name,
      start_time: updatedChordCaption.start_time,
      end_time: updatedChordCaption.end_time,
      chord_data: updatedChordCaption.chord_data,
      display_order: updatedChordCaption.display_order,
      serial_number: updatedChordCaption.serial_number,
      sync_group_id: updatedChordCaption.sync_group_id,
      is_master: updatedChordCaption.is_master,
      favorite_id: updatedChordCaption.favorite_id,
      user_id: updatedChordCaption.user_id,
      created_at: updatedChordCaption.created_at,
      updated_at: updatedChordCaption.updated_at
    }
    
    return transformedChordCaption
  } catch (error) {
    console.error('❌ Error updating chord caption:', error)
    setDbError('Failed to update chord caption')
    return null
  } finally {
    setIsLoadingChords(false)
  }
}

/**
 * Delete a chord caption from the database
 * @param {string} chordId - Chord caption ID to delete
 * @param {string} userId - User ID for security
 * @param {Function} setIsLoadingChords - Loading state setter
 * @param {Function} setDbError - Error state setter
 * @returns {Promise<boolean>} True if successful, false if failed
 */
export const deleteChordCaption = async (chordId, userId, setIsLoadingChords, setDbError) => {
  try {
    setIsLoadingChords(true)
    setDbError(null)
    
    const { error } = await supabase
      .from('chord_captions')
      .delete()
      .eq('id', chordId)
      .eq('user_id', userId) // Security: only delete own chord captions
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error('❌ Error deleting chord caption:', error)
    setDbError('Failed to delete chord caption')
    return false
  } finally {
    setIsLoadingChords(false)
  }
}

/**
 * Delete all chord captions for a specific video
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID for security
 * @param {Function} setIsLoadingChords - Loading state setter
 * @param {Function} setDbError - Error state setter
 * @returns {Promise<boolean>} True if successful, false if failed
 */
export const deleteAllChordCaptions = async (videoId, userId, setIsLoadingChords, setDbError) => {
  try {
    setIsLoadingChords(true)
    setDbError(null)
    
    // First get the favorite record for this video
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()
    
    if (favoriteError) {
      console.error('❌ Cannot delete chord captions: video not favorited')
      setDbError('Video must be favorited to delete chord captions')
      return false
    }
    
    // Delete all chord captions for this favorite
    const { error } = await supabase
      .from('chord_captions')
      .delete()
      .eq('favorite_id', favoriteData.id)
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error('❌ Error deleting all chord captions:', error)
    setDbError('Failed to delete all chord captions')
    return false
  } finally {
    setIsLoadingChords(false)
  }
}

/**
 * Create a new chord caption in the database
 * @param {Object} chordData - Chord caption data object
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID
 * @param {Function} setIsLoadingChords - Loading state setter
 * @param {Function} setDbError - Error state setter
 * @returns {Promise<Object|null>} Created chord caption or null if failed
 */
export const createChordCaption = async (chordData, videoId, userId, setIsLoadingChords, setDbError) => {
  try {
    setIsLoadingChords(true)
    setDbError(null)
    
    // First ensure the video is favorited
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()
    
    if (favoriteError) {
      console.error('❌ Cannot create chord caption: video not favorited')
      setDbError('Video must be favorited to create chord captions')
      return null
    }
    
    // Calculate next serial number for this favorite
    const { data: existingChords } = await supabase
      .from('chord_captions')
      .select('serial_number')
      .eq('favorite_id', favoriteData.id)
      .order('serial_number', { ascending: false })
      .limit(1)
    
    const nextSerialNumber = existingChords && existingChords.length > 0 
      ? existingChords[0].serial_number + 1 
      : 1
    
    // Calculate display order based on start time
    const { data: allChords } = await supabase
      .from('chord_captions')
      .select('start_time, display_order')
      .eq('favorite_id', favoriteData.id)
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
      .insert([{
        favorite_id: favoriteData.id,
        user_id: userId,
        chord_name: chordData.chord_name,
        start_time: chordData.start_time,
        end_time: chordData.end_time,
        chord_data: chordData.chord_data || null,
        display_order: newDisplayOrder,
        serial_number: nextSerialNumber,
        sync_group_id: null,
        is_master: false
      }])
      .select()
      .single()
    
    if (error) throw error
    
    // Transform the created chord caption to frontend format
    const createdChordCaption = data
    const transformedChordCaption = {
      id: createdChordCaption.id,
      chord_name: createdChordCaption.chord_name,
      start_time: createdChordCaption.start_time,
      end_time: createdChordCaption.end_time,
      chord_data: createdChordCaption.chord_data,
      display_order: createdChordCaption.display_order,
      serial_number: createdChordCaption.serial_number,
      sync_group_id: createdChordCaption.sync_group_id,
      is_master: createdChordCaption.is_master,
      favorite_id: createdChordCaption.favorite_id,
      user_id: createdChordCaption.user_id,
      created_at: createdChordCaption.created_at,
      updated_at: createdChordCaption.updated_at
    }
    
    return transformedChordCaption
  } catch (error) {
    console.error('❌ Error creating chord caption:', error)
    setDbError('Failed to create chord caption')
    return null
  } finally {
    setIsLoadingChords(false)
  }
}

/**
 * Helper function to parse time string to seconds
 * @param {string} timeString - Time string in MM:SS or H:MM:SS format
 * @returns {number} Time in seconds
 */
const parseTimeToSeconds = (timeString) => {
  if (!timeString || typeof timeString !== 'string') {
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
