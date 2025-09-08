/**
 * Caption Management Utility Functions
 * Pure functions for caption operations - no state dependencies
 */

/**
 * Converts time string (MM:SS or HH:MM:SS) to seconds
 * @param {string} timeString - Time in format "MM:SS" or "HH:MM:SS"
 * @returns {number} Time in seconds
 */
export const parseTimeToSeconds = (timeString) => {
  if (!timeString) return 0
  const parts = timeString.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
  }
  return 0
}

/**
 * Converts seconds to formatted time string (MM:SS or HH:MM:SS)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatSecondsToTime = (seconds) => {
  if (seconds < 0) seconds = 0
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

/**
 * Alias for parseTimeToSeconds - consolidates duplicate functions
 * @param {string} timeStr - Time string to convert
 * @returns {number} Time in seconds
 */
export const timeToSeconds = (timeStr) => {
  // Add validation and logging for debugging
  if (!timeStr || typeof timeStr !== 'string') {
    console.warn('⚠️ timeToSeconds called with invalid value:', timeStr)
    return 0
  }
  return parseTimeToSeconds(timeStr)
}

/**
 * Assigns sequential serial numbers to captions based on start time
 * @param {Array} captionsArray - Array of caption objects
 * @returns {Array} Captions with assigned serial numbers
 */
export const assignSerialNumbersToCaptions = (captionsArray) => {
  if (!captionsArray || captionsArray.length === 0) return captionsArray
  
  const sortedCaptions = [...captionsArray].sort((a, b) => {
    const timeA = parseTimeToSeconds(a.startTime)
    const timeB = parseTimeToSeconds(b.startTime)
    return timeA - timeB
  })
  
  return sortedCaptions.map((caption, index) => ({
    ...caption,
    serial_number: index + 1
  }))
}

/**
 * Auto-resolves caption conflicts by adjusting start/stop times
 * @param {Array} captionsArray - Array of caption objects
 * @returns {Array} Captions with conflicts resolved
 */
export const autoResolveCaptionConflicts = (captionsArray) => {
  if (!captionsArray || captionsArray.length < 2) return captionsArray
  
  const sortedCaptions = [...captionsArray].sort((a, b) => {
    const timeA = parseTimeToSeconds(a.startTime)
    const timeB = parseTimeToSeconds(b.startTime)
    return timeA - timeB
  })
  
  let conflictsResolved = []
  let hasChanges = false
  
  for (let i = 0; i < sortedCaptions.length - 1; i++) {
    const currentCaption = sortedCaptions[i]
    const nextCaption = sortedCaptions[i + 1]
    
    const currentEndTime = parseTimeToSeconds(currentCaption.endTime)
    const nextStartTime = parseTimeToSeconds(nextCaption.startTime)
    
    // Check if there's an overlap or gap
    if (nextStartTime < currentEndTime) {
      // Conflict detected - adjust next caption's start time
      const oldStartTime = nextCaption.startTime
      const newStartTime = formatSecondsToTime(currentEndTime)
      
      // Update the next caption
      const updatedNextCaption = {
        ...nextCaption,
        startTime: newStartTime
      }
      
      // Replace in the array
      sortedCaptions[i + 1] = updatedNextCaption
      
      // Track the conflict resolution
      conflictsResolved.push({
        serialNumber: nextCaption.serial_number || i + 2,
        oldStartTime: oldStartTime,
        newStartTime: newStartTime,
        conflictingCaption: currentCaption.serial_number || i + 1
      })
      
      hasChanges = true
    }
  }
  
  return hasChanges ? sortedCaptions : captionsArray
}

/**
 * Validates that time string follows XX:XX format (MM:SS) or H:MM:SS format
 * @param {string} timeString - Time string to validate
 * @returns {boolean} True if valid MM:SS or H:MM:SS format
 */
