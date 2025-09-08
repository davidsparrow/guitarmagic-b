/**
 * 🎸 Chord Caption Modal Component
 * 
 * Standalone modal for managing chord captions
 * Similar to CaptionModals.js but for chord-specific functionality
 * 
 * Features:
 * - Add new chord captions
 * - Edit existing chord captions
 * - Delete chord captions
 * - Duplicate chord captions
 * - Time validation with helpful suggestions
 * - Chord selection (Root Note + Modifier)
 * - Support for overlapping chord times
 */

import React, { useState, useEffect } from 'react'
import { FaPlus, FaTimes } from "react-icons/fa"
import { RiEdit2Fill } from "react-icons/ri"
import { CiSaveDown1 } from "react-icons/ci"
import { MdOutlineCancel, MdDeleteSweep } from "react-icons/md"
import { IoDuplicate } from "react-icons/io5"
import { 
  validateChordTimes, 
  isValidTimeFormat, 
  getTimeFormatSuggestion,
  ROOT_NOTES,
  CHORD_MODIFIERS,
  buildChordName,
  loadChordCaptions as loadChordsFromDB,
  createChordCaption as createChordInDB,
  updateChordCaption as updateChordInDB,
  deleteChordCaption as deleteChordInDB,
  deleteAllChordCaptionsForFavorite,
  parseTimeToSeconds,
  linkAllChordCaptionsToPositions
} from '../song_data_processing/chord_processing/chordCaptionUtils'
import { supabase } from '../lib/supabase/client'

/**
 * Chord Caption Modal Component
 * 
 * @param {Object} props
 * @param {boolean} props.showChordModal - Whether to show the modal
 * @param {Function} props.setShowChordModal - Function to close modal
 * @param {string} props.videoId - YouTube video ID of the current video
 * @param {number} props.videoDurationSeconds - Video duration in seconds
 * @param {number} props.currentTimeSeconds - Current video playback time
 * @param {Function} props.onChordsUpdated - Callback when chords are updated
 */
