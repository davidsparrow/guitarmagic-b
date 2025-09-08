/**
 * Video Player Management Utility Functions
 * Handles YouTube API loading, player initialization, and related functionality
 */

/**
 * Loads YouTube iframe API script with error handling and timeout protection
 * @param {Object} options - Configuration options
 * @param {Function} options.onLoad - Callback when script loads successfully
 * @param {Function} options.onError - Callback when script fails to load
 * @param {Function} options.onTimeout - Callback when script loading times out
 * @param {number} options.timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Object} Object with cleanup function and loading state
 */
export const loadYouTubeIframeAPI = (options = {}) => {
  const {
    onLoad = () => {},
    onError = () => {},
    onTimeout = () => {},
    timeoutMs = 10000
  } = options

  // Check if API is already loaded
  if (window.YT) {
    onLoad()
    return { isLoaded: true, cleanup: () => {} }
  }

  // Create script tag
  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'

  // Error handling
  tag.onerror = (error) => {
    console.error('❌ Failed to load YouTube iframe API:', error)
    console.error('❌ Error details:', { 
      error: error.message, 
      type: error.type,
      target: tag.src 
    })
    onError(error)
  }

  // Success handling
  tag.onload = () => {
    console.log('✅ YouTube iframe API loaded successfully')
    onLoad()
  }

  // Timeout protection
  const timeoutId = setTimeout(() => {
    if (!window.YT) {
      console.error('⏰ YouTube API script loading timeout - script may be hanging')
      onTimeout()
    }
  }, timeoutMs)

  // Insert script into DOM
  const firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

  // Cleanup function
  const cleanup = () => {
    clearTimeout(timeoutId)
    if (tag.parentNode) {
      tag.parentNode.removeChild(tag)
    }
  }

  return { isLoaded: false, cleanup }
}

/**
 * Initializes YouTube player with configuration
 * @param {Object} options - Player configuration options
 * @param {string} options.videoId - YouTube video ID
 * @param {string} options.containerId - DOM element ID for player
 * @param {Function} options.onReady - Callback when player is ready
 * @param {Function} options.onStateChange - Callback for player state changes
 * @param {Function} options.onError - Callback for player errors
 * @param {Object} options.playerVars - Additional player variables
 * @returns {Object|null} YouTube player instance or null if failed
 */
export const initializeYouTubePlayer = (options = {}) => {
  const {
    videoId,
    containerId = 'youtube-player',
    onReady = () => {},
    onStateChange = () => {},
    onError = () => {},
    playerVars = {}
  } = options

  // Validate required parameters
  if (!videoId) {
    console.error('❌ Video ID is required for player initialization')
    return null
  }

  if (!window.YT || !window.YT.Player) {
    console.error('❌ YouTube API not loaded. Call loadYouTubeIframeAPI first.')
    return null
  }

  try {
    // Default player variables
    const defaultPlayerVars = {
      controls: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0, // Disable YouTube's fullscreen button
      origin: window.location.origin,
      ...playerVars
    }

    // Create player instance
    const player = new window.YT.Player(containerId, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: defaultPlayerVars,
      events: {
        onReady: (event) => {
          console.log('✅ YouTube player ready')
          onReady(event, player)
        },
        onStateChange: (event) => {
          onStateChange(event)
        },
        onError: (event) => {
          console.error('❌ YouTube player error:', event)
          onError(event)
        }
      }
    })

    console.log('🎬 YouTube player initialization started')
    return player

  } catch (error) {
    console.error('❌ Error initializing YouTube player:', error)
    onError(error)
    return null
  }
}

/**
 * Sets up YouTube API ready callback for delayed initialization
 * @param {Function} callback - Function to call when API is ready
 */
export const setupYouTubeAPIReadyCallback = (callback) => {
  if (window.YT && window.YT.Player) {
    // API already loaded, call immediately
    callback()
  } else {
    // Set up callback for when API loads
    window.onYouTubeIframeAPIReady = () => {
      console.log('🎯 YouTube API ready callback triggered')
      callback()
    }
  }
}

