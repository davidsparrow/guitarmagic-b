import React from 'react'
import { FaPlus } from "react-icons/fa"
import { CiSaveDown1 } from "react-icons/ci"
import { MdOutlineCancel, MdDeleteSweep } from "react-icons/md"
import { IoDuplicate } from "react-icons/io5"

/**
 * CaptionModals Component
 * Contains all caption-related modal components extracted from pages/watch.js
 * Receives props from parent component for state and event handlers
 */

// Delete Confirmation Modal
export const DeleteConfirmModal = ({ 
  showDeleteConfirm, 
  setShowDeleteConfirm, 
  handleCancelDelete, 
  handleConfirmDelete 
}) => {
  if (!showDeleteConfirm) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowDeleteConfirm(false)
        }
      }}
    >
      <div className="bg-black rounded-2xl shadow-2xl max-w-sm w-full relative text-white p-6">
        {/* Modal Content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-4">Delete Caption?</h2>
          <p className="text-gray-300 text-sm">
            This action cannot be undone. Are you sure you want to delete this caption?
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleCancelDelete}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirmDelete}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  )
}

// Caption Editor Modal
export const CaptionEditorModal = ({
  showCaptionModal,
  editingCaption,
  captions,
  setCaptions,
  conflictRowIndex,
  userDefaultCaptionDuration,
  setUserDefaultCaptionDuration,
  handleCancelCaptions,
  handleAddCaptionFromTimeline,
  handleDeleteAllCaptions,
  handleSaveCaptions,
  handleDuplicateCaption,
  handleDeleteCaption,
  player,
  isPlayerReady,
  saveUserDefaultCaptionDuration,
  originalCaptionsSnapshot,
  showCustomAlertModal,
  hideCustomAlertModal
}) => {
  // Local state to prevent jumping during start time editing
  const [editingStartTime, setEditingStartTime] = React.useState('')
  const [editingStartTimeIndex, setEditingStartTimeIndex] = React.useState(null)

  if (!showCaptionModal) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Same behavior as Cancel button - revert changes and close modal
          handleCancelCaptions()
        }
      }}
    >
      <div className="bg-black rounded-2xl shadow-2xl max-w-4xl w-full relative text-white p-6 max-h-[90vh] overflow-y-auto border-2 border-white/80">
        {/* Modal Title - Centered at top */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">
            {editingCaption?.rowName} Editor
          </h2>
        </div>
        
        {/* Header with action buttons */}
        <div className="flex items-center justify-between mb-6">
          {/* Left side - Add Caption and Delete All buttons */}
          <div className="flex items-center space-x-2">
            {/* Add Button */}
            <button
              onClick={handleAddCaptionFromTimeline}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 flex items-center space-x-2 transition-all duration-200 hover:scale-105 shadow-lg"
              title="Add new caption"
            >
              <FaPlus className="w-4 h-4" />
            </button>
            
            {/* All Button */}
            {captions.length > 0 && (
              <button
                onClick={handleDeleteAllCaptions}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                title="Delete all captions"
              >
                <MdDeleteSweep className="w-5 h-5" />
                <span className="text-sm">All</span>
              </button>
            )}
          </div>
          
          {/* Center - Empty for spacing */}
          <div className="flex-1"></div>
          
          {/* Right side - Save and Cancel buttons */}
          <div className="flex items-center space-x-2">
            {/* Save Button */}
            <button
              onClick={handleSaveCaptions}
              className="w-20 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center justify-center space-x-1"
              title="Save all caption changes"
            >
              <CiSaveDown1 className="w-6 h-6" />
              <span>Save</span>
            </button>
            
            {/* Cancel Button */}
            <button
              onClick={() => {
                // Show confirmation modal with same message as Footer CANCEL button
                if (showCustomAlertModal) {
                  showCustomAlertModal(
                    'Cancelling reverts all changes. Proceed?',
                    [
                      { 
                        text: 'PROCEED', 
                        action: () => {
                          handleCancelCaptions()
                          if (hideCustomAlertModal) {
                            hideCustomAlertModal()
                          }
                        }
                      },
                      { text: 'KEEP EDITING', action: () => {
                        if (hideCustomAlertModal) {
                          hideCustomAlertModal()
                        }
                      }}
                    ]
                  )
                } else {
                  // Fallback to direct cancel if modal function not available
                  handleCancelCaptions()
                }
              }}
              className="w-[95px] px-3 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm flex items-center justify-center space-x-1"
              title="Cancel and revert all changes"
            >
              <MdOutlineCancel className="w-5 h-5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
        
        {/* Current Video Time Display - Below buttons, above captions */}
        <div className="mb-4 flex justify-between items-center">
          {/* Left side - Video Time */}
          <div className="ml-2">
            <span className="text-blue-400 text-sm font-medium">
              Video Time: {(() => {
                if (player && isPlayerReady()) {
                  try {
                    const currentTime = Math.floor(player.getCurrentTime())
                    const minutes = Math.floor(currentTime / 60)
                    const seconds = currentTime % 60
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`
                  } catch (error) {
                    return '0:00'
                  }
                }
                return '0:00'
              })()}
            </span>
          </div>
          
          {/* Right side - New Caption Length */}
          <div className="flex items-center space-x-2">
            <span className="text-blue-400 text-sm font-medium">
              New Caption Length:
            </span>
            <input
              type="number"
              min="1"
              max="3600"
              value={userDefaultCaptionDuration || 10}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 10
                setUserDefaultCaptionDuration(value)
                // Save to user profile in Supabase
                saveUserDefaultCaptionDuration(value)
              }}
              className="w-16 px-2 py-1 text-xs bg-transparent text-blue-400 border border-white/20 rounded focus:border-blue-400 focus:outline-none text-center"
            />
            <span className="text-blue-400 text-sm font-medium">
              sec
            </span>
          </div>
        </div>
        
        {/* Captions List */}
        <div className="space-y-0 mb-6">
          {captions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>No captions yet. Use the + button on the video to add your first caption!</p>
            </div>
          ) : (
            captions.map((caption, index) => (
              <div 
                key={caption.id} 
                className={`transition-all duration-200 ${
                  conflictRowIndex === index 
                    ? 'border-l-4 border-red-500 bg-red-500/5' 
                    : ''
                }`}
              >
                <div className="flex items-start space-x-3 py-2">
                  {/* Serial Number - Small, floating, no background, aligned with times */}
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-sm font-bold text-blue-400">
                      {caption.serial_number || index + 1}
                    </span>
                  </div>
                  
                  {/* Caption Content - Compact 3-row layout */}
                  <div className="flex-1 space-y-1">
                    {/* Row 1: Time-start and Time-stop */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingStartTimeIndex === index ? editingStartTime : caption.startTime}
                        onChange={(e) => {
                          const newValue = e.target.value
                          
                          // Allow empty field for clearing
                          if (newValue === '') {
                            setEditingStartTime('')
                            setEditingStartTimeIndex(index)
                            return
                          }
                          
                          // Check for any non-numeric characters (except colons)
                          if (/[^0-9:]/.test(newValue)) {
                            console.log(`⚠️  Invalid character detected: ${newValue}, reverting caption #${index + 1}`)
                            // Find original value from snapshot
                            const originalCaption = originalCaptionsSnapshot?.find(c => c.id === caption.id)
                            const originalValue = originalCaption?.startTime || caption.startTime
                            console.log(`🔍 Original start time: ${originalValue}`)
                            // Revert to original value
                            setEditingStartTime(originalValue)
                            console.log(`✅ Reverted to original value: ${originalValue}`)
                            return
                          }
                          
                          // Allow intermediate states while building time value
                          // Examples: "1", "1:", "1:3", "1:30", "1:3:", "1:30:4", "1:30:45"
                          if (/^(\d{1,2}:)*\d{0,2}$/.test(newValue)) {
                            setEditingStartTime(newValue)
                            setEditingStartTimeIndex(index)
                            return
                          }
                          
                          // If we get here, the format is invalid - revert
                          console.log(`⚠️  Invalid time format: ${newValue}, reverting caption #${index + 1}`)
                          const originalCaption = originalCaptionsSnapshot?.find(c => c.id === caption.id)
                          const originalValue = originalCaption?.startTime || caption.startTime
                          setEditingStartTime(originalValue)
                        }}
                        onFocus={() => {
                          setEditingStartTime(caption.startTime)
                          setEditingStartTimeIndex(index)
                        }}
                        onBlur={() => {
                          // Auto-correct incomplete time entries
                          let finalValue = editingStartTime
                          
                          if (finalValue) {
                            // Rule 1: M:S → M:S0 (add trailing zero to seconds)
                            if (/^\d{1,2}:\d$/.test(finalValue)) {
                              finalValue = finalValue + '0'
                              console.log(`🔧 Auto-corrected: ${editingStartTime} → ${finalValue}`)
                            }
                            
                            // Rule 2: H:M:SS → H:0M:SS (add leading zero to minutes)
                            if (/^\d{1,2}:\d:\d{2}$/.test(finalValue)) {
                              const segments = finalValue.split(':')
                              if (segments[1].length === 1) {
                                finalValue = `${segments[0]}:0${segments[1]}:${segments[2]}`
                                console.log(`🔧 Auto-corrected: ${editingStartTime} → ${finalValue}`)
                              }
                            }
                            
                            // Rule 3: H:MM:S → H:MM:S0 (add trailing zero to seconds in H:MM:SS)
                            if (/^\d{1,2}:\d{2}:\d$/.test(finalValue)) {
                              finalValue = finalValue + '0'
                              console.log(`🔧 Auto-corrected: ${editingStartTime} → ${finalValue}`)
                            }
                          }
                          
                          // Update the actual caption with corrected value
                          const newCaptions = [...captions]
                          newCaptions[index].startTime = finalValue
                          setCaptions(newCaptions)
                          // Reset local state
                          setEditingStartTime('')
                          setEditingStartTimeIndex(null)
                        }}
                        className="w-16 px-2 py-1 text-xs bg-transparent text-blue-400 border border-white/20 focus:border-blue-400 focus:outline-none rounded"
                        placeholder="Start"
                      />
                      <span className="text-gray-400 text-xs">to</span>
                      <input
                        type="text"
                        value={caption.endTime}
                        onChange={(e) => {
                          const newValue = e.target.value
                          
                          // Allow empty field for clearing
                          if (newValue === '') {
                            const newCaptions = [...captions]
                            newCaptions[index].endTime = ''
                            setCaptions(newCaptions)
                            return
                          }
                          
                          // Check for any non-numeric characters (except colons)
                          if (/[^0-9:]/.test(newValue)) {
                            console.log(`⚠️  Invalid character detected in end time: ${newValue}, reverting caption #${index + 1}`)
                            // Find original value from snapshot
                            const originalCaption = originalCaptionsSnapshot?.find(c => c.id === caption.id)
                            const originalValue = originalCaption?.endTime || caption.endTime
                            console.log(`🔍 Original end time: ${originalValue}`)
                            // Revert to original value
                            const newCaptions = [...captions]
                            newCaptions[index].endTime = originalValue
                            setCaptions(newCaptions)
                            return
                          }
                          
                          // Allow intermediate states while building time value
                          // Examples: "1", "1:", "1:3", "1:30", "1:3:", "1:30:4", "1:30:45"
                          if (/^(\d{1,2}:)*\d{0,2}$/.test(newValue)) {
                            const newCaptions = [...captions]
                            newCaptions[index].endTime = newValue
                            setCaptions(newCaptions)
                            return
                          }
                          
                          // If we get here, the format is invalid - revert
                          console.log(`⚠️  Invalid time format in end time: ${newValue}, reverting caption #${index + 1}`)
                          const originalCaption = originalCaptionsSnapshot?.find(c => c.id === caption.id)
                          const originalValue = originalCaption?.endTime || caption.endTime
                          const newCaptions = [...captions]
                          newCaptions[index].endTime = originalValue
                          setCaptions(newCaptions)
                        }}
                        onBlur={() => {
                          // Auto-correct incomplete time entries for end time
                          let finalValue = caption.endTime
                          
                          if (finalValue) {
                            // Rule 1: M:S → M:S0 (add trailing zero to seconds)
                            if (/^\d{1,2}:\d$/.test(finalValue)) {
                              finalValue = finalValue + '0'
                              console.log(`🔧 Auto-corrected end time: ${caption.endTime} → ${finalValue}`)
                            }
                            
                            // Rule 2: H:M:SS → H:0M:SS (add leading zero to minutes)
                            if (/^\d{1,2}:\d:\d{2}$/.test(finalValue)) {
                              const segments = finalValue.split(':')
                              if (segments[1].length === 1) {
                                finalValue = `${segments[0]}:0${segments[1]}:${segments[2]}`
                                console.log(`🔧 Auto-corrected end time: ${caption.endTime} → ${finalValue}`)
                              }
                            }
                            
                            // Rule 3: H:MM:S → H:MM:S0 (add trailing zero to seconds in H:MM:SS)
                            if (/^\d{1,2}:\d{2}:\d$/.test(finalValue)) {
                              finalValue = finalValue + '0'
                              console.log(`🔧 Auto-corrected end time: ${caption.endTime} → ${finalValue}`)
                            }
                          }
                          
                          // Update the actual caption with corrected value
                          if (finalValue !== caption.endTime) {
                            const newCaptions = [...captions]
                            newCaptions[index].endTime = finalValue
                            setCaptions(newCaptions)
                          }
                        }}
                        className="w-16 px-2 py-1 text-xs bg-transparent text-blue-400 border border-white/20 focus:border-blue-400 focus:outline-none rounded"
                        placeholder="End"
                      />
                    </div>
                    
                    {/* Row 2: Text Caption Line 1 */}
                    <div>
                      <input
                        type="text"
                        value={caption.line1}
                        onChange={(e) => {
                          const newCaptions = [...captions]
                          newCaptions[index].line1 = e.target.value
                          setCaptions(newCaptions)
                        }}
                        className="w-full px-2 py-1 text-xs bg-transparent text-white border-b border-white/10 focus:border-blue-400 focus:outline-none font-bold"
                        placeholder="First line of caption"
                      />
                    </div>
                    
                    {/* Row 3: Text Caption Line 2 */}
                    <div>
                      <input
                        type="text"
                        value={caption.line2}
                        onChange={(e) => {
                          const newCaptions = [...captions]
                          newCaptions[index].line2 = e.target.value
                          setCaptions(newCaptions)
                        }}
                        className="w-full px-2 py-1 text-xs bg-transparent text-white border-b border-white/10 focus:border-blue-400 focus:outline-none"
                        placeholder="Second line of caption"
                      />
                    </div>
                  </div>
                  
                  {/* Action Buttons - Compact, horizontal layout */}
                  <div className="flex-shrink-0 flex items-center space-x-1">
                    {/* Duplicate Button */}
                    <button
                      onClick={() => handleDuplicateCaption(index)}
                      className="p-1 text-green-400 hover:text-green-300 hover:bg-white/10 rounded transition-colors"
                      title="Duplicate this caption"
                    >
                      <IoDuplicate className="w-4 h-4" />
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteCaption(index)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-white/10 rounded transition-colors"
                      title="Delete this caption"
                    >
                      <MdDeleteSweep className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Single line separator between rows (except last) */}
                {index < captions.length - 1 && (
                  <div className="border-b border-white/20"></div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Footer removed - all buttons moved to header */}
      </div>
    </div>
  )
}

// Loop Configuration Modal
export const LoopConfigModal = ({
  showLoopModal,
  setShowLoopModal,
  isLoopActive,
  tempLoopStart,
  tempLoopEnd,
  setTempLoopStart,
  setTempLoopEnd,
  handleCancelLoop,
  handleSaveLoop
}) => {
  if (!showLoopModal) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowLoopModal(false)
        }
      }}
    >
      <div className="bg-black rounded-2xl shadow-2xl max-w-sm w-full relative text-white p-6">
        {/* Close Button */}
        <button
          onClick={handleCancelLoop}
          className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
        >
          ×
        </button>
        
        {/* Modal Content */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {isLoopActive ? 'Edit Loop Segment' : 'Configure Loop Segment'}
          </h2>
        </div>
        
        {/* Loop Time Inputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-300 text-sm font-medium">Start Time:</label>
            <input
              type="text"
              value={tempLoopStart}
              onChange={(e) => setTempLoopStart(e.target.value)}
              placeholder="0:00"
              className="w-20 px-3 py-2 text-sm bg-white/20 text-white border border-white/30 rounded focus:border-blue-400 focus:outline-none"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-gray-300 text-sm font-medium">End Time:</label>
            <input
              type="text"
              value={tempLoopEnd}
              onChange={(e) => setTempLoopEnd(e.target.value)}
              placeholder="0:00"
              className="w-20 px-3 py-2 text-sm bg-white/20 text-white border border-white/30 rounded focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleCancelLoop}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveLoop}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {isLoopActive ? 'Update & Restart Loop' : 'Save & Start Loop'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Custom Alert Modal
export const CustomAlertModal = ({
  showCustomAlert,
  customAlertMessage,
  customAlertButtons
}) => {
  if (!showCustomAlert) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-600">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white">
            Alert, no need to panic. Yet.
          </h3>
        </div>
        
        {/* Message */}
        <div className="px-6 py-4">
          <p className="text-white text-base">{customAlertMessage}</p>
        </div>
        
        {/* Action Buttons */}
        {customAlertButtons.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-600 flex space-x-3 justify-end">
            {customAlertButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  index === 0 
                    ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Main CaptionModals component that exports all modals
export default {
  DeleteConfirmModal,
  CaptionEditorModal,
  LoopConfigModal,
  CustomAlertModal
}
