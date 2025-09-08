import { supabase } from '../lib/supabase'
import { assignSerialNumbersToCaptions } from './captionUtils'

/**
 * Caption Database Operations
 * Contains all caption-related database functions extracted from pages/watch.js
 * These functions handle CRUD operations for captions and user preferences
 */

/**
 * Save user's default caption duration to database
 * @param {number} duration - Duration in seconds
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const saveUserDefaultCaptionDuration = async (duration, userId) => {
  if (!userId) return
  
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ default_caption_duration_seconds: duration })
      .eq('id', userId)
    
    if (error) {
      console.error('Error saving default caption duration:', error)
      return
    }
    
  } catch (error) {
    console.error('Error saving default caption duration:', error)
  }
}

/**
 * Check if a video is favorited by the user
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const checkIfVideoFavorited = async (videoId, userId) => {
  try {
    if (!userId || !videoId) return false
    
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking favorite status:', error)
      return false
    }
    
    return !!data // Convert to boolean
  } catch (error) {
    console.error('❌ Error checking favorite status:', error)
    return false
  }
}

/**
 * Get favorite ID for a video
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Favorite ID or null if not found
 */
export const getFavoriteId = async (videoId, userId) => {
  try {
    if (!userId || !videoId) return null
    
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error getting favorite ID:', error)
      return null
    }
    
    return data?.id || null
  } catch (error) {
    console.error('❌ Error getting favorite ID:', error)
    return null
  }
}

/**
 * Remove a video from favorites
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const removeFavorite = async (videoId, userId) => {
  try {
    if (!userId || !videoId) return false
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId)
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error('❌ Error removing favorite:', error)
    return false
  }
}

/**
 * Load captions for a specific video
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID
 * @param {Function} setIsLoadingCaptions - Loading state setter
 * @param {Function} setDbError - Error state setter
 * @returns {Promise<Array>} Array of captions
 */
export const loadCaptions = async (videoId, userId, setIsLoadingCaptions, setDbError) => {
  try {
    setIsLoadingCaptions(true)
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
        // No favorite found for video, no captions to load
        return []
      }
      throw favoriteError
    }
    
    // Now get captions for this favorite
    const { data, error } = await supabase
      .from('captions')
      .select('*')
      .eq('favorite_id', favoriteData.id)
      .order('start_time', { ascending: true })
    
    if (error) throw error
    
    // Transform database field names to frontend field names
    const transformedCaptions = (data || []).map(caption => ({
      id: caption.id,
      startTime: caption.start_time,
      endTime: caption.end_time,
      line1: caption.line1,
      line2: caption.line2,
      rowType: caption.row_type,
      serial_number: caption.serial_number, // Add serial number field
      favorite_id: caption.favorite_id,
      user_id: caption.user_id,
      created_at: caption.created_at,
      updated_at: caption.updated_at
    }))
    
    // Ensure all captions have serial numbers
    const captionsWithSerialNumbers = assignSerialNumbersToCaptions(transformedCaptions)
    
    // Transformed captions for frontend
    // Captions with serial numbers
    return captionsWithSerialNumbers
  } catch (error) {
    console.error('❌ Error loading captions:', error)
    setDbError('Failed to load captions')
    return []
  } finally {
    setIsLoadingCaptions(false)
  }
}

/**
 * Save a new caption to the database
 * @param {Object} captionData - Caption data object
 * @param {string} videoId - YouTube video ID
 * @param {string} userId - User ID
 * @param {Function} setIsLoadingCaptions - Loading state setter
 * @param {Function} setDbError - Error state setter
 * @returns {Promise<Object|null>} Saved caption or null if failed
 */