export const isValidXXFormat = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return false
  
  // Must be exactly MM:SS format (2 parts) or H:MM:SS format (3 parts)
  const parts = timeString.split(':')
  if (parts.length !== 2 && parts.length !== 3) return false
  
  // Check each part is a valid number
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return false
  }
  
  if (parts.length === 2) {
    // MM:SS format validation
    const minutes = parseInt(parts[0])
    const seconds = parseInt(parts[1])
    
    // Must be non-negative and seconds < 60
    return minutes >= 0 && seconds >= 0 && seconds < 60
  } else {
    // H:MM:SS format validation
    const hours = parseInt(parts[0])
    const minutes = parseInt(parts[1])
    const seconds = parseInt(parts[2])
    
    // Must be non-negative, minutes < 60, seconds < 60
    return hours >= 0 && minutes >= 0 && minutes < 60 && seconds >= 0 && seconds < 60
  }
}

/**
 * Validates that start time is at least 0:00
 * @param {string} startTime - Start time string
 * @returns {Object} Validation result with details
 */
export const validateMinimumStartTime = (startTime) => {
  // First check format
  if (!isValidXXFormat(startTime)) {
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
 * Validates that end time is not beyond video duration
 * @param {string} endTime - End time string
 * @param {number} videoDurationSeconds - Video duration in seconds
 * @returns {Object} Validation result with details
 */
export const validateMaximumEndTime = (endTime, videoDurationSeconds) => {
  // First check format
  if (!isValidXXFormat(endTime)) {
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
 * Validates that a time point is not within another caption's range
 * @param {string} timePoint - Time to check (start or end time)
 * @param {number} captionIndex - Index of caption being edited
 * @param {Array} allCaptions - All captions array
 * @param {string} timeType - 'start' or 'end' for error messages
 * @returns {Object} Validation result with details
 */
export const validateTimeNotInOtherCaptionRange = (timePoint, captionIndex, allCaptions, timeType) => {
  // First check format
  if (!isValidXXFormat(timePoint)) {
    const rule = timeType === 'start' ? 1 : 2
    const timeTypeText = timeType === 'start' ? 'Start' : 'Stop'
    return {
      isValid: false,
      rule,
      reason: `${timeTypeText} time (${timePoint}) must be in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)`,
      suggestion: `Enter time in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)`
    }
  }
  
  const timeSeconds = parseTimeToSeconds(timePoint)
  
  console.log(`🔍 RULE ${timeType === 'start' ? '1' : '2'} VALIDATION:`)
  console.log(`   Checking ${timeType} time: ${timePoint} (${timeSeconds}s) for caption #${captionIndex + 1}`)
  
  for (let i = 0; i < allCaptions.length; i++) {
    if (i === captionIndex) {
      console.log(`   ⏭️  Skipping self (caption #${i + 1})`)
      continue // Skip the caption being edited
    }
    
    const otherCaption = allCaptions[i]
    const otherStart = parseTimeToSeconds(otherCaption.startTime)
    const otherEnd = parseTimeToSeconds(otherCaption.endTime)
    
    console.log(`   📋 Checking against caption #${i + 1}: ${otherCaption.startTime} (${otherStart}s) - ${otherCaption.endTime} (${otherEnd}s)`)
    
    // Check if time point is within this caption's range
    // Changed from inclusive (>=, <=) to exclusive (>, <) to allow touching captions
    const isInRange = timeSeconds > otherStart && timeSeconds < otherEnd
    console.log(`   🔍 Range check: ${timeSeconds}s > ${otherStart}s && ${timeSeconds}s < ${otherEnd}s = ${isInRange}`)
    
    if (isInRange) {
      const rule = timeType === 'start' ? 1 : 2
      const timeTypeText = timeType === 'start' ? 'Start' : 'Stop'
      
      console.log(`   ❌ RULE ${rule} FAILED: ${timeTypeText} time ${timePoint} is inside caption #${i + 1} range`)
      
      return {
        isValid: false,
        rule,
        reason: `${timeTypeText} time (${timePoint}) is within caption #${otherCaption.serial_number || i + 1} range (${otherCaption.startTime} - ${otherCaption.endTime})`,
        suggestion: `${timeTypeText} time must be outside all other caption ranges`,
        conflictingCaptionIndex: i
      }
    } else {
      console.log(`   ✅ Range check passed for caption #${i + 1}`)
    }
  }
  
  const rule = timeType === 'start' ? 1 : 2
  console.log(`   🎉 RULE ${rule} PASSED: ${timeType} time ${timePoint} is valid`)
  return { isValid: true, rule: rule }
}

/**
 * Validates that new caption range doesn't completely contain the next caption
 * @param {string} newStartTime - New start time
 * @param {string} newEndTime - New end time
 * @param {number} captionIndex - Index of caption being edited
 * @param {Array} allCaptions - All captions array
 * @returns {Object} Validation result with details
 */
export const validateRangeNotContainingNextCaption = (newStartTime, newEndTime, captionIndex, allCaptions) => {
  // First check format
  if (!isValidXXFormat(newStartTime) || !isValidXXFormat(newEndTime)) {
    return {
      isValid: false,
      rule: 3,
      reason: `Time values must be in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)`,
      suggestion: `Enter times in MM:SS or H:MM:SS format (e.g., 0:00, 1:30, 2:20:18)`
    }
  }
  
  // Sort captions by start time to find the next one
  const sortedCaptions = [...allCaptions].sort((a, b) => {
    const timeA = parseTimeToSeconds(a.startTime)
    const timeB = parseTimeToSeconds(b.startTime)
    return timeA - timeB
  })
  
  // Find the current caption in sorted order
  const currentCaption = allCaptions[captionIndex]
  const currentSortedIndex = sortedCaptions.findIndex(c => c.id === currentCaption.id)
  
  // Check if there's a next caption (not the last one)
  if (currentSortedIndex < sortedCaptions.length - 1) {
    const nextCaption = sortedCaptions[currentSortedIndex + 1]
    
    // 🆕 ADD SELF-VALIDATION PROTECTION: Skip if next caption is the same as current
    if (nextCaption.id === currentCaption.id) {
      console.log(`   ⏭️  RULE 3: Skipping self-validation (next caption is same as current)`)
      return { isValid: true, rule: 3 }
    }
    
    const newStartSeconds = parseTimeToSeconds(newStartTime)
    const newEndSeconds = parseTimeToSeconds(newEndTime)
    const nextStartSeconds = parseTimeToSeconds(nextCaption.startTime)
    const nextEndSeconds = parseTimeToSeconds(nextCaption.endTime)
    
    // Check if new range completely contains next caption
    if (newStartSeconds <= nextStartSeconds && newEndSeconds >= nextEndSeconds) {
      return {
        isValid: false,
        rule: 3,
        reason: `New time range (${newStartTime} - ${newEndTime}) completely contains the next caption #${nextCaption.serial_number || currentSortedIndex + 2} (${nextCaption.startTime} - ${nextCaption.endTime})`,
        suggestion: `Time range must not completely contain other captions`,
        conflictingCaptionIndex: allCaptions.findIndex(c => c.id === nextCaption.id)
      }
    }
  }
  
  return { isValid: true, rule: 3 }
}

/**
 * Validates that start time is before or equal to end time
 * @param {string} startTime - Start time string
 * @param {string} endTime - End time string
 * @returns {Object} Validation result with details
 */
export const validateStartBeforeEnd = (startTime, endTime) => {
  // First check format
  if (!isValidXXFormat(startTime) || !isValidXXFormat(endTime)) {
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
      reason: `Start time (${startTime}) cannot equal end time (${endTime}) - caption must have duration`,
      suggestion: `End time must be after start time to create a valid caption duration`
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
 * Comprehensive validation of a single caption's times
 * @param {Object} caption - Caption object to validate
 * @param {number} captionIndex - Index of caption in array
 * @param {Array} allCaptions - All captions array
 * @param {number} videoDurationSeconds - Video duration in seconds
 * @returns {Object} Validation result with all rule results
 */
export const validateCaptionTimes = (caption, captionIndex, allCaptions, videoDurationSeconds) => {
  const results = {
    isValid: true,
    captionIndex,
    failures: [],
    suggestions: []
  }
  
  // Rule 4: Start ≤ End
  const startEndValidation = validateStartBeforeEnd(caption.startTime, caption.endTime)
  if (!startEndValidation.isValid) {
    results.isValid = false
    results.failures.push(startEndValidation)
  }
  
  // Rule 5: Start ≥ 0:00
  const minStartValidation = validateMinimumStartTime(caption.startTime)
  if (!minStartValidation.isValid) {
    results.isValid = false
    results.failures.push(minStartValidation)
  }
  
  // Rule 6: End ≤ Video Duration
  const maxEndValidation = validateMaximumEndTime(caption.endTime, videoDurationSeconds)
  if (!maxEndValidation.isValid) {
    results.isValid = false
    results.failures.push(maxEndValidation)
  }
  
  // Rule 1: Start time not in other caption ranges
  const startOverlapValidation = validateTimeNotInOtherCaptionRange(caption.startTime, captionIndex, allCaptions, 'start')
  if (!startOverlapValidation.isValid) {
    results.isValid = false
    results.failures.push(startOverlapValidation)
  }
  
  // Rule 2: End time not in other caption ranges
  const endOverlapValidation = validateTimeNotInOtherCaptionRange(caption.endTime, captionIndex, allCaptions, 'end')
  if (!endOverlapValidation.isValid) {
    results.isValid = false
    results.failures.push(endOverlapValidation)
  }
  
  // Rule 3: Range doesn't contain next caption
  const containmentValidation = validateRangeNotContainingNextCaption(caption.startTime, caption.endTime, captionIndex, allCaptions)
  if (!containmentValidation.isValid) {
    results.isValid = false
    results.failures.push(containmentValidation)
  }
  
  // Collect all suggestions
  results.suggestions = results.failures.map(failure => failure.suggestion)
  
  return results
}

/**
 * Validates all captions in an array
 * @param {Array} captions - Array of captions to validate
 * @param {number} videoDurationSeconds - Video duration in seconds
 * @returns {Object} Validation result for all captions
 */
export const validateAllCaptions = (captions, videoDurationSeconds) => {
  const results = {
    isValid: true,
    totalFailures: 0,
    captionResults: [],
    allFailures: []
  }
  
  for (let i = 0; i < captions.length; i++) {
    // Validate ALL captions regardless of ID status
    const captionResult = validateCaptionTimes(captions[i], i, captions, videoDurationSeconds)
    results.captionResults.push(captionResult)
    
    if (!captionResult.isValid) {
      results.isValid = false
      results.totalFailures += captionResult.failures.length
      results.allFailures.push(...captionResult.failures)
    }
  }
  
  return results
}

/**
 * Smart Duration Calculation Utilities
 * Pure functions for calculating optimal caption durations
 */

/**
 * Calculates smart caption duration that avoids overlaps with existing captions
 * @param {number} currentTime - Current video time in seconds
 * @param {Array} captions - Array of existing captions
 * @param {number} userDefaultDuration - User's preferred caption duration in seconds
 * @param {number} videoDuration - Video duration in seconds
 * @returns {Object} Object with startTime, endTime, wasTrimmed, and reason
 */
export const calculateSmartCaptionDuration = (currentTime, captions, userDefaultDuration, videoDuration) => {
  // Default values
  const startTime = currentTime
  let endTime = currentTime + (userDefaultDuration || 10)
  let wasTrimmed = false
  let reason = ''

  // SMART DURATION CALCULATION: Trim duration if next caption starts sooner
  if (captions && captions.length > 0) {
    // Sort captions by start time to find the next one
    const sortedCaptions = [...captions].sort((a, b) => {
      const timeA = parseTimeToSeconds(a.startTime)
      const timeB = parseTimeToSeconds(b.startTime)
      return timeA - timeB
    })
    
    // Find the next caption that starts after current time
    const nextCaption = sortedCaptions.find(caption => {
      const captionStartTime = parseTimeToSeconds(caption.startTime)
      return captionStartTime > currentTime
    })
    
    if (nextCaption) {
      const nextCaptionStartTime = parseTimeToSeconds(nextCaption.startTime)
      const calculatedEndTime = currentTime + (userDefaultDuration || 10)
      
      // If next caption starts before our calculated end time, trim the duration
      if (nextCaptionStartTime < calculatedEndTime) {
        endTime = nextCaptionStartTime
        wasTrimmed = true
        reason = `trimmed_to_avoid_overlap`
        console.log(`🔧 Smart duration: Trimmed new caption from ${calculatedEndTime}s to ${nextCaptionStartTime}s to avoid overlap`)
      }
    }
  }
  
  // VIDEO LENGTH VALIDATION: Trim duration if it exceeds video length
  if (videoDuration && videoDuration > 0 && endTime > videoDuration) {
    const oldEndTime = endTime
    endTime = videoDuration
    wasTrimmed = true
    reason = reason ? `${reason}_and_video_length` : 'trimmed_to_video_length'
    console.log(`🔧 Video length validation: Trimmed new caption from ${oldEndTime}s to ${videoDuration}s (video max length)`)
  }

  return {
    startTime,
    endTime,
    wasTrimmed,
    reason
  }
}

/**
 * Video Parameter Management Utilities
 * Centralized functions for capturing and retrieving video information
 */

// Global storage for video parameters (captured once when video loads)
let videoParameters = {
  duration: 0,
  title: '',
  channel: '',
  isReady: false,
  player: null
}

/**
 * Captures and stores video parameters for centralized access
 * @param {Object} player - YouTube player instance
 * @param {string} title - Video title
 * @param {string} channel - Video channel name
 */
export const captureVideoParameters = (player, title = '', channel = '') => {
  try {
    let duration = 0
    
    // Try to get duration from player first
    if (player && typeof player.getDuration === 'function') {
      try {
        duration = Math.floor(player.getDuration())
      } catch (error) {
        console.warn('⚠️ Could not get video duration from player')
      }
    }
    
    // Fallback: try to get from video element if available
    if (duration === 0) {
      try {
        const videoElement = document.querySelector('video')
        if (videoElement && !isNaN(videoElement.duration)) {
          duration = Math.floor(videoElement.duration)
        }
      } catch (error) {
        console.warn('⚠️ Could not get video duration from video element')
      }
    }
    
    // Store all parameters
    videoParameters = {
      duration,
      title: title || '',
      channel: channel || '',
      isReady: !!player,
      player
    }
    
    console.log('🔧 Video parameters captured:', {
      duration: `${duration}s (${formatSecondsToTime(duration)})`,
      title: title || 'Not set',
      channel: channel || 'Not set',
      isReady: !!player
    })
    
  } catch (error) {
    console.error('❌ Error capturing video parameters:', error)
  }
}

/**
 * Gets the cached video duration in seconds
 * @returns {number} Video duration in seconds, or 0 if not available
 */
export const getVideoDuration = () => {
  return videoParameters.duration || 0
}

/**
 * Gets the cached video title
 * @returns {string} Video title, or empty string if not available
 */
export const getVideoTitle = () => {
  return videoParameters.title || ''
}

/**
 * Gets the cached video channel name
 * @returns {string} Video channel name, or empty string if not available
 */
export const getVideoChannel = () => {
  return videoParameters.channel || ''
}

/**
 * Checks if video is ready and parameters are available
 * @returns {boolean} True if video is ready and duration is available
 */
export const isVideoReady = () => {
  return videoParameters.isReady && videoParameters.duration > 0
}

/**
 * Gets the current video playback time in seconds
 * @returns {number} Current time in seconds, or 0 if not available
 */
export const getCurrentVideoTime = () => {
  try {
    if (videoParameters.player && typeof videoParameters.player.getCurrentTime === 'function') {
      return Math.floor(videoParameters.player.getCurrentTime())
    }
    
    // Fallback: try to get from video element
    const videoElement = document.querySelector('video')
    if (videoElement && !isNaN(videoElement.currentTime)) {
      return Math.floor(videoElement.currentTime)
    }
    
    return 0
  } catch (error) {
    console.warn('⚠️ Could not get current video time')
    return 0
  }
}

/**
 * Resets video parameters (useful for cleanup or video changes)
 */
export const resetVideoParameters = () => {
  videoParameters = {
    duration: 0,
    title: '',
    channel: '',
    isReady: false,
    player: null
  }
  console.log('🔧 Video parameters reset')
}