/**
 * Handles YouTube player state changes with session saving logic
 * @param {Object} event - YouTube player state change event
 * @param {Object} options - Handler options
 * @param {Function} options.onPause - Callback when video is paused
 * @param {Function} options.onPlay - Callback when video starts playing
 * @param {Function} options.onBuffer - Callback when video is buffering
 * @param {Function} options.onCued - Callback when video is cued
 */
export const handlePlayerStateChange = (event, options = {}) => {
  const {
    onPause = () => {},
    onPlay = () => {},
    onBuffer = () => {},
    onCued = () => {}
  } = options

  // YouTube player states:
  // -1: UNSTARTED, 0: ENDED, 1: PLAYING, 2: PAUSED, 3: BUFFERING, 5: CUED
  
  if (event.data === 1) { // PLAYING
    onPlay(event)
  } else if (event.data === 2) { // PAUSED
    onPause(event)
  } else if (event.data === 3) { // BUFFERING
    onBuffer(event)
  } else if (event.data === 5) { // CUED
    onCued(event)
  }
}

/**
 * Handles YouTube API loading errors
 * @param {Function} onError - Callback for error handling
 */
export const handleYouTubeAPIError = (onError = () => {}) => {
  console.error('❌ YouTube API failed to load')
  onError()
}

/**
 * Checks if the YouTube player is fully ready with all necessary methods available
 * @param {Object} player - YouTube player instance
 * @returns {boolean} - True if player is ready, false otherwise
 */
export const isPlayerReady = (player) => {
  const result = player && 
         player.getPlayerState && 
         typeof player.getPlayerState === 'function' &&
         player.playVideo && 
         typeof player.playVideo === 'function' &&
         player.pauseVideo && 
         typeof player.pauseVideo === 'function'
  
  return result
}

/**
 * Handles YouTube player ready event and sets up video state
 * @param {Object} event - YouTube player ready event
 * @param {Object} playerInstance - YouTube player instance
 * @param {Object} options - Configuration options
 * @param {Function} options.setIsVideoReady - Function to set video ready state
 * @param {Function} options.setPlayer - Function to set player state
 * @param {Function} options.setPlayerRef - Function to set player ref
 * @param {Function} options.captureVideoParameters - Function to capture video parameters
 * @param {string} options.videoTitle - Video title
 * @param {string} options.videoChannel - Video channel name
 */
export const handleVideoReady = (event, playerInstance, options = {}) => {
  const {
    setIsVideoReady,
    setPlayer,
    setPlayerRef,
    captureVideoParameters,
    videoTitle,
    videoChannel
  } = options

  // Set video ready state
  if (setIsVideoReady) {
    setIsVideoReady(true)
  }

  // YouTube player ready and methods available
  
  // Set the fully ready player in both state and ref for immediate access
  if (playerInstance) {
    
    if (setPlayer) {
      setPlayer(playerInstance)
    }
    
    if (setPlayerRef) {
      setPlayerRef(playerInstance)
    }
    
    // Capture video parameters for centralized access
    if (captureVideoParameters) {
      captureVideoParameters(playerInstance, videoTitle, videoChannel)
    }
  } else {
    
  }
}

/**
 * Handles YouTube video loading errors
 * @param {Object} error - Video error object
 * @param {Object} options - Configuration options
 * @param {Function} options.onError - Optional callback for error handling
 */
export const handleVideoError = (error, options = {}) => {
  const { onError = () => {} } = options
  
  console.error('Video error:', error)
  
  // Call optional error callback
  onError(error)
  
  // Handle video loading errors
}

/**
 * Checks for saved session data and resumes video if available
 * @param {string} currentVideoId - Current video ID to check
 * @param {Object} options - Configuration options
 * @param {string} options.userId - User ID to check session for
 * @param {Function} options.showResumePrompt - Function to show resume prompt
 * @param {Object} options.supabase - Supabase client instance
 */