export const saveCaption = async (captionData, videoId, userId, setIsLoadingCaptions, setDbError) => {
  try {
    setIsLoadingCaptions(true)
    setDbError(null)
    
    // First ensure the video is favorited
    const isFavorited = await checkIfVideoFavorited(videoId, userId)
    if (!isFavorited) {
      console.error('❌ Cannot save caption: video not favorited')
      setDbError('Video must be favorited to save captions')
      return null
    }
    
    // Get the favorite record to link the caption
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single()
    
    if (favoriteError) throw favoriteError
    
    const { data, error } = await supabase
      .from('captions')
      .insert([{
        favorite_id: favoriteData.id,
        user_id: userId,
        row_type: captionData.rowType,
        start_time: captionData.startTime || '0:00',
        end_time: captionData.endTime || '0:05',
        line1: captionData.line1 || '',
        line2: captionData.line2 || '',
        serial_number: captionData.serial_number || null // Add serial number field
      }])
      .select()
    
    if (error) throw error
    
    // Transform the saved caption to frontend format
    const savedCaption = data[0]
    const transformedCaption = {
      id: savedCaption.id,
      startTime: savedCaption.start_time,
      endTime: savedCaption.end_time,
      line1: savedCaption.line1,
      line2: savedCaption.line2,
      rowType: savedCaption.row_type,
      serial_number: savedCaption.serial_number, // Add serial number field
      favorite_id: savedCaption.favorite_id,
      user_id: savedCaption.user_id,
      created_at: savedCaption.created_at,
      updated_at: savedCaption.updated_at
    }
    
    // Transformed saved caption
    return transformedCaption
  } catch (error) {
    console.error('❌ Error saving caption:', error)
    setDbError('Failed to save caption')
    return null
  } finally {
    setIsLoadingCaptions(false)
  }
}

/**
 * Update an existing caption in the database
 * @param {string} captionId - Caption ID to update
 * @param {Object} updates - Object containing updates
 * @param {string} userId - User ID for security
 * @param {Function} setIsLoadingCaptions - Loading state setter
 * @param {Function} setDbError - Error state setter
 * @returns {Promise<Object|null>} Updated caption or null if failed
 */
export const updateCaption = async (captionId, updates, userId, setIsLoadingCaptions, setDbError) => {
  try {
    setIsLoadingCaptions(true)
    setDbError(null)
    
    const { data, error } = await supabase
      .from('captions')
      .update({
        start_time: updates.startTime,
        end_time: updates.endTime,
        line1: updates.line1 || '',
        line2: updates.line2 || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', captionId)
      .eq('user_id', userId) // Security: only update own captions
      .select()
    
    if (error) throw error
    
    // Transform the updated caption to frontend format
    const updatedCaption = data[0]
    const transformedCaption = {
      id: updatedCaption.id,
      startTime: updatedCaption.start_time,
      endTime: updatedCaption.end_time,
      line1: updatedCaption.line1,
      line2: updatedCaption.line2,
      rowType: updatedCaption.row_type,
      serial_number: updatedCaption.serial_number, // Add serial number field
      favorite_id: updatedCaption.favorite_id,
      user_id: updatedCaption.user_id,
      created_at: updatedCaption.created_at,
      updated_at: updatedCaption.updated_at
    }
    
    // Transformed updated caption
    return transformedCaption
  } catch (error) {
    console.error('❌ Error updating caption:', error)
    setDbError('Failed to update caption')
    return null
  } finally {
    setIsLoadingCaptions(false)
  }
}

/**
 * Delete a caption from the database
 * @param {string} captionId - Caption ID to delete
 * @param {string} userId - User ID for security
 * @param {Function} setIsLoadingCaptions - Loading state setter
 * @param {Function} setDbError - Error state setter
 * @returns {Promise<boolean>} True if successful, false if failed
 */
export const deleteCaption = async (captionId, userId, setIsLoadingCaptions, setDbError) => {
  try {
    setIsLoadingCaptions(true)
    setDbError(null)
    
    const { error } = await supabase
      .from('captions')
      .delete()
      .eq('id', captionId)
      .eq('user_id', userId) // Security: only delete own captions
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error('❌ Error deleting caption:', error)
    setDbError('Failed to delete caption')
    return false
  } finally {
    setIsLoadingCaptions(false)
  }
}

/**
 * Add a video to favorites
 * @param {string} videoId - YouTube video ID
 * @param {string} videoTitle - Video title
 * @param {string} videoChannel - Channel name
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Favorite record or null if failed
 */
export const addFavorite = async (videoId, videoTitle, videoChannel, userId) => {
  try {
    if (!userId || !videoId) return null
    
    const { data, error } = await supabase
      .from('favorites')
      .insert([{
        user_id: userId,
        video_id: videoId,
        video_title: videoTitle,
        channel_name: videoChannel
      }])
      .select()
    
    if (error) throw error
    
    return data[0]
  } catch (error) {
    console.error('❌ Error adding favorite:', error)
    return null
  }
}
