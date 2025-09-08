// pages/watch.js - Watch Page with YouTube Video Player
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import AuthModal from '../components/AuthModal'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { FaHamburger, FaSearch, FaTimes, FaRegEye, FaRegEdit, FaPlus } from "react-icons/fa"
import { MdCancel } from "react-icons/md"
import { TiDeleteOutline } from "react-icons/ti"
import { CgViewList } from "react-icons/cg"
import { IoText } from "react-icons/io5"
import { IoMdPower } from "react-icons/io"
import { RiLogoutCircleRLine } from "react-icons/ri"
import { TbGuitarPickFilled } from "react-icons/tb"
import { MdFlipCameraAndroid } from "react-icons/md"
import { ImLoop } from "react-icons/im"
import { BsReverseLayoutSidebarInsetReverse, BsArrowsFullscreen } from "react-icons/bs"
import { IoGameControllerOutline } from "react-icons/io5"
import TopBanner from '../components/TopBanner'
import Header from '../components/Header'
import MenuModal from '../components/MenuModal'
import SupportModal from '../components/SupportModal'
import {
  parseTimeToSeconds,
  formatSecondsToTime,
  timeToSeconds,
  assignSerialNumbersToCaptions,
  autoResolveCaptionConflicts,
  validateAllCaptions,
  captureVideoParameters,
  getVideoDuration,
  getCurrentVideoTime,
  calculateSmartCaptionDuration
} from '../utils/captionUtils'
import {
  DeleteConfirmModal,
  CaptionEditorModal,
  LoopConfigModal,
  CustomAlertModal
} from '../components/CaptionModals'
import {
  saveUserDefaultCaptionDuration,
  checkIfVideoFavorited,
  removeFavorite,
  loadCaptions,
  saveCaption,
  updateCaption,
  deleteCaption,
  addFavorite
} from '../utils/CaptionDatabase'
import {
  handleVideoReady as handleVideoReadyFromUtils,
  handleVideoError as handleVideoErrorFromUtils,
  checkForSavedSession as checkForSavedSessionFromUtils,
  showResumePrompt as showResumePromptFromUtils,
  resumeVideo as resumeVideoFromUtils,
  startFromBeginning as startFromBeginningFromUtils,
  checkPlayerStateForWatchTime as checkPlayerStateForWatchTimeFromUtils,
  handleKeyPress as handleKeyPressFromUtils,
  isPlayerReady as isPlayerReadyFromUtils,
  isVideoPlaying as isVideoPlayingFromUtils,
  showVideoPlayingRestriction as showVideoPlayingRestrictionFromUtils
} from '../utils/videoPlayerUtils'
import ChordCaptionModal from '../components/ChordCaptionModal'
import { deleteAllChordCaptions, saveChordCaptions } from '../song_data_processing/chord_processing/ChordCaptionDatabase'