export const checkForSavedSession = async (currentVideoId, options = {}) => {
  const {
    userId,
    showResumePrompt,
    supabase
  } = options

  if (!userId || !currentVideoId) return
  
  try {
    
    // Get user profile to check for saved session
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('last_video_id, last_video_timestamp, last_video_title, last_video_channel_name, last_session_date')
      .eq('id', userId)
      .single()
    
    if (error) {
      
      return
    }
    
    if (profile?.last_video_id === currentVideoId && profile?.last_video_timestamp) {
      
      // Show resume prompt to user
      if (showResumePrompt) {
        showResumePrompt(profile.last_video_timestamp, profile.last_video_title)
      }
    } else {
      
    }
  } catch (error) {
    console.error('❌ Error checking saved session:', error)
  }
}

/**
 * Shows resume prompt to user with formatted time display
 * @param {number} timestamp - Video timestamp in seconds
 * @param {string} title - Video title
 * @param {Object} options - Configuration options
 * @param {Function} options.showCustomAlertModal - Function to show custom alert modal
 * @param {Function} options.resumeVideo - Function to resume video at timestamp
 * @param {Function} options.startFromBeginning - Function to start video from beginning
 */
export const showResumePrompt = (timestamp, title, options = {}) => {
  const {
    showCustomAlertModal,
    resumeVideo,
    startFromBeginning
  } = options

  // Format time as HH:MM:SS or MM:SS depending on duration
  const hours = Math.floor(timestamp / 3600)
  const minutes = Math.floor((timestamp % 3600) / 60)
  const seconds = Math.floor(timestamp % 60)
  
  let timeString
  if (hours > 0) {
    timeString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  const message = `Resume "${title}" from ${timeString}?`
  const buttons = [
    { text: 'Resume', action: () => resumeVideo(timestamp) },
    { text: 'Start from beginning', action: () => startFromBeginning() }
  ]
  
  if (showCustomAlertModal) {
    showCustomAlertModal(message, buttons)
  }
}

/**
 * Handles keyboard shortcuts for video control
 * @param {Object} event - Keyboard event object
 * @param {Object} options - Configuration options
 * @param {Function} options.isPlayerReady - Function to check if player is ready
 * @param {Object} options.player - YouTube player instance
 * @param {Function} options.getDailyWatchTimeTotal - Function to query daily watch time total
 */
export const handleKeyPress = (event, options = {}) => {
  const {
    isPlayerReady,
    player,
    getDailyWatchTimeTotal
  } = options

  // Spacebar for play/pause
  if (event.code === 'Space' && isPlayerReady()) {
    // Check if any input field is currently focused - disable video control if so
    if (document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'TEXTAREA')) {
      // Input field focused - spacebar video control disabled
      return // Exit early, don't handle video control
    }
    
    event.preventDefault()

    try {
      // Try to get player state first
      if (player.getPlayerState && typeof player.getPlayerState === 'function') {
        const playerState = player.getPlayerState()
        // Player state
        
        if (playerState === 1) { // Playing
          player.pauseVideo()
          // Video paused
        } else { // Paused or other states
          player.playVideo()
          // Video playing
          
          // Query daily watch time total only when starting from beginning (0:00)
          if (player.getCurrentTime && typeof player.getCurrentTime === 'function') {
            const currentTime = player.getCurrentTime()
            if (currentTime <= 1) { // Within 1 second of start (0:00)
      
              getDailyWatchTimeTotal()
            } else {
              // Video resuming from position - skipping daily total query
            }
          }
        }
      } else {
        // Fallback: try to pause if we can't determine state
  
        if (player.pauseVideo && typeof player.pauseVideo === 'function') {
          player.pauseVideo()
          // Video paused (fallback)
        }
      }
    } catch (error) {
      console.error('❌ Spacebar handler error:', error)
      // Final fallback: try to pause
      try {
        if (player.pauseVideo && typeof player.pauseVideo === 'function') {
          player.pauseVideo()
          // Video paused (final fallback)
        }
      } catch (fallbackError) {
        console.error('💥 All fallbacks failed:', fallbackError)
      }
    }
  }
}

/**
 * Checks player state and manages watch time tracking
 * @param {Object} options - Configuration options
 * @param {Object} options.player - YouTube player instance
 * @param {Function} options.isPlayerReady - Function to check if player is ready
 * @param {boolean} options.isTrackingWatchTime - Current tracking state
 * @param {Function} options.startWatchTimeTracking - Function to start watch time tracking
 * @param {Function} options.stopWatchTimeTracking - Function to stop watch time tracking
 * @param {Function} options.setWatchStartTime - Function to set watch start time
 * @param {Function} options.setIsTrackingWatchTime - Function to set tracking state
 * @param {Object} options.watchStartTime - Current watch start time
 * @returns {Object} Object with tracking state changes
 */
