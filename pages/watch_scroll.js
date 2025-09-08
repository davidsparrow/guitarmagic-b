// pages/watch.js - Watch Page with YouTube Video Player
import { useState, useEffect, useRef, useMemo } from 'react'
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
import SongContentScroller from '../components/SongContentScroller'
import { fetchLyrics, extractSongInfo, generateFallbackLyrics } from '../utils/lyricsUtils'
import {
  parseTimeToSeconds,
  formatSecondsToTime,
  timeToSeconds,
  captureVideoParameters,
  getVideoDuration,
  getCurrentVideoTime
} from '../utils/captionUtils'
import {
  LoopConfigModal,
  CustomAlertModal
} from '../components/CaptionModals'
import {
  checkIfVideoFavorited,
  removeFavorite,
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
  
  // Control strip states - Single row visibility
  const [showControlStrips, setShowControlStrips] = useState(false)

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
  
  
  
  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('')
  
  // Song content states
  const [songContent, setSongContent] = useState('')
  const [isLoadingSongContent, setIsLoadingSongContent] = useState(false)
  const [lyricsSource, setLyricsSource] = useState('api') // 'api' or 'static'
  const [lyricsError, setLyricsError] = useState(null)
  
  // Chord caption states
  const [chordCaptions, setChordCaptions] = useState([])
  const [isLoadingChordCaptions, setIsLoadingChordCaptions] = useState(false)
  const [chordCaptionsError, setChordCaptionsError] = useState(null)

  // Load song content from multiple sources
  const loadSongContent = async () => {
    try {
      setIsLoadingSongContent(true)
      setLyricsError(null)
      
      // Extract song info from video title and channel
      const songInfo = extractSongInfo(videoTitle, videoChannel)
      
      console.log('🎵 Loading lyrics for:', songInfo, 'Source preference:', lyricsSource)
      
      let content = null
      let source = null
      
      // Try API first if preferred, otherwise try static files first
      if (lyricsSource === 'api') {
        try {
          const lyricsData = await fetchLyrics(songInfo.title, songInfo.artist)
          if (lyricsData && lyricsData.html) {
            content = lyricsData.html
            source = 'API'
            console.log('✅ Lyrics loaded from API:', lyricsData.metadata)
          }
        } catch (apiError) {
          console.warn('API failed, trying static files:', apiError.message)
          // Try static files as fallback
          try {
            content = await loadStaticSongContent()
            source = 'Static File'
            console.log('✅ Lyrics loaded from static file')
          } catch (staticError) {
            throw new Error(`Both API and static files failed. API: ${apiError.message}, Static: ${staticError.message}`)
          }
        }
      } else {
        // Try static files first
        try {
          content = await loadStaticSongContent()
          source = 'Static File'
          console.log('✅ Lyrics loaded from static file')
        } catch (staticError) {
          console.warn('Static file failed, trying API:', staticError.message)
          // Try API as fallback
          try {
            const lyricsData = await fetchLyrics(songInfo.title, songInfo.artist)
            if (lyricsData && lyricsData.html) {
              content = lyricsData.html
              source = 'API'
              console.log('✅ Lyrics loaded from API:', lyricsData.metadata)
            }
          } catch (apiError) {
            throw new Error(`Both static files and API failed. Static: ${staticError.message}, API: ${apiError.message}`)
          }
        }
      }
      
      if (content) {
        setSongContent(content)
        console.log(`🎵 Content loaded from ${source}`)
      } else {
        throw new Error('No content received from any source')
      }
      
    } catch (error) {
      console.error('Error loading song content:', error)
      setLyricsError(error.message)
      
      // Generate fallback content based on video info
      const songInfo = extractSongInfo(videoTitle, videoChannel)
      const fallbackContent = generateFallbackLyrics(songInfo.title, songInfo.artist)
      setSongContent(fallbackContent)
    } finally {
      setIsLoadingSongContent(false)
    }
  }

  // Load chord captions for the current video
  const loadChordCaptions = async () => {
    try {
      setIsLoadingChordCaptions(true)
      setChordCaptionsError(null)
      
      if (!user?.id || !videoId) {
        console.log('🔍 No user ID or video ID, skipping chord caption loading')
        return
      }
      
      console.log('🎸 Loading chord captions for video:', videoId)
      
      // First get the favorite record for this video
      const { data: favoriteData, error: favoriteError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .single()
      
      if (favoriteError) {
        if (favoriteError.code === 'PGRST116') {
          // No favorite found
          console.log('🔍 No favorite found for this video, no chord captions to load')
          setChordCaptions([])
          return
        }
        throw favoriteError
      }
      
      // Now get chord captions for this favorite, joined with chord_positions via chord_position_id
      const { data, error } = await supabase
        .from('chord_captions')
        .select('*, chord_position:chord_positions!fk_chord_captions_chord_position_id (id, chord_position_full_name, aws_svg_url_dark, aws_svg_url_light)')
        .eq('favorite_id', favoriteData.id)
        .order('start_time', { ascending: true })
      
      if (error) throw error
      
      console.log('🎸 Chord captions loaded:', data?.length || 0, 'records')
      
      // Log each chord caption with chord name and fret position
      if (data && data.length > 0) {
        console.log('🎸 Chord Caption Records:')
        data.forEach((chord, index) => {
          console.log(`${index + 1}. Chord: ${chord.chord_name}, Fret Position: ${chord.fret_position || 'N/A'}, Start: ${chord.start_time}, End: ${chord.end_time}`)
        })
      } else {
        console.log('🎸 No chord captions found for this video')
      }
      
      setChordCaptions(data || [])
      
    } catch (err) {
      console.error('❌ Error loading chord captions:', err)
      setChordCaptionsError('Failed to load chord captions')
      setChordCaptions([])
    } finally {
      setIsLoadingChordCaptions(false)
    }
  }

  // Load static song content from HTML files
  const loadStaticSongContent = async () => {
    // For now, we'll use the example song content
    // In a real implementation, this would select based on the current video
    const response = await fetch('/song_data/song_clean_output_1647373.html')
    
    if (!response.ok) {
      throw new Error(`Static file not found: ${response.status}`)
    }
    
    const htmlContent = await response.text()
    
    // Extract the song content from the HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const preElement = doc.querySelector('pre')
    
    if (preElement) {
      // Get the inner HTML and add proper styling for chords
      let content = preElement.innerHTML
      
      // Add CSS styling for proper chord display
      const styledContent = `
        <style>
          .chord { 
            color: #00ff00; 
            font-weight: bold; 
            font-size: 0.9em;
          }
          .gtab { 
            margin: 2px 0; 
            line-height: 1.4; 
            font-family: monospace; 
            white-space: pre;
            color: white;
          }
          pre { 
            white-space: pre-wrap; 
            font-family: monospace; 
            font-size: 14px;
            line-height: 1.4;
            color: white;
            background: black;
          }
          body {
            background: black;
            color: white;
          }
          * {
            color: white;
          }
          .chord {
            color: #00ff00 !important;
          }
        </style>
        ${content}
      `
      return styledContent
    } else {
      throw new Error('No song content found in static file')
    }
  }
  


    



  // Database operation states
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
  
  // Ticking state for current video time (drives chord SVG updates)
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0)

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

  // Tick current video time for chord grid updates
  useEffect(() => {
    if (!playerRef.current || !isPlayerReadyFromUtils(playerRef.current)) return
    const intervalId = setInterval(() => {
      try {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const t = playerRef.current.getCurrentTime()
          setCurrentTimeSeconds(typeof t === 'number' ? t : 0)
        }
      } catch (e) {
        // ignore
      }
    }, 500)
    return () => clearInterval(intervalId)
  }, [playerRef.current])

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
          
          // Load chord captions for this video
          loadChordCaptions()
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
          loadChordCaptions()
        }
      }
    }
  }, [mounted, videoId])

  // Load chord captions when user changes
  useEffect(() => {
    if (user?.id && videoId) {
      loadChordCaptions()
    }
  }, [user?.id, videoId])

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
    
    setShowControlStrips(newState)
    
    // Load song content when showing control strips for the first time
    if (newState && !songContent) {
      loadSongContent()
    }
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





  // Load song content when control strips are shown
  useEffect(() => {
    if (showControlStrips && !songContent) {
      loadSongContent()
    }
  }, [showControlStrips, songContent])

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
          backgroundImage: `url('/images/gt_splashBG_1200_dark1.png')`,
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
        height: showControlStrips ? 'calc(100vh - 400px)' : 'calc(100vh - 155px)',
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
          {/* Control Strips Container - Single empty row */}
          <div className="h-full relative">
            
            {/* Split Row - Two equal columns */}
            <div className="absolute bottom-0 left-0 right-0 flex border-2 border-white rounded-lg overflow-hidden h-full transition-all duration-300">
              {/* Left Column - Song Content */}
              <div className="w-1/2 h-full border-r border-white/20">
                {isLoadingSongContent ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                      <div className="text-white text-sm font-medium">Loading song content...</div>
                      <div className="text-gray-400 text-xs mt-1">Source: {lyricsSource === 'api' ? 'API' : 'Static Files'}</div>
                    </div>
                  </div>
                ) : songContent ? (
                  <div className="w-full h-full relative">
                    {/* Source Toggle Button */}
                    <div className="absolute top-2 right-2 z-20">
                      <button
                        onClick={() => {
                          setLyricsSource(lyricsSource === 'api' ? 'static' : 'api')
                          loadSongContent() // Reload with new source
                        }}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                        title={`Switch to ${lyricsSource === 'api' ? 'Static Files' : 'API'}`}
                      >
                        {lyricsSource === 'api' ? '📁 Static' : '🌐 API'}
                      </button>
                    </div>
                    
                    {/* Error Message */}
                    {lyricsError && (
                      <div className="absolute top-2 left-2 z-20">
                        <div className="px-2 py-1 text-xs bg-red-600 text-white rounded">
                          ⚠️ {lyricsError}
                        </div>
                      </div>
                    )}
                    
                    <SongContentScroller 
                      htmlContent={songContent}
                      height="h-full"
                      className="border-0 rounded-lg bg-black"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-white text-sm font-medium">No song content available</div>
                  </div>
                )}
              </div>
              
              {/* Right Column - SVG Grid */}
              <div className="w-1/2 h-full bg-black relative">
                {/* Upper Right Corner - Something (incomplete from your message) */}
                <div className="absolute top-2 right-2 z-20">
                  <div className="px-2 py-1 text-xs bg-gray-700 text-white rounded">
                    SVG Grid
                  </div>
                </div>
                
                {/* 3x2 Grid for SVG Images */}
                <div className="h-full p-2 grid grid-cols-3 grid-rows-2 gap-1">
                  {(() => {
                    try {
                      const nowSeconds = currentTimeSeconds || 0

                      const active = (chordCaptions || []).filter((chord) => {
                        if (!chord || !chord.start_time || !chord.end_time) return false
                        const start = timeToSeconds(chord.start_time)
                        const end = timeToSeconds(chord.end_time)
                        return nowSeconds >= start && nowSeconds <= end
                      })
                      // Map to entries with URLs
                      const svgEntries = active
                        .map((c) => {
                          const pos = c.chord_position
                          const url = pos?.aws_svg_url_dark || null
                          if (!c.chord_position_id || !pos || !url) {
                            if (!pos || !url) {
                              console.warn(`⚠️ Missing chord position URL for chord ${c.id} (${c.chord_name} ${c.fret_position || ''})`)
                            }
                            return null
                          }
                          return { id: c.id, name: c.chord_name, url }
                        })
                        .filter(Boolean)

                      if (svgEntries.length > 6) {
                        console.error(`⚠️ More than 6 active chord diagrams (${svgEntries.length}). Showing first 6.`)
                      }

                      const toRender = svgEntries.slice(0, 6)

                      return toRender.map((entry) => (
                        <div key={entry.id} className="bg-gray-900 border border-gray-700 rounded flex items-center justify-center p-1">
                          <img src={entry.url} alt={entry.name || 'Chord'} className="w-full h-full object-contain" />
                        </div>
                      ))
                    } catch (err) {
                      console.error('Error rendering chord SVG grid:', err)
                      return null
                    }
                  })()}
                </div>
              </div>
            </div>

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

            {/* Loop Segment Button */}
            <button
              onClick={handleLoopClick}
              className={`p-2 rounded-lg transition-colors duration-300 ${
                isLoopActive 
                  ? 'text-blue-400 hover:bg-white/10' 
                  : 'text-white hover:bg-white/10'
              }`}
              title={isLoopActive ? "Stop loop" : "Configure loop segment"}
            >
                <ImLoop className="w-5 h-5" />
            </button>







            {/* Loop Time Display */}
            <div className="flex flex-col items-start space-y-1">
                <button
                  onClick={handleLoopTimesClick}
                  className={`text-sm font-mono transition-colors cursor-pointer hover:opacity-80 ${
                    isLoopActive ? 'text-blue-400' : 'text-gray-300'
                  }`}
                  title="Click to edit loop times"
                >
                  {loopStartTime} - {loopEndTime}
                </button>
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