export default function Watch() {





  const { isAuthenticated, user, loading, signOut } = useAuth()
  const { profile, planType, hasPlanAccess, canSearch } = useUser()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Video player states
  const [videoId, setVideoId] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [videoChannel, setVideoChannel] = useState('')
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [player, setPlayer] = useState(null)
  const playerRef = useRef(null) // Add ref to track player instance
  
  // Control strip states - Individual row visibility
  const [showControlStrips, setShowControlStrips] = useState(false)
  const [showRow1, setShowRow1] = useState(false)
  const [showRow2, setShowRow2] = useState(false)
  const [showRow3, setShowRow3] = useState(false)

  // Video flip states
  const [flipState, setFlipState] = useState('normal') // 'normal', 'horizontal', 'vertical'
  
  // Loop segment states
  const [isLoopActive, setIsLoopActive] = useState(false)
  const [loopStartTime, setLoopStartTime] = useState('0:00')
  const [loopEndTime, setLoopEndTime] = useState('0:00')
  const [showLoopModal, setShowLoopModal] = useState(false)
  const [tempLoopStart, setTempLoopStart] = useState('0:00')
  const [tempLoopEnd, setTempLoopEnd] = useState('0:00')
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // User access control states
  const [isVideoFavorited, setIsVideoFavorited] = useState(false)
  const [showUnfavoriteWarning, setShowUnfavoriteWarning] = useState(false)
  
  // Caption management states
  const [showCaptionModal, setShowCaptionModal] = useState(false)
  const [captions, setCaptions] = useState([])
  
  // Create a wrapped setCaptions that logs all calls

  const [editingCaption, setEditingCaption] = useState(null)
  const [isAddingNewCaption, setIsAddingNewCaption] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [captionToDelete, setCaptionToDelete] = useState(null)
  const [conflictRowIndex, setConflictRowIndex] = useState(-1)
  const [isInCaptionMode, setIsInCaptionMode] = useState(false)
  const [editingCaptionId, setEditingCaptionId] = useState(null)
  const [originalCaptionsSnapshot, setOriginalCaptionsSnapshot] = useState(null) // Store original state when modal opens
  const [userDefaultCaptionDuration, setUserDefaultCaptionDuration] = useState(10) // User's preferred caption duration in seconds
  
  // 🎸 CHORD CAPTION SYSTEM STATE VARIABLES 🎸
  // =============================================
  const [showChordModal, setShowChordModal] = useState(false)        // Controls chord modal visibility
  const [chordCaptions, setChordCaptions] = useState([])             // Stores array of chord caption data
  const [isLoadingChords, setIsLoadingChords] = useState(false)      // Loading state for chord operations
  const [originalChordCaptionsBlob, setOriginalChordCaptionsBlob] = useState(null) // Store original chord captions as JSON blob for cancel functionality
  // =============================================
  
  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('')
  
  // Load user's default caption duration from database
  const loadUserDefaultCaptionDuration = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('default_caption_duration_seconds')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error loading default caption duration:', error)
        return
      }
      
      if (data?.default_caption_duration_seconds) {
        setUserDefaultCaptionDuration(data.default_caption_duration_seconds)

      }
    } catch (error) {
      console.error('Error loading default caption duration:', error)
    }
  }

  // Save user's default caption duration to database - now imported from CaptionDatabase


    


  // New Caption Placement Dialog states
  const [showAddCaptionDialog, setShowAddCaptionDialog] = useState(false)
  const [selectedSerialNumber, setSelectedSerialNumber] = useState(null)

  // Database operation states
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false)
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false)
  const [dbError, setDbError] = useState(null)
  
  // Watch time tracking states
  const [watchStartTime, setWatchStartTime] = useState(null)
  const [isTrackingWatchTime, setIsTrackingWatchTime] = useState(false)
  const lastSavedSessionRef = useRef(null)
  const saveTimeoutRef = useRef(null) // Add timeout ref for debouncing
  
  // YouTube API loading states
  const [youtubeAPILoading, setYoutubeAPILoading] = useState(false)
  const [youtubeAPIError, setYoutubeAPIError] = useState(false)

  // Feature Gates states
  const [featureGates, setFeatureGates] = useState(null)
  const [featureGatesLoading, setFeatureGatesLoading] = useState(true)

  // Daily limit upgrade modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [dailyLimitInfo, setDailyLimitInfo] = useState(null)
  const [currentDailyTotal, setCurrentDailyTotal] = useState(0) // Track current daily watch time total

  // Save session data when user pauses video for Login-Resume functionality
  const saveSessionOnPause = async () => {


    
    if (!user?.id) {
              // Save blocked: No user ID
      return
    }
    if (!playerRef.current) {
              // Save blocked: No player ref
      return
    }
    if (!isVideoReady) {
              // Save blocked: Video not ready
      return
    }
    if (!videoId) {
              // Save blocked: No video ID
      return
    }
    

    
    try {

      const currentTime = playerRef.current.getCurrentTime()
              // Current time
      
      const videoTitle = playerRef.current.getVideoData().title || videoTitle
              // Video title
      
      const channelName = playerRef.current.getVideoData().author || videoChannel
              // Channel name
      

      
              // Making API call to update session
      const response = await fetch('/api/user/update-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          videoId,
          timestamp: currentTime,
          title: videoTitle,
          channelId: '', // YouTube doesn't provide channel ID easily
          channelName
        })
      })
      
              // API response received
      
      if (response.ok) {

      } else {
        console.error('❌ Failed to save session data on pause:', response.status)
        const errorText = await response.text()
        console.error('❌ Error details:', errorText)
      }
    } catch (error) {
      console.error('❌ Save session on pause error:', error)
      console.error('❌ Error stack:', error.stack)
    }
  }



  // Custom alert modal states
  const [showCustomAlert, setShowCustomAlert] = useState(false)
  const [customAlertMessage, setCustomAlertMessage] = useState('')
  const [customAlertButtons, setCustomAlertButtons] = useState([])



  // Basic Supabase database operations
  const saveFavorite = async (videoData) => {
    try {
      setIsLoadingFavorites(true)
      setDbError(null)
      
      const { data, error } = await supabase
        .from('favorites')
        .insert([{
          user_id: user?.id,
          video_id: videoData.videoId,
          video_title: videoData.videoTitle,
          video_channel: videoData.videoChannel,
          video_thumbnail: videoData.videoThumbnail,
          video_duration_seconds: videoData.videoDuration
        }])
        .select()
      
      if (error) throw error
      
      return data[0]
    } catch (error) {
      console.error('❌ Error saving favorite:', error)
      setDbError('Failed to save favorite')
      return null
    } finally {
      setIsLoadingFavorites(false)
    }
  }

  // Load captions function - now imported from CaptionDatabase

  // checkIfVideoFavorited function - now imported from CaptionDatabase

  // removeFavorite function - now imported from CaptionDatabase



  // Custom alert modal utility functions
  const showCustomAlertModal = (message, buttons = []) => {
    setCustomAlertMessage(message)
    setCustomAlertButtons(buttons)
    setShowCustomAlert(true)
  }

  const hideCustomAlertModal = () => {
    setShowCustomAlert(false)
    setCustomAlertMessage('')
    setCustomAlertButtons([])
  }

  // Helper functions to get messages from Admin Settings
  const getAdminMessage = (messageKey, fallback) => {
    return featureGates?.global_settings?.[messageKey] || fallback
  }



  // saveCaption function - now imported from CaptionDatabase

  // updateCaption function - now imported from CaptionDatabase

  // deleteCaption function - now imported from CaptionDatabase

  // Watch time tracking functions
  const startWatchTimeTracking = () => {
    if (!videoId || !user?.id || !videoChannel) return null
    const startTime = Date.now()
    return startTime
  }

  const stopWatchTimeTracking = (startTime) => {
    if (!startTime || !videoId || !user?.id || !videoChannel) return
    
    const endTime = Date.now()
    const watchDurationSeconds = Math.floor((endTime - startTime) / 1000)
    
    if (watchDurationSeconds > 0) {
      saveWatchTimeToDatabase(watchDurationSeconds, startTime)
    }
  }

  const saveWatchTimeToDatabase = async (watchDurationSeconds, startTimestamp) => {
    try {
      if (!videoId || !user?.id || !videoChannel || watchDurationSeconds <= 0) return

      // DEBOUNCING: Clear any existing timeout to prevent rapid successive calls
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        // Cleared previous save timeout
      }

      // DEBOUNCING: Set new timeout for 1 second to prevent duplicates
      saveTimeoutRef.current = setTimeout(async () => {
        const endTimestamp = new Date().toISOString()
        const startTimestampISO = new Date(startTimestamp).toISOString()

        // Check if we already saved this exact session to prevent duplicates
        const sessionKey = `${videoId}-${Math.floor(startTimestamp / 1000)}` // Round to nearest second
        
        if (lastSavedSessionRef.current === sessionKey) {
  
          return
        }

        const { data, error } = await supabase
          .from('channel_watch_time')
          .insert([{
            user_id: user.id,
            video_id: videoId,
            video_title: videoTitle,
            channel_name: videoChannel,
            channel_id: '',
            watch_time_seconds: watchDurationSeconds,
            watch_date: new Date().toISOString().split('T')[0],
            watch_timestamp_start: startTimestampISO,
            watch_timestamp_stop: endTimestamp
          }])
          .select()

        if (error) throw error
        
        // Mark this session as saved to prevent duplicates
        lastSavedSessionRef.current = sessionKey
        

      }, 1000) // 1 second debounce

    } catch (error) {
      console.error('❌ Error saving watch time:', error)
    }
  }

  // Query daily watch time total from Supabase
  const getDailyWatchTimeTotal = async () => {
    if (!user?.id) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('channel_watch_time')
        .select('watch_time_seconds')
        .eq('user_id', user.id)
        .eq('watch_date', today)

      if (error) throw error

      const totalSeconds = data.reduce((sum, record) => sum + record.watch_time_seconds, 0)
      const totalMinutes = (totalSeconds / 60).toFixed(1)
      
              // Daily watch time from Supabase
      
      // Update the current daily total state for feature access checks
      setCurrentDailyTotal(parseFloat(totalMinutes))
      
      return totalMinutes
    } catch (error) {
      console.error('❌ Error querying daily watch time:', error)
      return 0
    }
  }

  // Check daily watch time limits - consolidated function
  const checkDailyWatchTimeLimits = (dailyMinutes, options = {}) => {
    if (!user?.id || !planType) return options.returnBoolean ? false : null
    
    // Define daily limits for each plan (TODO: Move to Supabase, not hard-coded)
    const dailyLimits = {
      'freebird': 60,      // 60 minutes per day (1 hour)
      'roadie': 180,   // 180 minutes per day (3 hours)
      'hero': 480      // 480 minutes per day (8 hours)
    }
    
    const userLimit = dailyLimits[planType] || dailyLimits.freebird
    const hasExceeded = dailyMinutes >= userLimit
    
    // Update state if requested (for limit checking)
    if (options.updateState) {
      setCurrentDailyTotal(parseFloat(dailyMinutes))
    }
    
    // Show toast if exceeded
    if (hasExceeded) {
      const message = `Daily watch time limit exceeded! You've used ${dailyMinutes} minutes of your ${userLimit} minute limit.`
      showToast(message, 'warning', [
        { text: 'UPGRADE PLAN', action: () => window.open('/pricing', '_blank') },
        { text: 'OK', action: () => dismissAllToasts() }
      ])
    }
    
    // Return boolean for feature access checks, or object for limit checking
    if (options.returnBoolean) {
      return !hasExceeded  // true if NOT exceeded (can access feature)
    }
    
    return { hasExceeded, planType, dailyMinutes, userLimit }
  }

  // Feature Gates Helper Functions
  const loadFeatureGates = async () => {
    try {
      setFeatureGatesLoading(true)
      // Loading feature gates configuration
      
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', 'feature_gates')
        .single()

      if (error) {
        console.error('❌ Error loading feature gates:', error)
        return
      }

      if (data && data.setting_value) {
        setFeatureGates(data.setting_value)

      } else {
        
      }
    } catch (error) {
      console.error('❌ Error in loadFeatureGates:', error)
    } finally {
      setFeatureGatesLoading(false)
    }
  }

  const checkFeatureAccess = (featureKey, options = {}) => {
    if (!featureGates || !featureGates.feature_gates) {
      
      return { hasAccess: false, reason: 'feature_gates_not_loaded' }
    }

    const feature = featureGates.feature_gates[featureKey]
    if (!feature) {
      
      return { hasAccess: false, reason: 'feature_not_configured' }
    }

    // Check if feature is enabled
    if (!feature.is_enabled) {
      return { hasAccess: false, reason: 'feature_disabled', message: 'This feature is currently disabled' }
    }

    // Check tier requirement
    const tierOrder = { 'freebird': 0, 'roadie': 1, 'hero': 2 }
    const userTier = planType || 'freebird'
    const requiredTier = feature.min_tier || 'freebird'
    
    if (tierOrder[userTier] < tierOrder[requiredTier]) {
      const message = feature.messages?.tier_restriction || 
        `Requires ${requiredTier.toUpperCase()} Plan or higher`
      return { 
        hasAccess: false, 
        reason: 'tier_restriction', 
        message,
        upgradeButton: feature.upgrade_button
      }
    }

    // Check video playing restriction
            if (options.checkVideoPlaying && feature.video_restricted && isVideoPlayingFromUtils(player)) {
      const message = feature.messages?.video_playing || 
        featureGates.global_settings?.video_playing_message || 
        'Please pause video before using this feature'
      return { 
        hasAccess: false, 
        reason: 'video_playing', 
        message 
      }
    }

    return { hasAccess: true }
  }



  const getFeatureRestrictionMessage = (featureKey, options = {}) => {
    const access = checkFeatureAccess(featureKey, options)
    if (access.hasAccess) return null
    
    return {
      message: access.message,
      reason: access.reason,
      upgradeButton: access.upgradeButton
    }
  }

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check daily watch time limits when profile loads
  useEffect(() => {
    if (profile && profile.subscription_tier && user?.id) {
      // User plan confirmed - checking daily watch time limits
      getDailyWatchTimeTotal().then(dailyMinutes => {
        if (dailyMinutes) {
          checkDailyWatchTimeLimits(parseFloat(dailyMinutes), { updateState: true })
        }
      })
    }
  }, [profile, user?.id])

  // Load feature gates configuration
  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadFeatureGates()
    }
  }, [mounted, isAuthenticated])

  // Feature gates state tracking
  useEffect(() => {
    if (featureGates) {
      // Feature gates state updated
    }
  }, [featureGates, planType])

  // Track when user data becomes available
  useEffect(() => {
    // User data useEffect triggered
  }, [user, profile, loading, isAuthenticated])

  // Load YouTube API script
  useEffect(() => {
    if (mounted && !window.YT) {
      // Loading YouTube iframe API
      setYoutubeAPILoading(true)
      setYoutubeAPIError(false)
      
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      
      // Add more detailed error handling
      tag.onerror = (error) => {
        console.error('❌ Failed to load YouTube iframe API:', error)
        console.error('❌ Error details:', { 
          error: error.message, 
          type: error.type,
          target: tag.src 
        })
        setYoutubeAPILoading(false)
        setYoutubeAPIError(true)
        handleYouTubeAPIError()
      }
      
      tag.onload = () => {

        setYoutubeAPILoading(false)
      }
      
      // Add timeout to detect hanging script loading
      const timeoutId = setTimeout(() => {
        if (!window.YT) {
          console.error('⏰ YouTube API script loading timeout - script may be hanging')
          setYoutubeAPILoading(false)
          setYoutubeAPIError(true)
        }
      }, 10000) // 10 second timeout
      
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      
      // Cleanup timeout if script loads successfully
      if (window.YT) {
        clearTimeout(timeoutId)
      }
    } else if (mounted && window.YT) {
      
    }
  }, [mounted])

  // Initialize YouTube player when API is ready
  useEffect(() => {
    if (mounted && videoId) {
      // Initializing YouTube player for video
      
      const initPlayer = () => {
        if (window.YT && window.YT.Player) {
  
          const newPlayer = new window.YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
              controls: 1,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              fs: 0, // Disable YouTube's fullscreen button
              origin: window.location.origin
            },
            events: {
              onReady: (event) => handleVideoReady(event, newPlayer),
              onStateChange: (event) => handlePlayerStateChange(event),
              onError: handleVideoError
            }
          })
          
          // Store the player reference for later use
          // Player created, waiting for onReady event
        } else {

        }
      }

      // Check if API is already loaded
      if (window.YT && window.YT.Player) {

        initPlayer()
      } else {
        // Wait for API to be ready
        // Setting up YouTube API ready callback
        window.onYouTubeIframeAPIReady = () => {
                      // YouTube API ready callback triggered
          initPlayer()
        }
      }
    }
  }, [mounted, videoId])

  // Load video from URL parameters when page loads
  useEffect(() => {

    
    // Try to get video data from URL if router isn't ready yet
    if (mounted && !router.isReady) {

      const urlParams = new URLSearchParams(window.location.search)
      const v = urlParams.get('v')
      const title = urlParams.get('title')
      const channel = urlParams.get('channel')
      
      if (v) {
        
        setVideoId(v)
        setVideoTitle(title ? decodeURIComponent(title) : '')
        setVideoChannel(channel ? decodeURIComponent(channel) : '')
        setIsVideoReady(true)
      } else {
        // No video ID in URL, redirecting to home
        router.push('/')
      }
    } else if (mounted && router.isReady) {
      const { v, title, channel } = router.query
      if (v && typeof v === 'string') {
        
        setVideoId(v)
        setVideoTitle(title ? decodeURIComponent(title) : '')
        setVideoChannel(channel ? decodeURIComponent(channel) : '')
        setIsVideoReady(true)
        
        // Query daily watch time total when video loads
        if (user?.id) {
          // Video loaded - querying daily watch time total
          getDailyWatchTimeTotal()
          
          // Check for saved session data to resume video
          checkForSavedSession(v)
        }
        

      } else {
        // No video ID provided, redirecting to home
        // No video ID provided, redirect to home
        router.push('/')
      }
    } else {
      // Video loading conditions not met
    }
  }, [mounted, router.isReady, router.query])

  // Fallback: Check URL immediately when component mounts
  useEffect(() => {
    if (mounted) {

      const urlParams = new URLSearchParams(window.location.search)
      const v = urlParams.get('v')
      const title = urlParams.get('title')
      const channel = urlParams.get('channel')
      
      if (v && !videoId) {
        
        setVideoId(v)
        setVideoTitle(title ? decodeURIComponent(title) : '')
        setVideoChannel(channel ? decodeURIComponent(channel) : '')
        setIsVideoReady(true)
        
        // Check for saved session data in fallback case too
        if (user?.id) {
          checkForSavedSession(v)
        }
      }
    }
  }, [mounted, videoId])

  // Check if video is favorited when video loads or user changes
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (videoId && user?.id) {
        const isFavorited = await checkIfVideoFavorited(videoId, user?.id)
        setIsVideoFavorited(isFavorited)
        // Favorite status checked
      }
    }
    
    checkFavoriteStatus()
  }, [videoId, user?.id])

  // Load captions when video loads or user changes
  useEffect(() => {
    const loadVideoCaptions = async () => {
      // Caption loading effect triggered
      
      if (videoId && user?.id && isVideoFavorited) {
  
        const videoCaptions = await loadCaptions(videoId, user?.id, setIsLoadingCaptions, setDbError)
        
        setCaptions(videoCaptions)
        
      } else {
        
        setCaptions([])
      }
    }
    
    loadVideoCaptions()
  }, [videoId, user?.id, isVideoFavorited])

  // Automatic watch time tracking
  useEffect(() => {
    // Watch time tracking useEffect executed
    
    // Track execution count
    useEffect.executionCount = (useEffect.executionCount || 0) + 1
    
    if (!player || !isPlayerReadyFromUtils(player) || !user?.id || !videoId || !videoChannel) {
      // Watch time tracking paused - conditions not met
      return
    }

    // Set up polling to check player state
    const checkPlayerState = () => {
      // Use utility function for checking player state and managing watch time tracking
      const result = checkPlayerStateForWatchTimeFromUtils({
        player,
        isPlayerReady: isPlayerReadyFromUtils,
        isTrackingWatchTime,
        startWatchTimeTracking,
        stopWatchTimeTracking,
        setWatchStartTime,
        setIsTrackingWatchTime,
        watchStartTime
      })
      
      if (result.changed) {
        console.log(`🔄 Watch time tracking ${result.action}`)
      }
    }

    // Check player state every 2 seconds
    const intervalId = setInterval(checkPlayerState, 2000)

    // Cleanup function
    return () => {
      clearInterval(intervalId)
      if (isTrackingWatchTime && watchStartTime) {
        stopWatchTimeTracking(watchStartTime)
      }
    }
  }, [player, user?.id, videoId, videoChannel, isTrackingWatchTime, watchStartTime])





  // Handle login/logout
  const handleAuthClick = async () => {
    if (isAuthenticated) {
      try {
        await signOut()
        setShowAuthModal(false)
        setShowMenuModal(false)
      } catch (error) {
        console.error('Sign out failed:', error)
      }
    } else {
      setShowAuthModal(true)
    }
  }

  // Handle search submission - navigate to search page with query
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Video player functions
  const handleVideoReady = (event, playerInstance) => {
    // Use utility function for video ready handling
    handleVideoReadyFromUtils(event, playerInstance, {
      setIsVideoReady,
      setPlayer,
      setPlayerRef: (player) => { playerRef.current = player },
      captureVideoParameters,
      videoTitle,
      videoChannel
    })
  }

  const handleVideoError = (error) => {
    // Use utility function for video error handling
    handleVideoErrorFromUtils(error, {
      onError: (error) => {
        // Custom error handling if needed
        console.error('Custom video error handling:', error)
      }
    })
  }

  // Check for saved session data and resume video if available
  const checkForSavedSession = async (currentVideoId) => {
    // Use utility function for checking saved session
    await checkForSavedSessionFromUtils(currentVideoId, {
      userId: user?.id,
      showResumePrompt,
      supabase
    })
  }

  // Show resume prompt to user
  const showResumePrompt = (timestamp, title) => {
    // Use utility function for showing resume prompt
    showResumePromptFromUtils(timestamp, title, {
      showCustomAlertModal,
      resumeVideo,
      startFromBeginning
    })
  }

  // Resume video at saved timestamp
  const resumeVideo = (timestamp) => {
    // Use utility function for resuming video
    resumeVideoFromUtils(timestamp, {
      playerRef,
      hideCustomAlertModal
    })
  }

  // Start video from beginning
  const startFromBeginning = () => {
    // Use utility function for starting video from beginning
    startFromBeginningFromUtils({
      playerRef,
      hideCustomAlertModal
    })
  }



  // Handle YouTube player state changes - Global event handler for all play/pause actions
  const handlePlayerStateChange = (event) => {
            // YouTube player state changed
    
    // YouTube player states:
    // -1: UNSTARTED, 0: ENDED, 1: PLAYING, 2: PAUSED, 3: BUFFERING, 5: CUED
    
    // Log state changes for debugging (watch time tracking still works)
    if (event.data === 1) { // PLAYING
                // Video started playing
    } else if (event.data === 2) { // PAUSED
                // Video paused
      
      // Save session data for Login-Resume functionality when user pauses
      
      if (user?.id) {

        
        // Use the ref for immediate access to the player instance
        if (playerRef.current && playerRef.current.getPlayerState && typeof playerRef.current.getPlayerState === 'function') {
  
          console.log('🔄 Triggering session save on pause...')
          saveSessionOnPause()
        } else {
          console.log('⚠️ Player not ready for session save')
        }
      } else {
        // Save conditions NOT met - session save blocked
      }
    } else if (event.data === 3) { // BUFFERING
              // Video buffering
    } else if (event.data === 5) { // CUED
              // Video cued
    }
  }

  // Handle YouTube API loading errors
  const handleYouTubeAPIError = () => {
    console.error('❌ YouTube API failed to load')
    // Could show a retry button or fallback message
  }

  // Handle keyboard shortcuts for video control
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Spacebar for play/pause - use utility function
      if (e.code === 'Space' && isPlayerReadyFromUtils(player)) {
        handleKeyPressFromUtils(e, {
          isPlayerReady: isPlayerReadyFromUtils,
          player,
          getDailyWatchTimeTotal
        })
      }
      
      // F11 for fullscreen toggle
      if (e.code === 'F11') {
        e.preventDefault()
        handleFullscreenToggle()
      }
      
      // Escape to exit fullscreen
      if (e.code === 'Escape' && isFullscreen) {
        handleFullscreenToggle()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [player, isVideoReady, isFullscreen])



  // Check if user can access loop functionality
  const canAccessLoops = () => {
    const hasAccess = planType !== 'freebird' && isVideoFavorited
            // Access check
    return hasAccess
  }

  // Handle control strips toggle - SIMPLIFIED
  const handleControlStripsToggle = () => {
    // Check daily watch time limits before allowing control strips feature
    if (!checkDailyWatchTimeLimits(currentDailyTotal, { returnBoolean: true })) {
              // Control Strips access blocked - daily limit exceeded
      return
    }
    
    const newState = !showControlStrips
            // Toggle clicked
    
    if (newState) {
      // When showing control strips, ensure ALL rows are visible for smallest video size
      setShowRow1(true)
      setShowRow2(true)
      setShowRow3(true)
    }
    
    setShowControlStrips(newState)
  }

  // Handle individual row hide/show
  const handleRowToggle = (rowNumber) => {
    // Check if video is playing
    if (isVideoPlayingFromUtils(player)) {
      showVideoPlayingRestrictionFromUtils({
        getAdminMessage,
        showCustomAlertModal,
        hideCustomAlertModal
      })
      return
    }
    
    switch(rowNumber) {
      case 1:
        setShowRow1(false)
        break
      case 2:
        setShowRow2(false)
        break
      case 3:
        setShowRow3(false)
        break
      default:
        break
    }
  }

  // Handle show all rows (reset)
  const handleShowAllRows = () => {
    // Check if video is playing
    if (isVideoPlayingFromUtils(player)) {
      showVideoPlayingRestrictionFromUtils({
        getAdminMessage,
        showCustomAlertModal,
        hideCustomAlertModal
      })
      return
    }
    
    setShowRow1(true)
    setShowRow2(true)
    setShowRow3(true)
  }

  // Handle favorite/unfavorite video
  const handleFavoriteToggle = async () => {
    if (isVideoFavorited) {
      // Show warning before unfavoriting
      setShowUnfavoriteWarning(true)
    } else {
      // Add to favorites
      try {
        const videoData = {
          videoId,
          videoTitle,
          videoChannel,
          videoThumbnail: '', // TODO: Get from YouTube API
          videoDuration: 0 // TODO: Get from YouTube API
        }
        
        const savedFavorite = await saveFavorite(videoData)
        if (savedFavorite) {
          setIsVideoFavorited(true)
  
        } else {
          console.error('❌ Failed to save favorite to database')
        }
      } catch (error) {
        console.error('❌ Error in handleFavoriteToggle:', error)
        setDbError('Failed to save favorite')
      }
    }
  }

  // Handle unfavorite confirmation
  const handleUnfavoriteConfirm = async () => {
    try {
      const removed = await removeFavorite(videoId, user?.id)
      if (removed) {
        setIsVideoFavorited(false)
        setShowUnfavoriteWarning(false)
        
        // Wipe loop data from Supabase

        // TODO: Delete loop records from Supabase
        
        // Reset loop state
        setIsLoopActive(false)
        setLoopStartTime('0:00')
        setLoopEndTime('0:00')
        

      } else {
        console.error('❌ Failed to remove favorite from database')
        setDbError('Failed to remove favorite')
      }
    } catch (error) {
      console.error('❌ Error in handleUnfavoriteConfirm:', error)
      setDbError('Failed to remove favorite')
    }
  }

  // Handle unfavorite cancel
  const handleUnfavoriteCancel = () => {
    setShowUnfavoriteWarning(false)
  }

  // Handle caption edit click with access control
  const handleCaptionEditClick = (rowNumber) => {
    // Check if video is playing
    if (isVideoPlayingFromUtils(player)) {
      showVideoPlayingRestrictionFromUtils({
        getAdminMessage,
        showCustomAlertModal,
        hideCustomAlertModal
      })
      return
    }
    
    // Check if user can access captions (same as loops)
    if (!canAccessLoops()) {
      if (planType === 'freebird') {
        showCustomAlertModal(getAdminMessage('plan_upgrade_message', '🔒 Captions require a paid plan. Please upgrade to access this feature.'), [
          { text: 'UPGRADE PLAN', action: () => window.open('/pricing', '_blank') },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      if (!isVideoFavorited) {
        showCustomAlertModal(getAdminMessage('save_to_favorites_message', '⭐ Please save this video to favorites before editing captions.'), [
          { text: 'SAVE TO FAVORITES', action: () => { hideCustomAlertModal(); handleFavoriteToggle(); } },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      return
    }

    // Capture snapshot of current captions state before opening modal
    setOriginalCaptionsSnapshot(JSON.parse(JSON.stringify(captions)))
            // Captured captions snapshot for revert functionality

    // Open caption edit modal for the specific row
    
    setShowCaptionModal(true)
    setEditingCaption({ rowType: rowNumber, rowName: rowNumber === 1 ? 'Text Captions' : rowNumber === 2 ? 'Chords Captions' : 'Auto-Gen' })
  }

  // Handle chord modal open for Row 2
  const handleChordModalOpen = () => {
    // Check if video is playing
    if (isVideoPlayingFromUtils(player)) {
      showVideoPlayingRestrictionFromUtils({
        getAdminMessage,
        showCustomAlertModal,
        hideCustomAlertModal
      })
      return
    }
    
    // Check if user can access captions (same as loops)
    if (!canAccessLoops()) {
      if (planType === 'freebird') {
        showCustomAlertModal(getAdminMessage('plan_upgrade_message', '🔒 Chord captions require a paid plan. Please upgrade to access this feature.'), [
          { text: 'UPGRADE PLAN', action: () => window.open('/pricing', '_blank') },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      if (!isVideoFavorited) {
        showCustomAlertModal(getAdminMessage('save_to_favorites_message', '⭐ Please save this video to favorites before editing chord captions.'), [
          { text: 'SAVE TO FAVORITES', action: () => { hideCustomAlertModal(); handleFavoriteToggle(); } },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
            return
    }

    // Open chord modal
    setShowChordModal(true)
  }









  // Handle adding new caption from timeline
  const handleAddCaptionFromTimeline = () => {
    if (!canAccessLoops()) {
      if (planType === 'freebird') {
        showCustomAlertModal(getAdminMessage('plan_upgrade_message', '🔒 Captions require a paid plan. Please upgrade to access this feature.'), [
          { text: 'UPGRADE PLAN', action: () => window.open('/pricing', '_blank') },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      if (!isVideoFavorited) {
        showCustomAlertModal(getAdminMessage('save_to_favorites_message', '⭐ Please save this video to favorites before editing captions.'), [
          { text: 'SAVE TO FAVORITES', action: () => { hideCustomAlertModal(); handleFavoriteToggle(); } },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      return
    }

    // Capture snapshot of current captions state before opening modal
    if (!originalCaptionsSnapshot) {
      setOriginalCaptionsSnapshot(JSON.parse(JSON.stringify(captions)))

    }

    // Open the caption placement dialog instead of directly adding
    // Set default selection to last caption if available
    if (captions.length > 0) {
      const lastSerialNumber = Math.max(...captions.map(c => c.serial_number))
      setSelectedSerialNumber(lastSerialNumber)
    }
    setShowAddCaptionDialog(true)
  }



  // Handle adding new caption at specific position
  const handleAddCaptionAtPosition = async () => {
    if (!selectedSerialNumber) {

      return
    }

    try {
      // Find the target caption by serial number
      const targetCaption = captions.find(caption => caption.serial_number === selectedSerialNumber)
      if (!targetCaption) {
        console.error('❌ Target caption not found')
        return
      }

      let newCaptionStartTime, newCaptionEndTime
      let modifiedCaptions = [...captions]

      // Check if this is the last caption
      const isLastCaption = selectedSerialNumber === Math.max(...captions.map(c => c.serial_number))

      if (isLastCaption) {
        // Option A: After last caption - add user-preferred duration
        newCaptionStartTime = targetCaption.endTime
        newCaptionEndTime = formatSecondsToTime(parseTimeToSeconds(targetCaption.endTime) + (userDefaultCaptionDuration || 10))
        

      } else {
        // Option B: Between existing captions - use duplicate logic
        const startTime = parseTimeToSeconds(targetCaption.startTime)
        const endTime = parseTimeToSeconds(targetCaption.endTime)
        const originalDuration = endTime - startTime
        
        // Modify original caption - reduce duration by 50%
        const newOriginalEndTime = startTime + (originalDuration / 2)
        const newOriginalEndTimeFormatted = formatSecondsToTime(newOriginalEndTime)
        
        // Update original caption
        modifiedCaptions = modifiedCaptions.map(caption => 
          caption.serial_number === selectedSerialNumber 
            ? { ...caption, endTime: newOriginalEndTimeFormatted }
            : caption
        )
        
        // New caption takes the second half
        newCaptionStartTime = newOriginalEndTimeFormatted
        newCaptionEndTime = targetCaption.endTime
        

      }

      // Create new caption
      const newCaption = {
        id: null, // Will get proper database ID when saved
        startTime: newCaptionStartTime,
        endTime: newCaptionEndTime,
        line1: '',
        line2: '',
        rowType: editingCaption?.rowType || 1,
        serial_number: null // Will be assigned by database
      }

      // Add to captions array
      const updatedCaptions = [...modifiedCaptions, newCaption]
      
      // Sort by start time and reassign serial numbers
      const sortedCaptions = updatedCaptions.sort((a, b) => {
        const timeA = parseTimeToSeconds(a.startTime)
        const timeB = parseTimeToSeconds(b.startTime)
        return timeA - timeB
      }).map((caption, index) => ({
        ...caption,
        serial_number: index + 1
      }))

      // Update state
      setCaptions(sortedCaptions)
      
      // Close dialog
      setShowAddCaptionDialog(false)
      setSelectedSerialNumber(null)
      
      
      
    } catch (error) {
      console.error('❌ Error adding caption at position:', error)
      setDbError('Failed to add caption at position')
    }
  }



  // Handle adding new caption from control strip
  const handleAddCaptionFromControlStrip = async (rowNumber) => {
    if (!canAccessLoops()) {
      if (planType === 'freebird') {
        showCustomAlertModal(getAdminMessage('plan_upgrade_message', '🔒 Captions require a paid plan. Please upgrade to access this feature.'), [
          { text: 'UPGRADE PLAN', action: () => window.open('/pricing', '_blank') },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      if (!isVideoFavorited) {
        showCustomAlertModal(getAdminMessage('save_to_favorites_message', '⭐ Please save this video to favorites before editing captions.'), [
          { text: 'SAVE TO FAVORITES', action: () => { hideCustomAlertModal(); handleFavoriteToggle(); } },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      return
    }

    // Check if video is playing
    if (isVideoPlayingFromUtils(player)) {
      showVideoPlayingRestrictionFromUtils({
        getAdminMessage,
        showCustomAlertModal,
        hideCustomAlertModal
      })
      return
    }

    // Get current video time
    let currentTime = 0
    if (player && isPlayerReadyFromUtils(player)) {
      try {
        currentTime = Math.floor(player.getCurrentTime())
      } catch (error) {
        console.error('Error getting current time:', error)
      }
    }

    // SIMPLIFIED RULE: Check if there's a caption currently displayed at this time
    const currentCaption = captions.find(caption => {
      const start = timeToSeconds(caption.startTime)
      const end = timeToSeconds(caption.endTime)
      return currentTime >= start && currentTime <= end
    })

    if (currentCaption) {
      // RULE: If caption exists at current time, DO NOTHING
      
      showCustomAlertModal('Caption already exists at this time', [
        { text: 'OK', action: hideCustomAlertModal }
      ])
      return // Exit function, do nothing
    }

    // Use utility function for smart duration calculation and video length validation
    const { startTime, endTime, wasTrimmed, reason } = calculateSmartCaptionDuration(
      currentTime,
      captions,
      userDefaultCaptionDuration,
      getVideoDuration()
    )
    
    // Convert to MM:SS format using the existing formatSecondsToTime function
    const startTimeString = formatSecondsToTime(startTime)
    const endTimeString = formatSecondsToTime(endTime)

    const newCaption = {
      startTime: startTimeString,
      endTime: endTimeString,
      line1: '',
      line2: '',
      rowType: rowNumber
    }

    // Save caption to database
    const savedCaption = await saveCaption(newCaption, videoId, user?.id, setIsLoadingCaptions, setDbError)
    if (savedCaption) {
      // Add to local state with database ID
      setCaptions(prev => {
        const newCaptions = [...prev, savedCaption]
        
        // Auto-resolve any conflicts that may have been created
        const resolvedCaptions = autoResolveCaptionConflicts(newCaptions)
        
        // If conflicts were resolved, update the state with resolved captions
        if (resolvedCaptions !== newCaptions) {
          // Conflicts were auto-resolved, updating captions state
          return resolvedCaptions
        }
        
        return newCaptions
      })
      
      // Update footer fields to control this caption
      setTempLoopStart(startTimeString)
      setTempLoopEnd(endTimeString)
      
      // Set this as the editing caption
      setEditingCaptionId(savedCaption.id)
      
      // Set caption mode and editing ID for the new caption
      setIsInCaptionMode(true)
      setEditingCaptionId(savedCaption.id)
      
      // Capture original caption state for potential reversion
      setOriginalCaptionsSnapshot(JSON.parse(JSON.stringify(captions)))
      

    } else {
      console.error('❌ Failed to save new caption to database')
      setDbError('Failed to save new caption')
    }
  }

  // Handle saving newly added caption from footer
  const handleSaveNewCaption = async () => {
    if (editingCaptionId) {
      try {
        // Find the current caption to save
        const currentCaption = captions.find(caption => caption.id === editingCaptionId)
        if (currentCaption) {
          // Save any changes to the database
          const updatedCaption = await updateCaption(
            editingCaptionId,
            {
              startTime: currentCaption.startTime,
              endTime: currentCaption.endTime,
              line1: currentCaption.line1,
              line2: currentCaption.line2
            },
            user?.id,
            setIsLoadingCaptions,
            setDbError
          )
          
          if (updatedCaption) {
            console.log('✅ Caption changes saved to database')
          } else {
            console.error('❌ Failed to save caption changes to database')
            setDbError('Failed to save caption changes')
            return
          }
        }
      } catch (error) {
        console.error('❌ Error saving caption changes:', error)
        setDbError('Failed to save caption changes')
        return
      }
    }
    
    // Exit caption mode after successful save
    setIsInCaptionMode(false)
    setEditingCaptionId(null)
    setTempLoopStart('0:00')
    setTempLoopEnd('0:00')
    
    // Reset original caption snapshot since we're exiting mode
    if (typeof setOriginalCaptionsSnapshot === 'function') {
      setOriginalCaptionsSnapshot(null)
    }
    
    console.log('✅ Caption saved and edit mode exited')
  }

  // Handle canceling caption changes from footer (NEW records: delete, EXISTING records: revert text)
  const handleCancelNewCaption = () => {
    if (editingCaptionId) {
      // Check if this is a NEW record or EXISTING record
      const existingCaption = captions.find(caption => caption.id === editingCaptionId)
      const isNewRecord = !existingCaption || !existingCaption.startTime || !existingCaption.endTime
      
      // Show generic confirmation for both cases
      showCustomAlertModal(
        'Cancelling reverts all changes. Proceed?',
        [
          { 
            text: 'PROCEED', 
            action: async () => {
              try {
                if (isNewRecord) {
                  // NEW RECORD: Delete from database
                  const deleted = await deleteCaption(editingCaptionId, user?.id, setIsLoadingCaptions, setDbError)
                  if (deleted) {
                    // Remove from local state
                    setCaptions(prev => prev.filter(caption => caption.id !== editingCaptionId))
                    console.log('✅ New caption deleted and caption mode exited')
                  }
                } else {
                  // EXISTING RECORD: Revert text changes
                  const originalCaption = originalCaptionsSnapshot?.find(c => c.id === editingCaptionId)
                  if (originalCaption) {
                    setCaptions(prev => prev.map(caption =>
                      caption.id === editingCaptionId 
                        ? { ...caption, line1: originalCaption.line1, line2: originalCaption.line2 }
                        : caption
                    ))
                    console.log('✅ Existing caption text reverted and caption mode exited')
                  }
                }
                
                // Exit caption mode for both cases
                setIsInCaptionMode(false)
                setEditingCaptionId(null)
                
                // Reset footer fields
                setTempLoopStart('0:00')
                setTempLoopEnd('0:00')
                
                // Reset original caption snapshot since we're exiting mode
                if (typeof setOriginalCaptionsSnapshot === 'function') {
                  setOriginalCaptionsSnapshot(null)
                }
                
                // Close the confirmation modal
                hideCustomAlertModal()
              } catch (error) {
                console.error('❌ Error in cancel operation:', error)
                setDbError('Failed to cancel changes')
              }
            }
          },
          { text: 'KEEP EDITING', action: hideCustomAlertModal }
        ]
      )
    } else {
      setIsInCaptionMode(false)
      setEditingCaptionId(null)
    }
  }

  // Handle inline editing from control strip
  const handleInlineEditCaption = (rowNumber) => {
    if (!canAccessLoops()) {
      if (planType === 'freebird') {
        showCustomAlertModal(getAdminMessage('plan_upgrade_message', '🔒 Captions require a paid plan. Please upgrade to access this feature.'), [
          { text: 'UPGRADE PLAN', action: () => window.open('/pricing', '_blank') },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      if (!isVideoFavorited) {
        showCustomAlertModal(getAdminMessage('save_to_favorites_message', '⭐ Please save this video to favorites before editing captions.'), [
          { text: 'SAVE TO FAVORITES', action: () => { hideCustomAlertModal(); handleFavoriteToggle(); } },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      return
    }

    // Check if video is playing
    if (isVideoPlayingFromUtils(player)) {
      showVideoPlayingRestrictionFromUtils({
        getAdminMessage,
        showCustomAlertModal,
        hideCustomAlertModal
      })
      return
    }

    // Check if there are captions to edit
    if (captions.length === 0) {

      return
    }

    // Find current caption at this time
    let currentTime = 0
    if (player && isPlayerReadyFromUtils(player)) {
      try {
        currentTime = Math.floor(player.getCurrentTime())
      } catch (error) {
        console.error('Error getting current time:', error)
      }
    }

    const currentCaption = captions.find(caption => {
      const start = timeToSeconds(caption.startTime)
      const end = timeToSeconds(caption.endTime)
      return currentTime >= start && currentTime <= end
    })

    if (!currentCaption) {
      
      return
    }

    // Enter caption mode for editing
    setIsInCaptionMode(true)
    setEditingCaptionId(currentCaption.id)
    
    // Capture original caption state for potential reversion
    setOriginalCaptionsSnapshot(JSON.parse(JSON.stringify(captions)))
    
    // Update footer fields to control this caption
    setTempLoopStart(currentCaption.startTime)
    setTempLoopEnd(currentCaption.endTime)
    
            // Entering inline edit mode for caption
  }

  // Handle saving captions
  const handleSaveCaptions = async () => {
    // Sort captions by start time
    const sortedCaptions = [...captions].sort((a, b) => {
      const aStart = timeToSeconds(a.startTime)
      const bStart = timeToSeconds(b.startTime)
      return aStart - bStart
    })

    // Comprehensive validation of all caption times using the new 6-rule system
    console.log('🔍 Validating all captions with comprehensive 6-rule system...')
    
        // Get video duration for validation (Rule 6)
    let videoDurationSeconds = 0
    if (player && isPlayerReadyFromUtils(player)) {
      try {
        videoDurationSeconds = Math.floor(player.getDuration())
        console.log('🔍 Video duration from player:', videoDurationSeconds, 'seconds')
        console.log('🔍 Video duration formatted:', formatSecondsToTime(videoDurationSeconds))
      } catch (error) {
        console.warn('⚠️ Could not get video duration from player, trying alternative method')
        // Try alternative method - get from video element if available
        try {
          const videoElement = document.querySelector('video')
          if (videoElement && !isNaN(videoElement.duration)) {
            videoDurationSeconds = Math.floor(videoElement.duration)
            console.log('🔍 Video duration from player:', videoDurationSeconds, 'seconds')
            console.log('🔍 Video duration formatted:', formatSecondsToTime(videoDurationSeconds))
          }
        } catch (altError) {
        console.warn('⚠️ Could not get video duration from video element either')
        }
      }
    }
    
    if (videoDurationSeconds === 0) {
      console.warn('⚠️ Video duration is 0, skipping Rule 6 validation')
    }
    
    // Validate all captions
    const validationResults = validateAllCaptions(sortedCaptions, videoDurationSeconds)
    
    if (!validationResults.isValid) {
      console.log('❌ Validation failed:', validationResults)
      
      // Find the first caption with validation failures for highlighting
      const firstFailedCaption = validationResults.captionResults.find(result => !result.isValid)
      if (firstFailedCaption) {
        setConflictRowIndex(firstFailedCaption.captionIndex)
      }
      
      // Get the first failure reason for the alert
      const firstFailure = validationResults.allFailures[0]
      
      // Show validation failure alert
      showCustomAlertModal(
        `Caption validation failed!\n\n` +
        `Rule ${firstFailure.rule} failed: ${firstFailure.reason}\n\n` +
        `Suggestion: ${firstFailure.suggestion}\n\n` +
        `Please fix the validation errors before saving.`,
        [
          {
            text: 'OK - I\'ll Fix It',
            action: hideCustomAlertModal
          }
        ]
      )
      return
    }
    
    console.log('✅ All captions passed validation')

    // Clear any previous conflict highlighting
    setConflictRowIndex(-1)

    // TODO: Save to Supabase
    console.log('🔍 handleSaveCaptions: About to save captions to database')
    console.log('🔍 Captions to save:', sortedCaptions)
    
    try {
      // Save all captions to database
      const savePromises = []
      
      for (const caption of sortedCaptions) {
        if (caption.id && typeof caption.id === 'string' && caption.id.length > 20) {
          // Existing caption with valid UUID - update if modified
          console.log('🔍 Updating existing caption:', caption.id)
          savePromises.push(updateCaption(caption.id, {
            startTime: caption.startTime,
            endTime: caption.endTime,
            line1: caption.line1,
            line2: caption.line2
          }, user?.id, setIsLoadingCaptions, setDbError))
        } else {
          // New caption (id is null, undefined, or invalid) - save it
          console.log('🔍 Saving new caption:', caption)
          savePromises.push(saveCaption({
            startTime: caption.startTime,
            endTime: caption.endTime,
            line1: caption.line1,
            line2: caption.line2,
            rowType: caption.rowType
          }, videoId, user?.id, setIsLoadingCaptions, setDbError))
        }
      }
      
      // Wait for all database operations to complete
      console.log('🔍 Waiting for', savePromises.length, 'database operations to complete')
      const savedResults = await Promise.all(savePromises)
      console.log('🔍 Database save results:', savedResults)
      
      // Update local state with saved captions (now with database IDs)
      setCaptions(sortedCaptions)
      
      // Update the snapshot to reflect the new "saved" state
      setOriginalCaptionsSnapshot(JSON.parse(JSON.stringify(sortedCaptions)))
      console.log('✅ All captions saved to database successfully')
      
    } catch (error) {
      console.error('❌ Error saving captions to database:', error)
      setDbError('Failed to save captions to database')
      return // Keep modal open if save fails
    }
    
    // Close modal
    setShowCaptionModal(false)
    setEditingCaption(null)
    setIsAddingNewCaption(false)
  }

  // Handle canceling caption editing
  const handleCancelCaptions = () => {
    // Revert all changes back to original state when modal was opened
    if (originalCaptionsSnapshot) {
      setCaptions(JSON.parse(JSON.stringify(originalCaptionsSnapshot)))
              // Reverted captions to original state
    }
    
    // Clear the snapshot
    setOriginalCaptionsSnapshot(null)
    
    // Close modal and reset states
    setShowCaptionModal(false)
    setIsAddingNewCaption(false)
    setEditingCaption(null)
    
            // Caption editing cancelled - all changes reverted
  }

  // 🎸 Handle canceling chord caption editing
  const handleCancelChordCaptions = async () => {
    try {
      console.log('🎸 CANCELLING CHORD CAPTIONS - Starting delete + restore process...')
      
      // Check if we have a blob to restore from
      if (!originalChordCaptionsBlob) {
        console.log('⚠️ No original chord captions blob found - just closing modal')
        setShowChordModal(false)
        return
      }
      
      // Step 1: Delete ALL chord captions for this video from database
      console.log('🗑️ Step 1: Deleting all chord captions from database...')
      const deleteSuccess = await deleteAllChordCaptions(videoId, user?.id, setIsLoadingChords, setDbError)
      
      if (!deleteSuccess) {
        console.error('❌ Failed to delete chord captions - cannot proceed with cancel')
        setDbError('Failed to cancel changes - please try again')
        return
      }
      
      // Step 2: Restore chord captions from the original blob
      console.log('🔄 Step 2: Restoring chord captions from original blob...')
      const restoreSuccess = await saveChordCaptions(originalChordCaptionsBlob, videoId, user?.id, setIsLoadingChords, setDbError)
      
      if (!restoreSuccess) {
        console.error('❌ CRITICAL ERROR: Failed to restore chord captions from blob!')
        // TODO: Log to ERROR-LOG table with CRITICAL-NOTIFY-ADMIN flag when we have that table
        setDbError('CRITICAL ERROR: Failed to restore chord captions. Please contact support.')
        return
      }
      
      // Step 3: Update local state to match restored database state
      console.log('✅ Step 3: Updating local state to match restored database...')
      setChordCaptions(JSON.parse(JSON.stringify(originalChordCaptionsBlob)))
      
      // Step 4: Clear the blob and close modal
      console.log('🧹 Step 4: Clearing blob and closing modal...')
      setOriginalChordCaptionsBlob(null)
      setShowChordModal(false)
      
      console.log('🎸 CHORD CAPTIONS CANCELLED SUCCESSFULLY - All changes reverted!')
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in handleCancelChordCaptions:', error)
      // TODO: Log to ERROR-LOG table with CRITICAL-NOTIFY-ADMIN flag when we have that table
      setDbError('Critical error during cancel operation. Please contact support.')
    }
  }

  // Handle duplicate caption
  const handleDuplicateCaption = (captionIndex) => {
    try {
      const originalCaption = captions[captionIndex]
      if (!originalCaption) return
      
      // Check if there's enough space before duplicating ANY caption
      const sortedCaptionsForCheck = [...captions].sort((a, b) => {
        const timeA = parseTimeToSeconds(a.startTime)
        const timeB = parseTimeToSeconds(b.startTime)
        return timeA - timeB
      })
      
      const currentCaptionIndex = sortedCaptionsForCheck.findIndex(c => c.id === originalCaption.id)
      const nextCaption = sortedCaptionsForCheck[currentCaptionIndex + 1]
      
      if (nextCaption) {
        // Calculate available space between current caption end and next caption start
        const currentCaptionEndTime = parseTimeToSeconds(originalCaption.endTime)
        const nextCaptionStartTime = parseTimeToSeconds(nextCaption.startTime)
        const availableSpace = nextCaptionStartTime - currentCaptionEndTime
        const requiredSpace = userDefaultCaptionDuration || 10
        
        if (availableSpace < requiredSpace) {
          // NOT ENOUGH SPACE - Show alert and don't duplicate
          showCustomAlertModal(
            `New caption cannot be created because there is less than ${requiredSpace} seconds of space before next caption.`,
            [
              { text: 'OK', action: hideCustomAlertModal }
            ]
          )
          return // Exit function, don't duplicate
        }
      }
      
      // ENOUGH SPACE - Use consistent duplication logic for ALL captions
      const originalEndTime = parseTimeToSeconds(originalCaption.endTime)
      const newStartTime = originalEndTime
      let newEndTime = originalEndTime + (userDefaultCaptionDuration || 10)
      
      // Use utility function for smart duration calculation and video length validation
      const { startTime: calculatedStartTime, endTime: calculatedEndTime, wasTrimmed, reason } = calculateSmartCaptionDuration(
        newStartTime,
        captions,
        userDefaultCaptionDuration,
        getVideoDuration()
      )
      
      // Update the calculated end time
      newEndTime = calculatedEndTime
      
      const duplicateCaption = {
        ...originalCaption,
        id: null, // Will get new ID when saved
        startTime: formatSecondsToTime(newStartTime), // Start where original ends
        endTime: formatSecondsToTime(newEndTime), // Add user-preferred duration
        serial_number: null // Will be assigned by database
      }
      
      // Add duplicate caption WITHOUT modifying original caption
      const newCaptions = [...captions, duplicateCaption]
      
      // Sort by start time and reassign serial numbers
      const sortedCaptions = newCaptions.sort((a, b) => {
        const timeA = parseTimeToSeconds(a.startTime)
        const timeB = parseTimeToSeconds(b.startTime)
        return timeA - timeB
      }).map((caption, index) => ({
        ...caption,
        serial_number: index + 1
      }))
      
      // Update state with sorted captions and new serial numbers
      setCaptions(sortedCaptions)
      
      // Caption duplicated successfully with consistent logic
      
    } catch (error) {
      console.error('❌ Error duplicating caption:', error)
      setDbError('Failed to duplicate caption')
    }
  }

  // Handle delete caption confirmation
  const handleDeleteCaption = (captionIndex) => {
    console.log('🔍 handleDeleteCaption called with index:', captionIndex)
    setCaptionToDelete(captionIndex)
    setShowDeleteConfirm(true)
    console.log('🔍 Set captionToDelete to:', captionIndex, 'and showDeleteConfirm to true')
  }

  // Handle delete all captions
  const handleDeleteAllCaptions = () => {
    if (captions.length === 0) return
    
    // Show confirmation dialog
    showCustomAlertModal(
      'Are you sure you want to delete ALL captions? This action cannot be undone.',
      [
        { 
          text: 'DELETE ALL', 
          action: async () => {
            try {
              // Delete all captions from database
              for (const caption of captions) {
                if (caption.id) {
                  await deleteCaption(caption.id, user?.id, setIsLoadingCaptions, setDbError)
                }
              }
              
              // Clear local state
              setCaptions([])
              hideCustomAlertModal()
              
      
            } catch (error) {
              console.error('❌ Error deleting all captions:', error)
              setDbError('Failed to delete all captions')
            }
          }
        },
        { 
          text: 'CANCEL', 
          action: hideCustomAlertModal 
        }
      ]
    )
  }

  // Confirm caption deletion
  const handleConfirmDelete = async () => {
    console.log('🔍 handleConfirmDelete called, captionToDelete:', captionToDelete)
    if (captionToDelete !== null) {
      try {
        const captionToDeleteObj = captions[captionToDelete]
        console.log('🔍 captionToDeleteObj:', captionToDeleteObj)
        if (captionToDeleteObj?.id) {
          console.log('🔍 Calling deleteCaption with ID:', captionToDeleteObj.id)
          const deleted = await deleteCaption(captionToDeleteObj.id, user?.id, setIsLoadingCaptions, setDbError)
          console.log('🔍 deleteCaption result:', deleted)
          if (deleted) {
            const newCaptions = captions.filter((_, i) => i !== captionToDelete)
            setCaptions(newCaptions)
            setCaptionToDelete(null)
            setShowDeleteConfirm(false)
            console.log('✅ Caption deleted successfully')
    
          } else {
            console.error('❌ Failed to delete caption from database')
            setDbError('Failed to delete caption')
          }
        } else {
          // Fallback for captions without database IDs
          const newCaptions = captions.filter((_, i) => i !== captionToDelete)
          setCaptions(newCaptions)
          setCaptionToDelete(null)
          setShowDeleteConfirm(false)
          console.log('✅ Caption removed from local state (no DB ID)')
        }
      } catch (error) {
        console.error('❌ Error deleting caption:', error)
        setDbError('Failed to delete caption')
      }
    } else {
      console.log('❌ captionToDelete is null, nothing to delete')
    }
  }

  // Cancel caption deletion
  const handleCancelDelete = () => {
    setCaptionToDelete(null)
    setShowDeleteConfirm(false)
  }

  // Video flip handler - cycles through 3 states
  const handleFlipVideo = () => {
    // Check daily watch time limits before allowing flip feature
    if (!checkDailyWatchTimeLimits(currentDailyTotal, { returnBoolean: true })) {
              // Flip Video access blocked - daily limit exceeded
      return
    }
    
    switch(flipState) {
      case 'normal':
        setFlipState('horizontal')
        break
      case 'horizontal':
        setFlipState('both')
        break
      case 'both':
        setFlipState('normal')
        break
      default:
        setFlipState('normal')
    }
  }

  // Loop modal handlers
  const handleLoopClick = () => {
    // Check daily watch time limits before allowing loop feature
    if (!checkDailyWatchTimeLimits(currentDailyTotal, { returnBoolean: true })) {
      // Loop access blocked - daily limit exceeded
      return
    }
    
    // Check if user can access loops
    if (!canAccessLoops()) {
      if (planType === 'freebird') {
        showCustomAlertModal(getAdminMessage('plan_upgrade_message', '🔒 Loops require a paid plan. Please upgrade to access this feature.'), [
          { text: 'UPGRADE PLAN', action: () => window.open('/pricing', '_blank') },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      if (!isVideoFavorited) {
        showCustomAlertModal(getAdminMessage('save_to_favorites_message', '⭐ Please save this video to favorites before creating loops.'), [
          { text: 'SAVE TO FAVORITES', action: () => { hideCustomAlertModal(); handleFavoriteToggle(); } },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      return
    }

    if (isLoopActive) {
      // Stop the loop
      setIsLoopActive(false)
      // Loop stopped
    } else {
      // Open modal for configuration
      setTempLoopStart(loopStartTime)
      setTempLoopEnd(loopEndTime)
      setShowLoopModal(true)
    }
  }

  const handleLoopTimesClick = () => {
    // Check daily watch time limits before allowing loop feature
    if (!checkDailyWatchTimeLimits(currentDailyTotal, { returnBoolean: true })) {
      // Loop access blocked - daily limit exceeded
      return
    }
    
    // Check if user can access loops
    if (!canAccessLoops()) {
      if (planType === 'freebird') {
        showCustomAlertModal(getAdminMessage('plan_upgrade_message', '🔒 Loops require a paid plan. Please upgrade to access this feature.'), [
          { text: 'UPGRADE PLAN', action: () => window.open('/pricing', '_blank') },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      if (!isVideoFavorited) {
        showCustomAlertModal(getAdminMessage('save_to_favorites_message', '⭐ Please save this video to favorites before creating loops.'), [
          { text: 'SAVE TO FAVORITES', action: () => { hideCustomAlertModal(); handleFavoriteToggle(); } },
          { text: 'OK', action: hideCustomAlertModal }
        ])
        return
      }
      return
    }

    // Open modal directly when clicking on time display
    setTempLoopStart(loopStartTime)
    setTempLoopEnd(loopEndTime)
    setShowLoopModal(true)
  }

  const handleSaveLoop = () => {
    // Update the actual loop times
    setLoopStartTime(tempLoopStart)
    setLoopEndTime(tempLoopEnd)
    
    // Start the loop
    setIsLoopActive(true)
    
    // Close modal
    setShowLoopModal(false)
    
    // Loop started
    
    // Debug: Log the converted seconds
    const startSeconds = timeToSeconds(tempLoopStart)
    const endSeconds = timeToSeconds(tempLoopEnd)
    // Loop seconds
    
    // CRITICAL: Jump to start time immediately when loop starts
    if (player && player.seekTo && typeof player.seekTo === 'function') {
      try {
        player.seekTo(startSeconds, true)

      } catch (error) {
        console.error('Initial seek error:', error)
      }
    }
  }

  const handleCancelLoop = () => {
    // Just close modal, don't start loop or update times
    setShowLoopModal(false)
            // Loop configuration cancelled
  }



  // Check if video should loop (runs every second when loop is active)
  useEffect(() => {
    if (!isLoopActive || !player || !isPlayerReadyFromUtils(player)) return

    const loopInterval = setInterval(() => {
      try {
        if (player.getCurrentTime && typeof player.getCurrentTime === 'function') {
          const currentTime = player.getCurrentTime()
          const startSeconds = timeToSeconds(loopStartTime)
          const endSeconds = timeToSeconds(loopEndTime)
          
          // Debug: Log current loop status every 5 seconds
          if (Math.floor(currentTime) % 5 === 0) {
            // Loop check
          }
          
          // If we've reached or passed the end time, loop back to start
          if (currentTime >= endSeconds) {
            if (player.seekTo && typeof player.seekTo === 'function') {
              player.seekTo(startSeconds, true)
              // Looping back to start
            }
          }
        }
      } catch (error) {
        console.error('Loop check error:', error)
      }
    }, 1000) // Check every second

    return () => clearInterval(loopInterval)
  }, [isLoopActive, player, loopStartTime, loopEndTime])

  // Effect to auto-sort captions by start time
  useEffect(() => {
    if (captions.length > 0) {
      const sortedCaptions = [...captions].sort((a, b) => {
        const timeA = timeToSeconds(a.startTime)
        const timeB = timeToSeconds(b.startTime)
        return timeA - timeB
      })
      
      // Only update if order actually changed
      const orderChanged = sortedCaptions.some((caption, index) => caption.id !== captions[index].id)
      if (orderChanged) {
        // Auto-sorting captions by start time
        setCaptions(sortedCaptions)
      }
    }
  }, [captions])

  // Effect to update displayed caption based on video time
  useEffect(() => {
    if (!player || !isPlayerReadyFromUtils(player) || captions.length === 0) return

    const captionUpdateInterval = setInterval(() => {
      try {
        const currentTime = player.getCurrentTime()
        
        // SMART UPDATE: Only force re-render if NOT currently editing inline
        // This prevents the 500ms updates from clearing user input while typing
        if (!isInCaptionMode) {
          // Force re-render to update displayed caption
          setCaptions(prev => [...prev])
        }
      } catch (error) {
        console.error('Caption update error:', error)
      }
    }, 500) // Update every 500ms for smooth caption transitions

    return () => clearInterval(captionUpdateInterval)
  }, [player, captions.length, isInCaptionMode])



  // Effect to load user's default caption duration on component mount
  useEffect(() => {
    if (user?.id) {
      loadUserDefaultCaptionDuration()
    }
  }, [user?.id])

  // REMOVED: Problematic useEffect that was corrupting caption data
  // This useEffect was bypassing validation and setting invalid times
  // Caption updates now only happen through the SAVE button with proper validation

  // Fullscreen toggle handler
  const handleFullscreenToggle = async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        const videoContainer = document.getElementById('video-container')
        if (videoContainer) {
          await videoContainer.requestFullscreen()
          setIsFullscreen(true)
          // Entered fullscreen mode
        }
      } else {
        // Exit fullscreen
        if (document.fullscreenElement) {
          await document.exitFullscreen()
          setIsFullscreen(false)
          // Exited fullscreen mode
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (!mounted || (loading && !router.isReady)) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Full-Screen Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/gt_splashBG_dark.png')`,
          width: '100%',
          height: '100%',
          minWidth: '100vw',
          minHeight: '100vh'
        }}
      />
      
      {/* 75% Black Overlay */}
      <div className="absolute inset-0 bg-black/75 z-0" />
      
      {/* Top Banner - Admin controlled */}
      <TopBanner />
      
      {/* Header Component with Search Functionality */}
      <Header 
        showBrainIcon={false}
        showSearchIcon={false}
        logoImage="/images/gt_logoM_PlayButton.png"
        // Search functionality
        showSearchBar={true}
        showFavoritesToggle={false}
        showResumeButton={true}
        showSortDropdown={false}
        // Search state
        searchQuery={searchQuery}
        sortOrder="relevance"
        showFavoritesOnly={false}
        savedSession={null}
        // Event handlers
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onFavoritesToggle={() => router.push('/search?show_favorites=true')}
        onResumeClick={() => {}}
        onSortChange={() => {}}
        // Standard props
        onAuthClick={handleAuthClick}
        onMenuClick={() => setShowMenuModal(true)}
        isAuthenticated={isAuthenticated}
      />

      {/* Main Content Area - Theatre Mode Layout with Dynamic Height */}
      <div className="relative z-10 overflow-hidden px-6 mt-20" style={{ 
        height: showControlStrips ? `calc(100vh - ${160 + (showRow1 ? 51.2 : 0) + (showRow2 ? 102.4 : 0) + (showRow3 ? 102.4 : 0)}px)` : 'calc(100vh - 155px)',
        transition: 'height 0.3s ease-in-out'
      }}>
        {/* Video Player Container - Edge-to-Edge Width with Dynamic Height */}
        <div id="video-container" className="w-full max-w-none h-full flex items-center justify-center">
          {/* YouTube Video Player - Theatre Mode with Dynamic Sizing */}
          {videoId && (
            <div className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl">
              {/* Video Container - Dynamic height based on available space with flip transformations */}
              <div 
                className="relative w-full h-full transition-transform duration-300"
                style={{
                  // Calculate height to maintain 16:9 aspect ratio within available space
                  height: '100%',
                  maxHeight: '100%',
                  // Ensure video never exceeds container bounds
                  objectFit: 'contain',
                  // Apply flip transformations based on state
                  transform: flipState === 'horizontal' 
                    ? 'scaleX(-1)' 
                    : flipState === 'both'
                    ? 'scaleX(-1) scaleY(-1)'
                    : 'none'
                }}
              >
                {/* YouTube API Player */}
                <div id="youtube-player" className="w-full h-full" />
                
                {/* Fallback iframe if API fails */}
                {!player && (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&showinfo=0&origin=${window.location.origin}`}
                    title={videoTitle}
                    className="w-full h-full absolute inset-0"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
              

            </div>
          )}
        </div>
      </div>

      {/* STICKY CONTROL STRIPS FOOTER */}
      {showControlStrips && (
        <div className="fixed bottom-16 left-0 right-0 z-40 h-64 bg-transparent px-4 md:px-6">
          {/* Control Strips Container - Dynamic positioning from bottom */}
          <div className="h-full relative">
            
            {/* Row 1: Text Captions - 24% height, positioned from bottom */}
            {showRow1 && (
              <div className={`absolute left-0 right-0 flex border-2 border-white rounded-t-lg overflow-hidden h-[24%] transition-all duration-300 ${
                showRow2 && showRow3 ? 'bottom-[76%]' : 
                showRow2 ? 'bottom-[38%]' : 
                showRow3 ? 'bottom-[38%]' : 'bottom-0'
              }`}>
              {/* Left Column - Main Content (92% width) */}
              <div className="w-[92%] p-2 bg-transparent border-r-2 border-white flex flex-col justify-center overflow-hidden">
                {/* Display current caption based on video time */}
                {(() => {
                  if (!player || captions.length === 0) {
                    return <span className="text-white text-sm font-medium">Text Captions</span>
                  }
                  
                  try {
                    const currentTime = player.getCurrentTime()
                    
                    const currentCaption = captions.find(caption => {
                      const start = timeToSeconds(caption.startTime)
                      const end = timeToSeconds(caption.endTime)
                      return currentTime >= start && currentTime <= end
                    })
                    
                    if (currentCaption) {
                      // Check if we're editing this caption inline
                      const isEditingThisCaption = isInCaptionMode && editingCaptionId === currentCaption.id
                      
                      if (isEditingThisCaption) {
                        return (
                          <div className="space-y-0.5">
                            <input
                              type="text"
                              value={currentCaption.line1}
                              onChange={(e) => {
                                setCaptions(prev => prev.map(caption => 
                                  caption.id === currentCaption.id 
                                    ? { ...caption, line1: e.target.value }
                                    : caption
                                ))
                              }}
                              className="w-full px-2 py-1 text-[15px] bg-white/20 text-white border border-white/30 rounded focus:border-blue-400 focus:outline-none font-bold"
                              placeholder="First line of caption"
                            />
                            <input
                              type="text"
                              value={currentCaption.line2}
                              onChange={(e) => {
                                setCaptions(prev => prev.map(caption => 
                                  caption.id === currentCaption.id 
                                    ? { ...caption, line2: e.target.value }
                                    : caption
                                ))
                              }}
                              className="w-full px-2 py-1 text-[15px] bg-white/20 text-white border border-white/30 rounded focus:border-blue-400 focus:outline-none"
                              placeholder="Second line of caption"
                            />
                          </div>
                        )
                      } else {
                        return (
                          <div className="text-white text-[15px]">
                            <div className="font-bold">{currentCaption.line1}</div>
                            {currentCaption.line2 && <div className="text-gray-300">{currentCaption.line2}</div>}
                          </div>
                        )
                      }
                    } else {
                      return <span className="text-white text-sm font-medium">Text Captions</span>
                    }
                  } catch (error) {
                    return <span className="text-white text-sm font-medium">Text Captions</span>
                  }
                })()}
              </div>
              {/* Middle Column - ADD + EDIT icons (4% width) */}
              <div className="w-[4%] p-2 bg-transparent border-r-2 border-white flex flex-col items-center justify-center space-y-3">
                <button 
                  onClick={() => handleAddCaptionFromControlStrip(1)}
                  className={`transition-opacity cursor-pointer ${
                    isInCaptionMode 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Disabled while editing" : "Add new caption at current time"}
                  disabled={isInCaptionMode}
                >
                  <FaPlus className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={() => handleInlineEditCaption(1)}
                  className={`transition-colors cursor-pointer ${
                    isInCaptionMode 
                      ? 'text-green-400' 
                      : 'text-white hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Currently editing captions" : "Edit caption inline"}
                  disabled={isInCaptionMode}
                >
                  <FaRegEdit className="w-4 h-4" />
                </button>
              </div>
              {/* Right Column - EYE + CgViewList icons (4% width) */}
              <div className="w-[4%] p-2 bg-transparent flex flex-col items-center justify-center space-y-2">
                <button 
                  onClick={() => !isInCaptionMode && handleRowToggle(1)}
                  className={`transition-opacity cursor-pointer ${
                    isInCaptionMode 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Disabled while editing" : "Hide this row"}
                  disabled={isInCaptionMode}
                >
                  <FaRegEye className="w-5 h-5 text-white" />
                </button>
                <button 
                  onClick={() => !isInCaptionMode && handleCaptionEditClick(1)}
                  className={`transition-opacity cursor-pointer ${
                    isInCaptionMode 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Disabled while editing" : "Open caption editor modal"}
                  disabled={isInCaptionMode}
                >
                  <CgViewList className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            )}

            {/* Row 2: Chords Captions - 38% height, positioned from bottom */}
            {showRow2 && (
              <div className={`absolute left-0 right-0 flex border-l-2 border-r-2 border-white overflow-hidden h-[38%] transition-all duration-300 ${
                showRow3 ? 'bottom-[38%]' : 'bottom-0'
              }`}>
              {/* Left Column - Main Content (92% width) */}
              <div className="w-[92%] p-2 bg-transparent border-r-2 border-white flex items-center">
                <span className="text-white text-sm font-medium">Chords Captions</span>
              </div>
              {/* Middle Column - ADD + EDIT icons (4% width) */}
              <div className="w-[4%] p-2 bg-transparent border-r-2 border-white flex flex-col items-center justify-center space-y-3">
                <button 
                  onClick={() => handleAddCaptionFromControlStrip(2)}
                  className={`transition-opacity cursor-pointer ${
                    isInCaptionMode 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Disabled while editing" : "Add new caption at current time"}
                  disabled={isInCaptionMode}
                >
                  <FaPlus className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={() => handleInlineEditCaption(2)}
                  className={`transition-colors cursor-pointer ${
                    isInCaptionMode 
                      ? 'text-green-400' 
                      : 'text-white hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Currently editing captions" : "Edit caption inline"}
                  disabled={isInCaptionMode}
                >
                  <FaRegEdit className="w-4 h-4" />
                </button>
              </div>
              {/* Right Column - EYE + CgViewList icons (4% width) */}
              <div className="w-[4%] p-2 bg-transparent flex flex-col items-center justify-center space-y-2">
                <button 
                  onClick={() => !isInCaptionMode && handleRowToggle(2)}
                  className={`transition-opacity cursor-pointer ${
                    isInCaptionMode 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Disabled while editing" : "Hide this row"}
                  disabled={isInCaptionMode}
                >
                  <FaRegEye className="w-5 h-5 text-white" />
                </button>
                <button 
                  onClick={() => !isInCaptionMode && handleChordModalOpen()}
                  className={`transition-opacity cursor-pointer ${
                    isInCaptionMode 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Disabled while editing" : "Open chord modal"}
                  disabled={isInCaptionMode}
                >
                  <CgViewList className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            )}

            {/* Row 3: Auto-Gen - 38% height, always at bottom */}
            {showRow3 && (
              <div className="absolute bottom-0 left-0 right-0 flex border-2 border-white rounded-b-lg overflow-hidden h-[38%] transition-all duration-300">
              {/* Left Column - Main Content (92% width) */}
              <div className="w-[92%] p-2 bg-transparent border-r-2 border-white flex items-center">
                <span className="text-white text-sm font-medium">Auto-Gen</span>
              </div>
              {/* Middle Column - ADD + EDIT icons (4% width) */}
              <div className="w-[4%] p-2 bg-transparent border-r-2 border-white flex flex-col items-center justify-center space-y-3">
                <button 
                  onClick={() => handleAddCaptionFromControlStrip(3)}
                  className={`transition-opacity cursor-pointer ${
                    isInCaptionMode 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Disabled while editing" : "Add new caption at current time"}
                  disabled={isInCaptionMode}
                >
                  <FaPlus className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={() => handleInlineEditCaption(3)}
                  className={`transition-colors cursor-pointer ${
                    isInCaptionMode 
                      ? 'text-gray-400' 
                      : 'text-white hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Currently editing captions" : "Edit caption inline"}
                  disabled={isInCaptionMode}
                >
                  <FaRegEdit className="w-4 h-4" />
                </button>
              </div>
              {/* Right Column - EYE + CgViewList icons (4% width) */}
              <div className="w-[4%] p-2 bg-transparent flex flex-col items-center justify-center space-y-2">
                <button 
                  onClick={() => !isInCaptionMode && handleRowToggle(3)}
                  className={`transition-opacity cursor-pointer ${
                    isInCaptionMode 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Disabled while editing" : "Hide this row"}
                  disabled={isInCaptionMode}
                >
                  <FaRegEye className="w-5 h-5 text-white" />
                </button>
                <button 
                  onClick={() => !isInCaptionMode && handleCaptionEditClick(3)}
                  className={`transition-opacity cursor-pointer ${
                    isInCaptionMode 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:opacity-70'
                  }`}
                  title={isInCaptionMode ? "Disabled while editing" : "Open caption editor modal"}
                  disabled={isInCaptionMode}
                >
                  <CgViewList className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            )}

          </div>
        </div>
      )}

      {/* PERMANENT FOOTER CONTROL AREA - NEVER DISAPPEARS */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-t border-white/20 p-1">
        <div className="flex justify-between max-w-7xl mx-auto h-full">
          
          {/* Left Column - Left-justified content with Video Controls */}
          <div className="flex items-center justify-start space-x-3" style={{ paddingLeft: '11px' }}>
            {/* Flip Video Button - 3 States */}
            <button
              onClick={handleFlipVideo}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                flipState === 'normal' 
                  ? 'text-white hover:bg-white/10' 
                  : flipState === 'horizontal'
                  ? 'text-yellow-400 hover:bg-white/10'
                  : 'text-green-400 hover:bg-white/10'
              }`}
              title={`Flip Video - Current: ${flipState === 'normal' ? 'Normal' : flipState === 'horizontal' ? 'Horizontal' : 'Both Directions'}`}
            >
              <MdFlipCameraAndroid className="w-5 h-5" />
            </button>

            {/* Loop Segment / Caption Mode Button */}
            <button
              onClick={isInCaptionMode ? undefined : handleLoopClick}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isInCaptionMode
                  ? 'text-blue-400 cursor-default' 
                  : isLoopActive 
                  ? 'text-blue-400 hover:bg-white/10' 
                  : 'text-white hover:bg-white/10'
              }`}
              title={isInCaptionMode ? "Caption Mode Active" : (isLoopActive ? "Stop loop" : "Configure loop segment")}
            >
              {isInCaptionMode ? (
                <IoText className="w-5 h-5" />
              ) : (
                <ImLoop className="w-5 h-5" />
              )}
            </button>







            {/* Loop Time Display / Caption Timing Fields */}
            <div className="flex flex-col items-start space-y-1">
              {/* Mode indicator */}
              {isInCaptionMode && (
                <span className="text-xs text-blue-400 font-medium">
                  Caption Timing
                </span>
              )}
              
              {isInCaptionMode ? (
                /* Caption timing display with SAVE/CANCEL buttons */
                <div className="flex items-center space-x-2">
                  <span className="w-16 px-2 py-1 text-xs bg-white/20 text-white border border-white/30 rounded">
                    {tempLoopStart}
                  </span>
                  <span className="text-white text-xs">-</span>
                  <span className="w-16 px-2 py-1 text-xs bg-white/20 text-white border border-white/30 rounded">
                    {tempLoopEnd}
                  </span>
                  
                  {/* SAVE button for new caption */}
                  <button
                    onClick={handleSaveNewCaption}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors cursor-pointer min-w-[50px] text-center"
                    title="Save new caption and exit edit mode"
                  >
                    SAVE
                  </button>
                  
                  {/* CANCEL button for new caption */}
                  <button
                    onClick={handleCancelNewCaption}
                    className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer min-w-[50px] text-center"
                    title="Cancel new caption and exit edit mode"
                  >
                    CANCEL
                  </button>
                </div>
              ) : (
                /* Read-only loop timing display */
                <button
                  onClick={handleLoopTimesClick}
                  className={`text-sm font-mono transition-colors cursor-pointer hover:opacity-80 ${
                    isLoopActive ? 'text-blue-400' : 'text-gray-300'
                  }`}
                  title="Click to edit loop times"
                >
                  {loopStartTime} - {loopEndTime}
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Right-justified content */}
          <div className="flex items-center justify-end space-x-3" style={{ paddingRight: '12px' }}>
            {/* Guitar Pick Favorites */}
            <button 
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isVideoFavorited 
                  ? 'text-[#8dc641] hover:bg-white/10' 
                  : 'text-gray-400 hover:text-[#8dc641] hover:bg-white/10'
              }`}
              title={isVideoFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <TbGuitarPickFilled className="w-5 h-5" />
            </button>
            
            {/* Control Strip Toggle (Game Controller) */}
            <button
              onClick={handleControlStripsToggle}
              className={`rounded-lg transition-colors duration-300 ${
                showControlStrips 
                  ? 'text-red-400 hover:bg-white/10' 
                  : 'text-white hover:bg-white/10'
              }`}
              style={{ padding: '5.5px' }}
              title={showControlStrips ? "Hide Control Strips" : "Show Control Strips"}
            >
              <IoGameControllerOutline className="w-6 h-6" />
            </button>
            
            {/* Layout Icon */}
            <button className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-300" title="Inline Search - under development">
              <BsReverseLayoutSidebarInsetReverse className="w-5 h-5" />
            </button>
            
            {/* Custom Fullscreen Button */}
            <button
              onClick={handleFullscreenToggle}
              className="p-2 rounded-lg transition-colors duration-300 text-white hover:bg-white/10"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <BsArrowsFullscreen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>



      {/* Unfavorite Warning Modal */}
      {showUnfavoriteWarning && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUnfavoriteWarning(false)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-sm w-full relative text-white p-6">
            {/* Modal Content */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-4">⚠️ Remove from Favorites?</h2>
              <p className="text-gray-300 text-sm">
                Removing this favorite will also delete all user entered meta-data. This action cannot be undone. Proceed?
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleUnfavoriteCancel}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleUnfavoriteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                PROCEED
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Limit Upgrade Modal */}
      {showUpgradeModal && dailyLimitInfo && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUpgradeModal(false)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-md w-full relative text-white p-6">
            {/* Modal Content */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-4 text-red-400">⏰ Daily Limit Exceeded</h2>
              <p className="text-gray-300 text-sm mb-4">
                Sorry, you've exceeded your <span className="font-semibold text-blue-400">{dailyLimitInfo.planType.toUpperCase()}</span> plan daily watch limit.
              </p>
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-300">
                  <span className="text-red-400">Used:</span> {dailyLimitInfo.dailyMinutes} minutes
                </p>
                <p className="text-sm text-gray-300">
                  <span className="text-green-400">Limit:</span> {dailyLimitInfo.userLimit} minutes
                </p>
              </div>
              <p className="text-gray-300 text-xs">
                Your daily limit resets at midnight. Upgrade your plan for more watch time!
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false)
                  router.push('/pricing')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                UPGRADE PLAN
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false)
                  router.push('/')
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                GO HOME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        handleCancelDelete={handleCancelDelete}
        handleConfirmDelete={handleConfirmDelete}
      />

      {/* Caption Editor Modal */}
      <CaptionEditorModal
        showCaptionModal={showCaptionModal}
        editingCaption={editingCaption}
        captions={captions}
        setCaptions={setCaptions}
        conflictRowIndex={conflictRowIndex}
        userDefaultCaptionDuration={userDefaultCaptionDuration}
        setUserDefaultCaptionDuration={setUserDefaultCaptionDuration}
        handleCancelCaptions={handleCancelCaptions}
        handleAddCaptionFromTimeline={handleAddCaptionFromTimeline}
        handleDeleteAllCaptions={handleDeleteAllCaptions}
        handleSaveCaptions={handleSaveCaptions}
        handleDuplicateCaption={handleDuplicateCaption}
        handleDeleteCaption={handleDeleteCaption}
        player={player}
        isPlayerReady={isPlayerReadyFromUtils}
        saveUserDefaultCaptionDuration={saveUserDefaultCaptionDuration}
        originalCaptionsSnapshot={originalCaptionsSnapshot}
        showCustomAlertModal={showCustomAlertModal}
        hideCustomAlertModal={hideCustomAlertModal}
        onLocalStateChange={(newLocalCaptions) => {
          // IS THIS NEEDED???
          // This callback allows the modal to update its local state
          // when captions are added/removed from the parent
        }}
      />

      {/* New Caption Placement Dialog */}
      {showAddCaptionDialog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddCaptionDialog(false)
              setSelectedSerialNumber(null)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-md w-full relative text-white p-6">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowAddCaptionDialog(false)
                setSelectedSerialNumber(null)
              }}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            
            {/* Modal Content */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-4">Add New Caption</h2>
            </div>
            
            {/* Serial Number Selection */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-gray-300 text-sm">
                  Add new Caption after Caption #:
                </span>
                
                <select
                  value={selectedSerialNumber || ''}
                  onChange={(e) => setSelectedSerialNumber(parseInt(e.target.value))}
                  className="px-3 py-2 text-sm bg-white/20 text-white border border-white/30 rounded focus:border-blue-400 focus:outline-none w-20"
                >
                  <option value="">#</option>
                  {captions.map((caption) => (
                    <option key={caption.serial_number} value={caption.serial_number}>
                      {caption.serial_number}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Help Text */}
              <div className="text-xs text-gray-400 text-center">
                {selectedSerialNumber && (
                  <div>
                    {selectedSerialNumber === Math.max(...captions.map(c => c.serial_number)) ? (
                      <span>New caption will be added after the last caption with {userDefaultCaptionDuration || 10} seconds duration.</span>
                    ) : (
                      <span>New caption will be inserted between existing captions, splitting the selected caption in half.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleAddCaptionAtPosition}
                disabled={!selectedSerialNumber}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSerialNumber 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                ADD
              </button>
              
              <button
                onClick={() => {
                  setShowAddCaptionDialog(false)
                  setSelectedSerialNumber(null)
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <LoopConfigModal
        showLoopModal={showLoopModal}
        setShowLoopModal={setShowLoopModal}
        isLoopActive={isLoopActive}
        tempLoopStart={tempLoopStart}
        tempLoopEnd={tempLoopEnd}
        setTempLoopStart={setTempLoopStart}
        setTempLoopEnd={setTempLoopEnd}
        handleCancelLoop={handleCancelLoop}
        handleSaveLoop={handleSaveLoop}
      />

      <CustomAlertModal
        showCustomAlert={showCustomAlert}
        customAlertMessage={customAlertMessage}
        customAlertButtons={customAlertButtons}
      />

      {/* Chord Caption Modal */}
      <ChordCaptionModal
        showChordModal={showChordModal}
        setShowChordModal={setShowChordModal}
        videoId={videoId}
        videoDurationSeconds={player ? player.getDuration() : 0}
        currentTimeSeconds={player ? player.getCurrentTime() : 0}
        onChordsUpdated={(chordData) => {
          // Handle chord updates - reload chord captions if needed
          console.log('✅ Chord captions updated')
          
          // 🎸 CAPTURE ORIGINAL CHORD CAPTIONS AS JSON BLOB FOR CANCEL FUNCTIONALITY 🎸
          // =============================================================================
          // Only capture blob if we don't have one yet (first time loading)
          if (!originalChordCaptionsBlob && chordData && chordData.length > 0) {
            setOriginalChordCaptionsBlob(JSON.parse(JSON.stringify(chordData)))
            console.log('🎸 CHORD CAPTIONS CAPTURED:', {
              count: chordData.length,
              blob: JSON.parse(JSON.stringify(chordData))
            })
          }
          // =============================================================================
        }}
        userId={user?.id}
        onCancel={handleCancelChordCaptions}
      />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
      
      {/* Support Modal */}
      <SupportModal 
        isOpen={showSupportModal} 
        onClose={() => setShowSupportModal(false)} 
      />

      {/* Menu Modal */}
      <MenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        onSupportClick={() => setShowSupportModal(true)}
      />
    </div>
  )
}