export const checkPlayerStateForWatchTime = (options = {}) => {
  const {
    player,
    isPlayerReady,
    isTrackingWatchTime,
    startWatchTimeTracking,
    stopWatchTimeTracking,
    setWatchStartTime,
    setIsTrackingWatchTime,
    watchStartTime
  } = options

  try {
    if (!player || !isPlayerReady()) return { changed: false }
    
    const playerState = player.getPlayerState()
    // Player state check
    
    if (playerState === 1 && !isTrackingWatchTime) { // Playing
      // Starting watch time tracking
      const startTime = startWatchTimeTracking()
      setWatchStartTime(startTime)
      setIsTrackingWatchTime(true)
      return { changed: true, action: 'started', startTime }
    } else if ((playerState === 2 || playerState === 0) && isTrackingWatchTime && watchStartTime) { // Paused or Ended
      // Stopping watch time tracking
      stopWatchTimeTracking(watchStartTime)
      setWatchStartTime(null)
      setIsTrackingWatchTime(false)
      return { changed: true, action: 'stopped', startTime: watchStartTime }
    }
    
    return { changed: false }
  } catch (error) {
    console.error('❌ Error checking player state for watch time:', error)
    return { changed: false, error }
  }
}



/**
 * Starts video from beginning (timestamp 0)
 * @param {Object} options - Configuration options
 * @param {Object} options.playerRef - React ref containing player instance
 * @param {Function} options.hideCustomAlertModal - Function to hide custom alert modal
 */
export const startFromBeginning = (options = {}) => {
  const {
    playerRef,
    hideCustomAlertModal
  } = options

  if (playerRef?.current && typeof playerRef.current.seekTo === 'function') {
    // Starting video from beginning
    playerRef.current.seekTo(0, true)
    if (hideCustomAlertModal) {
      hideCustomAlertModal()
    }
  } else {
    console.warn('⚠️ Player not ready for start from beginning operation')
  }
}

/**
 * Resumes video at specified timestamp
 * @param {number} timestamp - Video timestamp in seconds
 * @param {Object} options - Configuration options
 * @param {Object} options.playerRef - React ref containing player instance
 * @param {Function} options.hideCustomAlertModal - Function to hide custom alert modal
 */
export const resumeVideo = (timestamp, options = {}) => {
  const {
    playerRef,
    hideCustomAlertModal
  } = options

  if (playerRef?.current && typeof playerRef.current.seekTo === 'function') {
    // Resuming video at timestamp
    playerRef.current.seekTo(timestamp, true)
    if (hideCustomAlertModal) {
      hideCustomAlertModal()
    }
  } else {
    console.warn('⚠️ Player not ready for resume operation')
  }
}

/**
 * Checks if the YouTube video is currently playing
 * @param {Object} player - YouTube player instance
 * @returns {boolean} - True if video is playing or buffering, false otherwise
 */
export const isVideoPlaying = (player) => {
  if (!player || !player.getPlayerState) return false
  const state = player.getPlayerState()
  // YouTube states: 1=playing, 2=paused, 3=buffering, 5=video cued
  return state === 1 || state === 3
}

/**
 * Shows a restriction modal when trying to edit captions while video is playing
 * @param {Object} options - Configuration options
 * @param {Function} options.getAdminMessage - Function to get admin message
 * @param {Function} options.showCustomAlertModal - Function to show custom alert modal
 * @param {Function} options.hideCustomAlertModal - Function to hide custom alert modal
 */
export const showVideoPlayingRestriction = (options = {}) => {
  const {
    getAdminMessage,
    showCustomAlertModal,
    hideCustomAlertModal
  } = options

  const message = getAdminMessage('video_playing_message', 'Please pause video before using this feature')
  
  showCustomAlertModal(message, [
    { text: 'OK', action: hideCustomAlertModal }
  ])
}