export const ChordCaptionModal = ({
  showChordModal,
  setShowChordModal,
  videoId,
  videoDurationSeconds = 0,
  currentTimeSeconds = 0,
  onChordsUpdated,
  userId,
  onCancel
}) => {
  // State for chord captions
  const [chords, setChords] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // State for adding new chords
  const [isAddingChord, setIsAddingChord] = useState(false)
  const [newChord, setNewChord] = useState({
    rootNote: '',
    modifier: '',
    start_time: '',
    end_time: ''
  })
  
  // State for editing existing chords
  const [editingChordId, setEditingChordId] = useState(null)
  const [editingChord, setEditingChord] = useState({
    chord_name: '',
    start_time: '',
    end_time: ''
  })
  
  // State for edit sub-modal
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Snapshot of original chord data for revert functionality
  const [originalChordSnapshot, setOriginalChordSnapshot] = useState(null)
  
  // Separate UI state for chord selection in edit mode
  const [editingChordUI, setEditingChordUI] = useState({
    rootNote: '',
    modifier: ''
  })
  
  // State for validation
  const [validationErrors, setValidationErrors] = useState([])
  
  // Load chord captions when modal opens
  useEffect(() => {
    if (showChordModal && videoId && userId) {
      loadChordCaptions()
    }
  }, [showChordModal, videoId, userId])
  
  /**
   * Load chord captions from database
   */
  const loadChordCaptions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // First get the favorite record for this video (similar to loadCaptions)
      const { data: favoriteData, error: favoriteError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single()
      
      if (favoriteError) {
        if (favoriteError.code === 'PGRST116') {
          // No favorite found
          setError('Video must be favorited to load chord captions')
          return
        }
        throw favoriteError
      }
      
      // Now get chord captions for this favorite using the UUID
      const result = await loadChordsFromDB(favoriteData.id)
      
              if (result.success) {
          setChords(result.data || [])
          // Notify parent component to update its chordCaptions state
          if (onChordsUpdated) {
            onChordsUpdated(result.data || [])
          }
        } else {
        setError(result.error || 'Failed to load chord captions')
      }
      
    } catch (err) {
      console.error('❌ Error loading chord captions:', err)
      
      // Fallback to mock data for testing
      if (videoId.includes('test-')) {
        console.log('🔄 Using mock data for testing')
        const mockChords = [
          {
            id: 'mock-1',
            chord_name: 'Am',
            start_time: '0:00',
            end_time: '0:30',
            display_order: 1
          },
          {
            id: 'mock-2', 
            chord_name: 'C',
            start_time: '0:30',
            end_time: '1:00',
            display_order: 2
          },
          {
            id: 'mock-3',
            chord_name: 'F',
            start_time: '1:00',
            end_time: '1:30',
            display_order: 3
          },
          {
            id: 'mock-4',
            chord_name: 'G',
            start_time: '1:30',
            end_time: '2:00',
            display_order: 4
          }
        ]
        setChords(mockChords)
        setError(null)
      } else {
        setError('Failed to load chord captions')
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Handle chord selection (root note + modifier)
   */
  const handleChordSelection = (rootNote, modifier) => {
    const chordName = buildChordName(rootNote, modifier)
    setNewChord(prev => ({
      ...prev,
      rootNote,
      modifier,
      chord_name: chordName
    }))
  }
  
  /**
   * Handle time input changes
   */
  const handleTimeChange = (field, value) => {
    setNewChord(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(err => err.field !== field))
  }
  
  /**
   * Validate the complete chord before saving
   */
  const validateChord = () => {
    const errors = []
    
    if (!newChord.chord_name) {
      errors.push({ field: 'chord_name', message: 'Please select both root note and modifier', type: 'required' })
    }
    
    if (!newChord.start_time || !newChord.end_time) {
      errors.push({ field: 'timing', message: 'Please enter both start and end times', type: 'required' })
    }
    
    if (newChord.start_time && newChord.end_time) {
      if (!isValidTimeFormat(newChord.start_time)) {
        errors.push({ 
          field: 'start_time', 
          message: `Invalid start time format: ${getTimeFormatSuggestion(newChord.start_time)}`, 
          type: 'validation' 
        })
      }
      if (!isValidTimeFormat(newChord.end_time)) {
        errors.push({ 
          field: 'end_time', 
          message: `Invalid end time format: ${getTimeFormatSuggestion(newChord.end_time)}`, 
          type: 'validation' 
        })
      }
      
      if (isValidTimeFormat(newChord.start_time) && isValidTimeFormat(newChord.end_time)) {
        // Use our validation utility
        const validation = validateChordTimes(newChord, videoDurationSeconds)
        
        if (!validation.isValid) {
          validation.failures.forEach(failure => {
            errors.push({
              field: 'timing',
              message: failure.reason,
              type: 'validation'
            })
          })
        }
      }
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }
  
  /**
   * Save the new chord caption
   */
  const handleSaveChord = async () => {
    if (!validateChord()) {
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const chordData = {
        chord_name: newChord.chord_name,
        start_time: newChord.start_time,
        end_time: newChord.end_time,
        display_order: chords.length + 1
      }
      
      // For testing: add directly to local state (skip database)
      if (videoId.includes('test-')) {
        console.log('🔄 Adding mock chord for testing:', chordData)
        
        const mockChord = {
          id: `mock-${Date.now()}`, // Generate unique mock ID
          ...chordData
        }
        
        setChords(prev => [...prev, mockChord])
        
        // Reset form
        setNewChord({
          rootNote: '',
          modifier: '',
          start_time: '',
          end_time: ''
        })
        setIsAddingChord(false)
        setValidationErrors([])
        
        // Show success message
        setError('✅ Chord added successfully! (Mock mode)')
        setTimeout(() => setError(null), 3000) // Clear after 3 seconds
        
        // Notify parent component
        if (onChordsUpdated) {
          onChordsUpdated([...chords, mockChord])
        }
        
        console.log('✅ Mock chord added successfully:', mockChord)
        
      } else {
        // Real database call (when not testing)
        if (!userId) {
          setError('User ID is required to create chord captions')
          return
        }
        
        // Get the favorite ID (UUID) for this video
        const { data: favoriteData, error: favoriteError } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('video_id', videoId)
          .single()
        
        if (favoriteError) {
          setError('Video must be favorited to create chord captions')
          return
        }
        
        const result = await createChordInDB(chordData, favoriteData.id, userId)
        
        if (result.success) {
          setChords(prev => [...prev, result.data])
          setNewChord({
            rootNote: '',
            modifier: '',
            start_time: '',
            end_time: ''
          })
          setIsAddingChord(false)
          setValidationErrors([])
          
          // Notify parent component
          if (onChordsUpdated) {
            onChordsUpdated([...chords, result.data])
          }
          
          console.log('✅ Chord saved successfully:', result.data)
        } else {
          setError(result.error || 'Failed to create chord caption')
        }
      }
      
    } catch (err) {
      console.error('❌ Error creating chord caption:', err)
      setError('Failed to create chord caption')
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Cancel adding new chord
   */
  const handleCancelChord = () => {
    setNewChord({
      rootNote: '',
      modifier: '',
      start_time: '',
      end_time: ''
    })
    setValidationErrors([])
    setIsAddingChord(false)
  }
  
  /**
   * Start editing an existing chord
   */
  const handleEditChord = (chord) => {
    setEditingChordId(chord.id)
    
    // Create snapshot of original chord data for revert functionality
    setOriginalChordSnapshot({
      id: chord.id,
      chord_name: chord.chord_name,
      start_time: chord.start_time,
      end_time: chord.end_time,
      chord_data: chord.chord_data,
      display_order: chord.display_order
    })
    
    // Parse the chord name to get root note and modifier
    const chordName = chord.chord_name || ''
    let rootNote = ''
    let modifier = ''
    
    // Try to extract root note and modifier from chord name
    if (chordName) {
      // Look for root note (first character or first two characters)
      for (let i = 1; i <= 2; i++) {
        const possibleRoot = chordName.substring(0, i)
        if (ROOT_NOTES.some(note => note.value === possibleRoot)) {
          rootNote = possibleRoot
          modifier = chordName.substring(i)
          break
        }
      }
    }
    
    setEditingChord({
      chord_name: chord.chord_name,
      start_time: chord.start_time,
      end_time: chord.end_time,
      rootNote: rootNote,
      modifier: modifier
    })
    
    // Set UI state for chord selection (separate from database fields)
    setEditingChordUI({
      rootNote: rootNote,
      modifier: modifier
    })
    
    setShowEditModal(true)
  }
  
  /**
   * Save edited chord
   */
  const handleSaveEditedChord = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // For testing: update local state
      if (videoId.includes('test-')) {
        setChords(prev => prev.map(chord => 
          chord.id === editingChordId 
            ? { ...chord, ...editingChord }
            : chord
        ))
        
        // Notify parent component
        if (onChordsUpdated) {
          const updatedChords = chords.map(chord => 
            chord.id === editingChordId 
              ? { ...chord, ...editingChord }
              : chord
          )
          onChordsUpdated(updatedChords)
        }
        
        setEditingChordId(null)
        setEditingChord({ chord_name: '', start_time: '', end_time: '' })
        setShowEditModal(false)
        
        setError('✅ Chord updated successfully! (Mock mode)')
        setTimeout(() => setError(null), 3000)
        
      } else {
        // Real database update - filter out non-database fields
        const { rootNote, modifier, ...dbFields } = editingChord
        
        // Get the favorite ID for this video
        const { data: favoriteData, error: favoriteError } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('video_id', videoId)
          .single()
        
        if (favoriteError) {
          setError('❌ Video must be favorited to update chord captions')
          return
        }
        
        const result = await updateChordInDB(editingChordId, dbFields, favoriteData.id)
        
        if (result.success) {
          // Update chords and re-sort by start time
          const updatedChords = chords.map(chord => 
            chord.id === editingChordId 
              ? { ...chord, ...dbFields }
              : chord
          )
          
          // Sort the updated chords by start time
          const sortedChords = sortChordsByStartTime(updatedChords)
          setChords(sortedChords)
          
          // Notify parent component
          if (onChordsUpdated) {
            onChordsUpdated(sortedChords)
          }
          
          setEditingChordId(null)
          setEditingChord({ chord_name: '', start_time: '', end_time: '' })
          setShowEditModal(false)
          
          console.log('✅ Chord updated successfully and list re-sorted')
        } else {
          setError(result.error || 'Failed to update chord caption')
        }
      }
      
    } catch (err) {
      console.error('❌ Error updating chord caption:', err)
      setError('Failed to update chord caption')
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Cancel editing chord
   */
  const handleCancelEditChord = () => {
    // Revert to original chord data from snapshot
    if (originalChordSnapshot) {
      setEditingChord({
        chord_name: originalChordSnapshot.chord_name,
        start_time: originalChordSnapshot.start_time,
        end_time: originalChordSnapshot.end_time
      })
      
      // Parse the original chord name to restore UI state
      const chordName = originalChordSnapshot.chord_name || ''
      let rootNote = ''
      let modifier = ''
      
      if (chordName) {
        for (let i = 1; i <= 2; i++) {
          const possibleRoot = chordName.substring(0, i)
          if (ROOT_NOTES.some(note => note.value === possibleRoot)) {
            rootNote = possibleRoot
            modifier = chordName.substring(i)
            break
          }
        }
      }
      
      setEditingChordUI({
        rootNote: rootNote,
        modifier: modifier
      })
    }
    
    setEditingChordId(null)
    setEditingChord({ chord_name: '', start_time: '', end_time: '' })
    setEditingChordUI({ rootNote: '', modifier: '' })
    setOriginalChordSnapshot(null)
    setShowEditModal(false)
  }
  
  /**
   * Duplicate a chord
   */
  const handleDuplicateChord = async (chord) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Create the duplicated chord data
      const chordData = {
        chord_name: chord.chord_name,
        start_time: chord.start_time, // Use original chord's start time
        end_time: calculateEndTime(chord.start_time, chord.end_time), // Calculate proper end time
        chord_data: chord.chord_data || null
      }
      
      // For testing: add to local state with mock ID
      if (videoId.includes('test-')) {
        const duplicatedChord = {
          ...chord,
          id: `duplicate-${Date.now()}`,
          start_time: chordData.start_time,
          end_time: chordData.end_time,
          display_order: chords.length + 1
        }
        
        setChords(prev => [...prev, duplicatedChord])
        
        // Notify parent component
        if (onChordsUpdated) {
          onChordsUpdated([...chords, duplicatedChord])
        }
        
        setError('✅ Chord duplicated successfully! (Mock mode)')
        setTimeout(() => setError(null), 3000)
        
      } else {
        // Real database call - save the duplicate immediately
        if (!userId) {
          setError('User ID is required to duplicate chord captions')
          return
        }
        
        // Get the favorite ID (UUID) for this video
        const { data: favoriteData, error: favoriteError } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('video_id', videoId)
          .single()
        
        if (favoriteError) {
          setError('Video must be favorited to duplicate chord captions')
          return
        }
        
        const result = await createChordInDB(chordData, favoriteData.id, userId)
        
        if (result.success) {
          // Add the new chord and re-sort by start time
          const updatedChords = [...chords, result.data]
          const sortedChords = sortChordsByStartTime(updatedChords)
          setChords(sortedChords)
          
          // Notify parent component with sorted chords
          if (onChordsUpdated) {
            onChordsUpdated(sortedChords)
          }
          
          console.log('✅ Chord duplicated successfully and list re-sorted:', result.data)
        } else {
          setError(result.error || 'Failed to duplicate chord caption')
        }
      }
      
    } catch (err) {
      console.error('❌ Error duplicating chord caption:', err)
      setError('Failed to duplicate chord caption')
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Delete a chord
   */
  const handleDeleteChord = async (chordId) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // For testing: remove from local state
      if (videoId.includes('test-')) {
        setChords(prev => prev.filter(chord => chord.id !== chordId))
        
        // Notify parent component
        if (onChordsUpdated) {
          onChordsUpdated(chords.filter(chord => chord.id !== chordId))
        }
        
        setError('✅ Chord deleted successfully! (Mock mode)')
        setTimeout(() => setError(null), 3000)
        
      } else {
        // Real database delete
        const result = await deleteChordInDB(chordId)
        
        if (result.success) {
          setChords(prev => prev.filter(chord => chord.id !== chordId))
          
          // Notify parent component
          if (onChordsUpdated) {
            onChordsUpdated(chords.filter(chord => chord.id !== chordId))
          }
          
          console.log('✅ Chord deleted successfully')
        } else {
          setError(result.error || 'Failed to delete chord caption')
        }
      }
      
    } catch (err) {
      console.error('❌ Error deleting chord caption:', err)
      setError('Failed to delete chord caption')
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Delete all chords
   */
  const handleDeleteAllChords = async () => {
    if (chords.length === 0) return
    
    if (confirm('Are you sure you want to delete ALL chord captions? This action cannot be undone.')) {
      try {
        setIsLoading(true)
        setError(null)
        
        // First get the favorite ID for this video
        const { data: favoriteData, error: favoriteError } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('video_id', videoId)
          .single()
        
        if (favoriteError) {
          setError('❌ Video must be favorited to delete chord captions')
          return
        }
        
        // Call the database function to delete all chords
        const result = await deleteAllChordCaptionsForFavorite(favoriteData.id)
        
        if (result.success) {
          // Clear local state after successful database deletion
          setChords([])
          
          // Notify parent component
          if (onChordsUpdated) {
            onChordsUpdated([])
          }
          
          setError(`✅ Successfully deleted ${result.deletedCount} chord captions!`)
          setTimeout(() => setError(null), 3000)
        } else {
          setError(`❌ Failed to delete: ${result.error}`)
          setTimeout(() => setError(null), 5000)
        }
      } catch (error) {
        console.error('❌ Error in handleDeleteAllChords:', error)
        setError(`❌ Failed to delete: ${error.message}`)
        setTimeout(() => setError(null), 5000)
      } finally {
        setIsLoading(false)
      }
    }
  }
  
  /**
   * Sort chords by start time (ascending) with creation order for identical times
   */
  const sortChordsByStartTime = (chordsToSort) => {
    return [...chordsToSort].sort((a, b) => {
      const aStart = parseTimeToSeconds(a.start_time)
      const bStart = parseTimeToSeconds(b.start_time)
      
      if (aStart !== bStart) {
        return aStart - bStart
      }
      
      // If start times are identical, maintain creation order (display_order)
      return (a.display_order || 0) - (b.display_order || 0)
    })
  }

  /**
   * Helper function to format seconds to time string
   */
  const formatTimeToTimeString = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  /**
   * Helper function to calculate the end time of a chord based on its start time and duration.
   * This is needed because the duplicate functionality should maintain the original chord's duration.
   */
  const calculateEndTime = (startTime, originalEndTime) => {
    const startSeconds = parseTimeToSeconds(startTime);
    const originalEndSeconds = parseTimeToSeconds(originalEndTime);
    const durationSeconds = originalEndSeconds - startSeconds;
    return formatTimeToTimeString(startSeconds + durationSeconds);
  };

  /**
   * Handle lookup and linking of all chord captions to their chord positions
   * This function is called when the user clicks the main SAVE button
   */
  const handleLookupAndLinkAllChords = async () => {
    try {
      console.log('🔍 Starting chord position lookup for all chord captions...')
      
      // Skip lookup if no chords exist
      if (!chords || chords.length === 0) {
        console.log('ℹ️  No chord captions to lookup')
        return
      }
      
      // Skip lookup if in test mode
      if (videoId.includes('test-')) {
        console.log('ℹ️  Skipping chord position lookup in test mode')
        return
      }
      
      // Call the lookup function from chordCaptionUtils
      const result = await linkAllChordCaptionsToPositions(chords)
      
      if (result.success) {
        console.log(`✅ Chord position lookup completed: ${result.linkedCount}/${result.totalCount} chord captions linked`)
        
        // If any chords were linked, reload the chord captions to get updated data
        if (result.linkedCount > 0) {
          console.log('🔄 Reloading chord captions to get updated chord_position_id data...')
          await loadChordCaptions()
        }
        
        // Log any errors that occurred
        if (result.errors && result.errors.length > 0) {
          console.warn(`⚠️  ${result.errors.length} errors occurred during lookup:`, result.errors)
        }
      } else {
        console.error('❌ Chord position lookup failed:', result.errors)
      }
      
    } catch (error) {
      console.error('❌ Error during chord position lookup:', error)
      // Don't show error to user, just log it
    }
  };
  
  if (!showChordModal) return null
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowChordModal(false)
        }
      }}
    >
      <div className="bg-black rounded-2xl shadow-2xl max-w-4xl w-full relative text-white p-6 max-h-[90vh] overflow-y-auto border-2 border-white/80">
        {/* Modal Title - Centered at top */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">
            🎸 Chord Caption Manager
          </h2>
        </div>
        
        {/* Header with action buttons */}
        <div className="flex items-center justify-between mb-6">
          {/* Left side - Add Chord and Delete All buttons */}
          <div className="flex items-center space-x-2">
            {/* Add Button */}
            <button
              onClick={() => setIsAddingChord(true)}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 flex items-center space-x-2 transition-all duration-200 hover:scale-105 shadow-lg"
              title="Add new chord caption"
            >
              <FaPlus className="w-4 h-4" />
            </button>
            
            {/* Delete All Button */}
            {chords.length > 0 && (
              <button
                onClick={handleDeleteAllChords}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                title="Delete all chord captions"
              >
                <MdDeleteSweep className="w-5 h-5" />
                <span className="text-sm">All</span>
              </button>
            )}
          </div>
          
          {/* Center - Current Video Time */}
          <div className="flex items-center space-x-2">
            <span className="text-blue-400 text-sm font-medium">
              Video Time: {formatTimeToTimeString(currentTimeSeconds)}
            </span>
            <span className="text-gray-400 text-sm">
              | Duration: {formatTimeToTimeString(videoDurationSeconds)}
            </span>
          </div>
          
          {/* Right side - Cancel, Test, and Save buttons */}
          <div className="flex items-center space-x-2">

            
            {/* Test Button with Confirmation */}
            <button
              onClick={() => {
                if (confirm('This is a TEST confirmation dialog. Click OK to proceed.')) {
                  // Call the same CANCEL ALL functionality as the grey Cancel button
                  if (onCancel) {
                    onCancel()
                  }
                }
              }}
              className="w-[95px] px-3 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm flex items-center justify-center space-x-1"
              title="Test confirmation dialog"
            >
              <MdOutlineCancel className="w-5 h-5" />
              <span>CANCEL</span>
            </button>
            
            {/* Save Button - LOOKUP + CLOSE MODAL */}
            <button
              onClick={async () => {
                // NEW: Lookup and link chord positions
                await handleLookupAndLinkAllChords()
                
                // EXISTING: Close modal
                setShowChordModal(false)
              }}
              className="w-20 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-1"
              title="Lookup chord positions and close modal"
            >
              <CiSaveDown1 className="w-6 h-6" />
              <span>Save</span>
            </button>
          </div>
        </div>
        
        {/* Add New Chord Form */}
        {isAddingChord && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-600">
            <h3 className="text-lg font-semibold mb-4">Add New Chord Caption</h3>
            
            {/* Chord Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Chord:</label>
              <div className="flex space-x-2">
                <select 
                  value={newChord.rootNote}
                  onChange={(e) => handleChordSelection(e.target.value, newChord.modifier)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="">Select Root Note</option>
                  {ROOT_NOTES.map(note => (
                    <option key={note.value} value={note.value}>
                      {note.label}
                    </option>
                  ))}
                </select>
                
                <select 
                  value={newChord.modifier}
                  onChange={(e) => handleChordSelection(newChord.rootNote, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="">Major</option>
                  {CHORD_MODIFIERS.filter(m => m.value !== '').map(mod => (
                    <option key={mod.value} value={mod.value}>
                      {mod.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Timing Inputs */}
            <div className="flex space-x-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Time:</label>
                <input
                  type="text"
                  placeholder="1:30"
                  value={newChord.start_time}
                  onChange={(e) => handleTimeChange('start_time', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none ${
                    validationErrors.some(err => err.field === 'start_time') 
                      ? 'border-red-500' 
                      : 'border-gray-600 focus:border-blue-400'
                  }`}
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">End Time:</label>
                <input
                  type="text"
                  placeholder="2:00"
                  value={newChord.end_time}
                  onChange={(e) => handleTimeChange('end_time', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded text-white focus:outline-none ${
                    validationErrors.some(err => err.field === 'end_time') 
                      ? 'border-red-500' 
                      : 'border-gray-600 focus:border-blue-400'
                  }`}
                />
              </div>
            </div>
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mb-4">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-red-400 text-sm mb-1">
                    {error.message}
                  </div>
                ))}
              </div>
            )}
            
            {/* Form Actions */}
            <div className="flex space-x-2">
              <button
                onClick={handleSaveChord}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <CiSaveDown1 className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save Chord'}</span>
              </button>
              
              <button
                onClick={handleCancelChord}
                className="px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400">
            {error}
          </div>
        )}
        
        {/* Chords List */}
        <div className="space-y-0">
          {chords.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No chord captions yet. Use the Add Chord button to create your first chord!</p>
            </div>
          ) : (
            chords.map((chord, index) => (
              <div 
                key={chord.id} 
                className="border-b border-gray-700 last:border-b-0"
              >

                  <div className="flex items-center space-x-4 py-3">
                    <div className="flex-1">
                      <span className="text-lg font-bold text-blue-400">
                        {chord.chord_name}
                      </span>
                    </div>
                    
                    <div className="flex-1 text-sm text-gray-300">
                      {chord.start_time} - {chord.end_time}
                    </div>
                    
                    <div className="flex-1 text-xs text-gray-500">
                      Order: {chord.display_order}
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditChord(chord)}
                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded transition-colors"
                        title="Edit chord"
                      >
                        <RiEdit2Fill className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDuplicateChord(chord)}
                        className="p-1 text-green-400 hover:text-green-300 hover:bg-white/10 rounded transition-colors"
                        title="Duplicate chord"
                      >
                        <IoDuplicate className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteChord(chord.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded transition-colors"
                        title="Delete chord"
                      >
                        <MdDeleteSweep className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Edit Chord Sub-Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full relative text-white p-6 border-2 border-blue-400/50">
            {/* Sub-Modal Title */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-blue-400">
                ✏️ Edit Chord Caption
              </h3>
            </div>
            
            {/* Edit Form */}
            <div className="space-y-4">
              {/* Chord Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Chord:</label>
                <div className="flex space-x-2">
                  <select 
                    value={editingChordUI.rootNote || ''}
                    onChange={(e) => {
                      const rootNote = e.target.value
                      const modifier = editingChordUI.modifier || ''
                      const chordName = buildChordName(rootNote, modifier)
                      setEditingChordUI(prev => ({ ...prev, rootNote }))
                      setEditingChord(prev => ({ ...prev, chord_name: chordName }))
                    }}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
                  >
                    <option value="">Select Root Note</option>
                    {ROOT_NOTES.map(note => (
                      <option key={note.value} value={note.value}>
                        {note.label}
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    value={editingChordUI.modifier || ''}
                    onChange={(e) => {
                      const modifier = e.target.value
                      const rootNote = editingChordUI.rootNote || ''
                      const chordName = buildChordName(rootNote, modifier)
                      setEditingChordUI(prev => ({ ...prev, modifier }))
                      setEditingChord(prev => ({ ...prev, chord_name: chordName }))
                    }}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
                  >
                    <option value="">Major</option>
                    {CHORD_MODIFIERS.filter(m => m.value !== '').map(mod => (
                      <option key={mod.value} value={mod.value}>
                        {mod.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time:</label>
                  <input
                    type="text"
                    value={editingChord.start_time}
                    onChange={(e) => setEditingChord(prev => ({ ...prev, start_time: e.target.value }))}
                    placeholder="0:00"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Time:</label>
                  <input
                    type="text"
                    value={editingChord.end_time}
                    onChange={(e) => setEditingChord(prev => ({ ...prev, end_time: e.target.value }))}
                    placeholder="0:30"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center space-x-3 pt-4">
                <button
                  onClick={handleSaveEditedChord}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                
                <button
                  onClick={handleCancelEditChord}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChordCaptionModal
