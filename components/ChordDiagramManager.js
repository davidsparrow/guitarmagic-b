/**
 * 🎸 Chord Diagram Manager Component
 * 
 * Manages chord captions for the middle row in watch.js
 * Handles chord selection, timing, and display
 * 
 * Features:
 * - Chord selection (Root Note + Modifier)
 * - Time validation with helpful suggestions
 * - Responsive grid layout
 * - Video timeline synchronization
 */

import React, { useState, useEffect } from 'react'
import { 
  validateChordTimes, 
  isValidTimeFormat, 
  getTimeFormatSuggestion,
  ROOT_NOTES,
  CHORD_MODIFIERS,
  buildChordName,
  loadChordCaptions as loadChordsFromDB,
  createChordCaption as createChordInDB
} from '../song_data_processing/chord_processing/chordCaptionUtils'

/**
 * Chord Diagram Manager Component
 * 
 * @param {Object} props
 * @param {string} props.favoriteId - ID of the current favorite video
 * @param {number} props.videoDurationSeconds - Video duration in seconds
 * @param {number} props.currentTimeSeconds - Current video playback time
 * @param {boolean} props.isVisible - Whether this row is currently visible
 */
export default function ChordDiagramManager({ 
  favoriteId, 
  videoDurationSeconds = 0, 
  currentTimeSeconds = 0, 
  isVisible = true 
}) {
  // State for chord captions
  const [chords, setChords] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // State for adding new chords
  const [isAddingChord, setIsAddingChord] = useState(false)
  const [newChord, setNewChord] = useState({
    chord_name: '',
    start_time: '',
    end_time: ''
  })
  
  // State for validation
  const [validationErrors, setValidationErrors] = useState([])
  
  // State for video timeline integration
  const [activeChords, setActiveChords] = useState([])
  
  // Load chord captions when component mounts or favoriteId changes
  useEffect(() => {
    if (favoriteId && isVisible) {
      loadChordCaptions()
    }
  }, [favoriteId, isVisible])
  
  // Update active chords when current time or chords change
  useEffect(() => {
    if (chords.length > 0 && currentTimeSeconds >= 0) {
      updateActiveChords()
    }
  }, [currentTimeSeconds, chords])
  
  /**
   * Update which chords are currently active based on video time
   */
  const updateActiveChords = () => {
    const active = chords.filter(chord => {
      const startSeconds = parseTimeToSeconds(chord.start_time)
      const endSeconds = parseTimeToSeconds(chord.end_time)
      return currentTimeSeconds >= startSeconds && currentTimeSeconds <= endSeconds
    }).sort((a, b) => a.display_order - b.display_order)
    
    setActiveChords(active)
  }
  
  /**
   * Parse time string to seconds (helper function)
   */
  const parseTimeToSeconds = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return 0
    
    const parts = timeString.split(':').map(Number)
    
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    
    return 0
  }
  
  /**
   * Load chord captions from database
   */
  const loadChordCaptions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use real database function
      const result = await loadChordsFromDB(favoriteId)
      
      if (result.success) {
        setChords(result.data || [])
      } else {
        setError(result.error || 'Failed to load chord captions')
      }
      
    } catch (err) {
      console.error('❌ Error loading chord captions:', err)
      
      // Fallback to mock data for testing
      if (favoriteId.includes('test-')) {
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
          },
          {
            id: 'mock-5',
            chord_name: 'Am',
            start_time: '2:00',
            end_time: '2:30',
            display_order: 5
          },
          {
            id: 'mock-6',
            chord_name: 'F',
            start_time: '2:30',
            end_time: '3:00',
            display_order: 6
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
   * Handle chord name selection
   */
  const handleChordSelection = (rootNote, modifier) => {
    const chordName = buildChordName(rootNote, modifier)
    setNewChord(prev => ({ ...prev, chord_name: chordName }))
  }
  
  /**
   * Handle time input changes with validation
   */
  const handleTimeChange = (field, value) => {
    setNewChord(prev => ({ ...prev, [field]: value }))
    
    // Clear previous validation errors for this field
    setValidationErrors(prev => prev.filter(err => err.field !== field))
    
    // Validate the time format
    if (value && !isValidTimeFormat(value)) {
      const suggestion = getTimeFormatSuggestion(value)
      setValidationErrors(prev => [...prev, {
        field,
        message: suggestion,
        type: 'format'
      }])
    }
  }
  
  /**
   * Validate the complete chord before saving
   */
  const validateChord = () => {
    if (!newChord.chord_name) {
      setValidationErrors([{ field: 'chord_name', message: 'Please select a chord', type: 'required' }])
      return false
    }
    
    if (!newChord.start_time || !newChord.end_time) {
      setValidationErrors([{ field: 'timing', message: 'Please enter both start and end times', type: 'required' }])
      return false
    }
    
    // Use our validation utility
    const validation = validateChordTimes(newChord, videoDurationSeconds)
    
    if (!validation.isValid) {
      const errors = validation.failures.map(failure => ({
        field: 'timing',
        message: failure.reason,
        type: 'validation'
      }))
      setValidationErrors(errors)
      return false
    }
    
    return true
  }
  
  /**
   * Save the new chord caption
   */
  const handleSaveChord = async () => {
    if (!validateChord()) {
      return
    }
    
    try {
      // For testing: add directly to local state (skip database)
      if (favoriteId.includes('test-')) {
        console.log('🔄 Adding mock chord for testing:', newChord)
        
        const mockChord = {
          id: `mock-${Date.now()}`, // Generate unique mock ID
          chord_name: newChord.chord_name,
          start_time: newChord.start_time,
          end_time: newChord.end_time,
          display_order: chords.length + 1
        }
        
        setChords(prev => [...prev, mockChord])
        
        // Reset form
        setNewChord({ chord_name: '', start_time: '', end_time: '' })
        setValidationErrors([])
        setIsAddingChord(false)
        
        // Show success message
        setError('✅ Chord added successfully! (Mock mode)')
        setTimeout(() => setError(null), 3000) // Clear after 3 seconds
        
        console.log('✅ Mock chord added successfully:', mockChord)
        
      } else {
        // Real database call (when not testing)
        const result = await createChordInDB(newChord, favoriteId, 'user-id-placeholder')
        
        if (result.success) {
          setChords(prev => [...prev, result.data])
          setNewChord({ chord_name: '', start_time: '', end_time: '' })
          setValidationErrors([])
          setIsAddingChord(false)
          console.log('✅ Chord saved successfully:', result.data)
        } else {
          setError(result.error || 'Failed to save chord caption')
        }
      }
      
    } catch (err) {
      console.error('❌ Error saving chord:', err)
      setError('Failed to save chord caption')
    }
  }
  
  /**
   * Cancel adding new chord
   */
  const handleCancelChord = () => {
    setNewChord({ chord_name: '', start_time: '', end_time: '' })
    setValidationErrors([])
    setIsAddingChord(false)
  }
  
  // Don't render if not visible
  if (!isVisible) {
    return null
  }
  
  // Helper to format time (e.g., 1:30 -> 1:30)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  return (
    <div className="chord-diagram-manager">
      {/* Header */}
      <div className="chord-header">
        <h3 className="chord-title">🎸 Chord Captions</h3>
        <button 
          onClick={() => setIsAddingChord(true)}
          className="add-chord-btn"
          disabled={isAddingChord}
        >
          {isAddingChord ? 'Adding...' : '+ Add Chord'}
        </button>
      </div>
      
      {/* Add Chord Form */}
      {isAddingChord && (
        <div className="add-chord-form">
          <h4>Add New Chord</h4>
          
          {/* Chord Selection */}
          <div className="chord-selection">
            <label>Chord:</label>
            <div className="chord-dropdowns">
              <select 
                onChange={(e) => handleChordSelection(e.target.value, newChord.modifier)}
                value={newChord.rootNote || ''}
              >
                <option value="">Select Root Note</option>
                {ROOT_NOTES.map(note => (
                  <option key={note.value} value={note.value}>
                    {note.label}
                  </option>
                ))}
              </select>
              
              <select 
                onChange={(e) => handleChordSelection(newChord.rootNote, e.target.value)}
                value={newChord.modifier || ''}
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
          <div className="timing-inputs">
            <div className="time-input">
              <label>Start Time:</label>
              <input
                type="text"
                placeholder="1:30"
                value={newChord.start_time}
                onChange={(e) => handleTimeChange('start_time', e.target.value)}
                className={validationErrors.some(err => err.field === 'start_time') ? 'error' : ''}
              />
            </div>
            
            <div className="time-input">
              <label>End Time:</label>
              <input
                type="text"
                placeholder="2:15"
                value={newChord.end_time}
                onChange={(e) => handleTimeChange('end_time', e.target.value)}
                className={validationErrors.some(err => err.field === 'end_time') ? 'error' : ''}
              />
            </div>
          </div>
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="validation-errors">
              {validationErrors.map((error, index) => (
                <div key={index} className="error-message">
                  {error.message}
                </div>
              ))}
            </div>
          )}
          
          {/* Form Actions */}
          <div className="form-actions">
            <button onClick={handleSaveChord} className="save-btn">
              Save Chord
            </button>
            <button onClick={handleCancelChord} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Chord Display */}
      <div className="chord-display">
        {isLoading ? (
          <div className="loading">Loading chord captions...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : chords.length === 0 ? (
          <div className="no-chords">
            No chord captions yet. Click "Add Chord" to get started!
          </div>
        ) : (
          <>
            {/* Active Chords Section */}
            {activeChords.length > 0 && (
              <div className="active-chords-section">
                <h4 className="section-title">🎯 Currently Playing</h4>
                <div 
                  className="active-chord-grid"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    minHeight: '90px',
                    alignItems: 'center'
                  }}
                >
                  {activeChords.map(chord => (
                    <div 
                      key={chord.id} 
                      className="chord-item active"
                      style={{
                        minWidth: '90px',
                        maxWidth: '120px',
                        height: '90px',
                        padding: '8px',
                        backgroundColor: '#4ade80',
                        border: '2px solid #22c55e',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div className="chord-name" style={{ fontSize: '18px', marginBottom: '4px' }}>
                        {chord.chord_name}
                      </div>
                      <div className="chord-timing" style={{ fontSize: '12px', opacity: 0.9 }}>
                        {chord.start_time} - {chord.end_time}
                      </div>
                      <div className="active-indicator" style={{ fontSize: '10px', marginTop: '4px' }}>
                        ▶️ Now Playing
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* All Chords Section */}
            <div className="all-chords-section">
              <h4 className="section-title">🎸 All Chord Captions</h4>
              <div 
                className="chord-grid"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '90px',
                  alignItems: 'center'
                }}
              >
                {chords.map(chord => {
                  const isActive = activeChords.some(active => active.id === chord.id)
                  return (
                    <div 
                      key={chord.id} 
                      className={`chord-item ${isActive ? 'active' : ''}`}
                      style={{
                        minWidth: '90px',
                        maxWidth: '120px',
                        height: '90px',
                        padding: '8px',
                        backgroundColor: isActive ? '#4ade80' : '#6b7280',
                        border: `2px solid ${isActive ? '#22c55e' : '#4b5563'}`,
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease-in-out',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="chord-name" style={{ fontSize: '18px', marginBottom: '4px' }}>
                        {chord.chord_name}
                      </div>
                      <div className="chord-timing" style={{ fontSize: '12px', opacity: 0.9 }}>
                        {chord.start_time} - {chord.end_time}
                      </div>
                      {isActive && (
                        <div className="active-indicator" style={{ fontSize: '10px', marginTop: '4px' }}>
                          ▶️ Now Playing
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Video Time Display */}
            <div className="video-time-display">
              <small>
                Current Time: {formatTime(currentTimeSeconds)} | 
                Total Chords: {chords.length} | 
                Active: {activeChords.length}
              </small>
            </div>
          </>
        )}
      </div>
      
      {/* Responsive CSS Styles */}
      <style jsx>{`
        .chord-diagram-manager {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }
        
        .chord-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 8px 0;
          border-bottom: 1px solid #374151;
        }
        
        .chord-title {
          font-size: 18px;
          font-weight: 600;
          color: #f9fafb;
          margin: 0;
        }
        
        .add-chord-btn {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .add-chord-btn:hover:not(:disabled) {
          background-color: #2563eb;
        }
        
        .add-chord-btn:disabled {
          background-color: #6b7280;
          cursor: not-allowed;
        }
        
        .add-chord-form {
          background-color: #1f2937;
          border: 1px solid #374151;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .add-chord-form h4 {
          margin: 0 0 16px 0;
          color: #f9fafb;
          font-size: 16px;
        }
        
        .chord-selection {
          margin-bottom: 16px;
        }
        
        .chord-selection label {
          display: block;
          margin-bottom: 8px;
          color: #d1d5db;
          font-weight: 500;
        }
        
        .chord-dropdowns {
          display: flex;
          gap: 8px;
        }
        
        .chord-dropdowns select {
          flex: 1;
          padding: 8px;
          border: 1px solid #4b5563;
          border-radius: 4px;
          background-color: #374151;
          color: #f9fafb;
        }
        
        .timing-inputs {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .time-input {
          flex: 1;
        }
        
        .time-input label {
          display: block;
          margin-bottom: 8px;
          color: #d1d5db;
          font-weight: 500;
        }
        
        .time-input input {
          width: 100%;
          padding: 8px;
          border: 1px solid #4b5563;
          border-radius: 4px;
          background-color: #374151;
          color: #f9fafb;
        }
        
        .time-input input.error {
          border-color: #ef4444;
        }
        
        .validation-errors {
          margin-bottom: 16px;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .form-actions {
          display: flex;
          gap: 8px;
        }
        
        .save-btn, .cancel-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .save-btn {
          background-color: #10b981;
          color: white;
        }
        
        .save-btn:hover {
          background-color: #059669;
        }
        
        .cancel-btn {
          background-color: #6b7280;
          color: white;
        }
        
        .cancel-btn:hover {
          background-color: #4b5563;
        }
        
        .section-title {
          color: #f9fafb;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px 0;
        }
        
        .active-chords-section {
          margin-bottom: 20px;
        }
        
        .all-chords-section {
          margin-bottom: 16px;
        }
        
        .video-time-display {
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          padding: 8px;
          background-color: #1f2937;
          border-radius: 4px;
        }
        
        .loading, .error, .no-chords {
          text-align: center;
          padding: 32px 16px;
          color: #9ca3af;
        }
        
        .error {
          color: #ef4444;
        }
        
        /* Responsive breakpoints */
        @media (max-width: 767px) {
          .chord-grid, .active-chord-grid {
            justify-content: flex-start;
            min-width: 360px; /* 4 cells × 90px */
          }
        }
        
        @media (min-width: 768px) and (max-width: 1023px) {
          .chord-grid, .active-chord-grid {
            justify-content: center;
            max-width: 630px; /* 7 cells × 90px */
          }
        }
        
        @media (min-width: 1024px) {
          .chord-grid, .active-chord-grid {
            justify-content: center;
            max-width: 810px; /* 9 cells × 90px */
          }
        }
      `}</style>
    </div>
  )
}
