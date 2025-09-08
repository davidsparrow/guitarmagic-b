// pages/search.js - Search Page with YouTube API Integration
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import AuthModal from '../components/AuthModal'
import SupportModal from '../components/SupportModal'
import MenuModal from '../components/MenuModal'
import Header from '../components/Header'
import { useRouter } from 'next/router'
import { searchVideos, formatDuration, formatViewCount, formatPublishDate, getBestThumbnail } from '../lib/youtube'
import { FaEllipsisV, FaCheck } from 'react-icons/fa'
import { TbGuitarPick, TbGuitarPickFilled } from 'react-icons/tb'
import PlanSelectionAlert from '../components/PlanSelectionAlert'

// Helper function to parse YouTube duration format (PT1M30S) to seconds
const parseDuration = (duration) => {
  if (!duration) return null
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return null
  const hours = parseInt(match[1] || 0)
  const minutes = parseInt(match[2] || 0) 
  const seconds = parseInt(match[3] || 0)
  return hours * 3600 + minutes * 60 + seconds
}
import TopBanner from '../components/TopBanner'
import { supabase } from '../lib/supabase'

export default function Search() {
  const { isAuthenticated, user, loading, signOut } = useAuth()
  const { profile, canSearch, checkDailySearchLimit, incrementDailySearchCount, getDailySearchLimit, dailySearchesUsed } = useUser()
  
  // Toggle mock search results via env flag
  const useMockSearch = process.env.NEXT_PUBLIC_USE_MOCK_SEARCH === 'true'

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [sortOrder, setSortOrder] = useState('relevance')
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [userFavorites, setUserFavorites] = useState([]) // This would be populated from your backend
  const [pendingVideo, setPendingVideo] = useState(null) // Store video for post-login navigation
  const [savedSession, setSavedSession] = useState(null) // Store saved video session data

  // Standard Alert System State
  const [showCustomAlert, setShowCustomAlert] = useState(false)
  const [customAlertMessage, setCustomAlertMessage] = useState('')
  const [customAlertButtons, setCustomAlertButtons] = useState([])
  
  // Plan Selection Alert State
  const [showPlanSelectionAlert, setShowPlanSelectionAlert] = useState(false)

  // Search Cache Management Functions
  const getSearchCacheKey = (query) => {
    return user?.id ? `search_cache_${user.id}_${encodeURIComponent(query)}` : null
  }

  const saveSearchToCache = (query, results, nextPageToken) => {
    if (!user?.id) return
    
    const cacheKey = getSearchCacheKey(query)
    if (!cacheKey) return
    
    const cacheData = {
      query,
      results,
      nextPageToken,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours TTL
    }
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.error('❌ Failed to cache search results:', error)
    }
  }

  const getSearchFromCache = (query) => {
    if (!user?.id) return null
    
    const cacheKey = getSearchCacheKey(query)
    if (!cacheKey) return null
    
    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null
      
      const cacheData = JSON.parse(cached)
      
      // Check if cache is expired
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(cacheKey)
        return null
      }
      
      return cacheData
    } catch (error) {
      console.error('❌ Failed to read cache:', error)
      return null
    }
  }

  const clearExpiredCache = () => {
    if (!user?.id) return
    
    try {
      const keys = Object.keys(localStorage)
      const now = Date.now()
      
      keys.forEach(key => {
        if (key.startsWith(`search_cache_${user.id}_`)) {
          try {
            const cached = JSON.parse(localStorage.getItem(key))
            if (cached && now > cached.expiresAt) {
              localStorage.removeItem(key)
            }
          } catch (e) {
            // Remove corrupted cache entries
            localStorage.removeItem(key)
          }
        }
      })
    } catch (error) {
      console.error('❌ Failed to clean cache:', error)
    }
  }

  // Find and restore the most recent cached search
  const restoreMostRecentCachedSearch = () => {
    if (!user?.id) return null
    
    try {
      const keys = Object.keys(localStorage)
      let mostRecentCache = null
      let mostRecentTime = 0
      
      keys.forEach(key => {
        if (key.startsWith(`search_cache_${user.id}_`)) {
          try {
            const cached = JSON.parse(localStorage.getItem(key))
            if (cached && Date.now() <= cached.expiresAt && cached.timestamp > mostRecentTime) {
              mostRecentCache = cached
              mostRecentTime = cached.timestamp
            }
          } catch (e) {
            // Skip corrupted cache entries
          }
        }
      })
      
      return mostRecentCache
    } catch (error) {
      console.error('❌ Failed to find recent cache:', error)
      return null
    }
  }

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Clean up expired cache on mount
  useEffect(() => {
    if (mounted && user?.id) {
      clearExpiredCache()
    }
  }, [mounted, user?.id])

  // Restore cached search results after user authentication is complete
  useEffect(() => {
    if (mounted && user?.id && !loading && !hasSearched && searchResults.length === 0) {
      // Try to restore most recent cached search
      const mostRecentCache = restoreMostRecentCachedSearch()
      if (mostRecentCache) {
        setSearchResults(mostRecentCache.results)
        setHasSearched(true)
        setNextPageToken(mostRecentCache.nextPageToken)
        setSearchQuery(mostRecentCache.query)
      }
    }
  }, [mounted, user?.id, loading, hasSearched, searchResults.length])

  // Handle page visibility changes (browser back button, tab switching, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mounted && user?.id) {
        // If we have a search query but no results, try to restore from cache
        if (searchQuery && !hasSearched && searchResults.length === 0) {
          const cachedResults = getSearchFromCache(searchQuery)
          if (cachedResults) {
            setSearchResults(cachedResults.results)
            setHasSearched(true)
            setNextPageToken(cachedResults.nextPageToken)
          }
        }
      }
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also check when the page becomes visible (browser back button)
    const handlePageShow = () => {
      if (mounted && user?.id) {
        // First try to restore from current search query if it exists
        if (searchQuery && !hasSearched && searchResults.length === 0) {
          const cachedResults = getSearchFromCache(searchQuery)
          if (cachedResults) {
            setSearchResults(cachedResults.results)
            setHasSearched(true)
            setNextPageToken(cachedResults.nextPageToken)
            return
          }
        }
        
        // If no current query or no results, try to restore most recent cached search
        if (!hasSearched && searchResults.length === 0) {
          const mostRecentCache = restoreMostRecentCachedSearch()
          if (mostRecentCache) {
            setSearchResults(mostRecentCache.results)
            setHasSearched(true)
            setNextPageToken(mostRecentCache.nextPageToken)
            setSearchQuery(mostRecentCache.query)
          }
        }
      }
    }

    // Listen for page show events (browser back button)
    window.addEventListener('pageshow', handlePageShow)
    
    // Listen for browser back/forward button navigation
    const handlePopState = () => {
      if (mounted && router.isReady) {
        // Small delay to ensure router.query is updated
        setTimeout(() => {
          const { q, view, show_favorites } = router.query
          
          // Restore favorites mode if URL contains show_favorites
          if (show_favorites === 'true') {
            setShowFavoritesOnly(true)
            setHasSearched(true)
            return
          }
          
          // Restore search results if URL contains query
          if (q && typeof q === 'string') {
            setSearchQuery(q)
            setHasSearched(true)
            const cachedResults = getSearchFromCache(q)
            if (cachedResults) {
              setSearchResults(cachedResults.results)
              setNextPageToken(cachedResults.nextPageToken)
            } else {
              performSearchWithQuery(q)
            }
          }
        }, 100)
      }
    }
    
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [mounted, user?.id, searchQuery, hasSearched, searchResults.length])

  // Auto-search when page loads with query parameter and restore state from browser navigation
  useEffect(() => {
    if (mounted && router.isReady) {
      const { q, view, show_favorites } = router.query
      
      // Check for show_favorites parameter (from watch.js navigation or browser back button)
      if (show_favorites === 'true') {
        setShowFavoritesOnly(true)
        setHasSearched(true)
        // Favorites will be loaded by the existing useEffect that calls loadUserFavorites
        return
      }
      
      // Check for favorites view parameter
      if (view === 'favorites') {
        setShowFavoritesOnly(true)
        setHasSearched(true)
        return
      }
      
      // Perform search if query parameter exists (restore search results from browser back button)
      if (q && typeof q === 'string') {
        setSearchQuery(q)
        setHasSearched(true)
        // Try to restore from cache first, then perform new search if needed
        const cachedResults = getSearchFromCache(q)
        if (cachedResults) {
          setSearchResults(cachedResults.results)
          setNextPageToken(cachedResults.nextPageToken)
        } else {
          // Perform search directly with the URL query
          performSearchWithQuery(q)
        }
      }
    }
  }, [mounted, router.isReady, router.query])

  // Handle post-login navigation to pending video
  useEffect(() => {
    if (isAuthenticated && pendingVideo && !loading) {
      // User just logged in and has a pending video
      const video = pendingVideo
      const videoId = video.id?.videoId || video.video_id
      const title = video.snippet?.title || video.video_title
      const channelTitle = video.snippet?.channelTitle || video.video_channel
      const description = video.snippet?.description || ''
      const thumbnails = video.snippet?.thumbnails || {}
      const publishedAt = video.snippet?.publishedAt || new Date().toISOString()
      const statistics = video.statistics || {}
      const contentDetails = video.contentDetails || {}
      
      // Store video info for the player page
      localStorage.setItem('currentVideo', JSON.stringify({
        id: videoId,
        title: title,
        channelTitle: channelTitle,
        description: description,
        thumbnails: thumbnails,
        publishedAt: publishedAt,
        statistics: statistics,
        contentDetails: contentDetails
      }))
      
      // Navigate to video player
      router.push(`/watch?v=${videoId}&title=${encodeURIComponent(title)}&channel=${encodeURIComponent(channelTitle)}`)
      
      // Clear pending video
      setPendingVideo(null)
    }
  }, [isAuthenticated, pendingVideo, loading, router])

  // Check for saved session when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id && !loading) {

      checkForSavedSession().then(sessionData => {
        setSavedSession(sessionData)

      })
      
      // Load user favorites from database
      loadUserFavorites()
    } else {
      // Clear saved session and favorites when user logs out
      setSavedSession(null)
      setUserFavorites([])
      
      // Clear user's search cache when they log out
      if (user?.id) {
        try {
          const keys = Object.keys(localStorage)
          keys.forEach(key => {
            if (key.startsWith(`search_cache_${user.id}_`)) {
              localStorage.removeItem(key)
  
            }
          })
        } catch (error) {
          console.error('❌ Failed to clear search cache:', error)
        }
      }
    }
  }, [isAuthenticated, user?.id, loading])

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

  // Handle search
  const handleSearch = async (pageToken = null) => {
    if (!searchQuery.trim()) return
    

    
    // Check if user can search
    if (!pageToken && !canSearch) {
      setShowPlanSelectionAlert(true)
      return
    }

    // Check daily search limit for new searches (not load more)
    if (!pageToken && !checkDailySearchLimit()) {
      const limit = getDailySearchLimit();
      const used = dailySearchesUsed;
      
      console.log('🚫 DAILY LIMIT REACHED in handleSearch:', {
        userTier: profile?.subscription_tier,
        dailyLimit: limit,
        dailyUsed: used,
        remaining: Math.max(0, limit - used)
      });
      
      if (limit === 0) {
        setCustomAlertMessage('Free users cannot search. Please upgrade to search for guitar videos.');
      } else {
        setCustomAlertMessage(`Daily search limit reached (${used}/${limit}). Upgrade to Hero for unlimited searches!`);
        setCustomAlertButtons([
          { text: 'Upgrade Now', action: () => router.push('/pricing') },
          { text: 'Close', action: () => setShowCustomAlert(false) }
        ]);
      }
      setShowCustomAlert(true);
      return;
    }

    // For new searches (not load more), check cache first
    if (!pageToken) {
      const cachedResults = getSearchFromCache(searchQuery.trim())
      if (cachedResults) {
        setSearchResults(cachedResults.results)
        setHasSearched(true)
        setNextPageToken(cachedResults.nextPageToken)

        return
      }
    }

    if (pageToken) {
      setIsLoadingMore(true)
    } else {
      setIsSearching(true)
      setSearchError('')
    }

    try {
      // Mock payload for testing daily search limits
      const mockResults = {
        videos: [
          {
            id: { videoId: 'mock1' },
            snippet: {
              title: `[MOCK] ${searchQuery.trim()} - Guitar Lesson 1`,
              description: 'Mock video for testing daily search limits',
              thumbnails: { default: { url: 'https://via.placeholder.com/120x90?text=Mock+Video' } },
              channelTitle: 'Mock Guitar Channel',
              publishedAt: new Date().toISOString()
            }
          },
          {
            id: { videoId: 'mock2' },
            snippet: {
              title: `[MOCK] ${searchQuery.trim()} - Guitar Lesson 2`,
              description: 'Mock video for testing daily search limits',
              thumbnails: { default: { url: 'https://via.placeholder.com/120x90?text=Mock+Video' } },
              channelTitle: 'Mock Guitar Channel',
              publishedAt: new Date().toISOString()
            }
          }
        ],
        nextPageToken: null
      };

      const results = useMockSearch
        ? mockResults
        : await searchVideos(searchQuery.trim(), {
            maxResults: 12, // Limit results per search
            pageToken: pageToken,
            order: sortOrder
          })

      if (pageToken) {
        // Append to existing results for load more
        setSearchResults(prev => [...prev, ...results.videos])
      } else {
        // Replace results for new search
        setSearchResults(results.videos)
        setHasSearched(true)
        
        // Update URL to maintain state for browser navigation
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`, undefined, { shallow: true })
        
        // Save to cache for future use
        saveSearchToCache(searchQuery.trim(), results.videos, results.nextPageToken)
        
        // Increment daily search count after successful search
        console.log('✅ SEARCH SUCCESSFUL - Incrementing daily count:', {
          userTier: profile?.subscription_tier,
          dailyLimit: getDailySearchLimit(),
          dailyUsed: dailySearchesUsed,
          remaining: Math.max(0, getDailySearchLimit() - dailySearchesUsed)
        });
        await incrementDailySearchCount()
      }

      setNextPageToken(results.nextPageToken)

    } catch (error) {
      console.error('Search error:', error)
      setSearchError(error.message || 'Search failed. Please try again.')
    } finally {
      setIsSearching(false)
      setIsLoadingMore(false)
    }
  }

  // Perform search with direct query string (for auto-search from URL)
  const performSearchWithQuery = async (query) => {
    if (!query.trim()) return
    

    
    // Check if user can search
    if (!canSearch) {
      setShowPlanSelectionAlert(true)
      return
    }

    // Check daily search limit
    if (!checkDailySearchLimit()) {
      const limit = getDailySearchLimit();
      const used = dailySearchesUsed;
      
      console.log('🚫 DAILY LIMIT REACHED in performSearchWithQuery:', {
        userTier: profile?.subscription_tier,
        dailyLimit: limit,
        dailyUsed: used,
        remaining: Math.max(0, limit - used)
      });
      
      if (limit === 0) {
        setCustomAlertMessage('Free users cannot search. Please upgrade to search for guitar videos.');
      } else {
        setCustomAlertMessage(`Daily search limit reached (${used}/${limit}). Upgrade to Hero for unlimited searches!`);
        setCustomAlertButtons([
          { text: 'Upgrade Now', action: () => router.push('/pricing') },
          { text: 'Close', action: () => setShowCustomAlert(false) }
        ]);
      }
      setShowCustomAlert(true);
      return;
    }

    // Check cache first
    const cachedResults = getSearchFromCache(query)
    if (cachedResults) {
      setSearchResults(cachedResults.results)
      setHasSearched(true)
      setNextPageToken(cachedResults.nextPageToken)
      setSearchQuery(query)
              return
    }

    setIsSearching(true)
    setSearchError('')

    try {
      // Mock payload for testing daily search limits
      const mockResults = {
        videos: [
          {
            id: { videoId: 'mock1' },
            snippet: {
              title: `[MOCK] ${query.trim()} - Guitar Lesson 1`,
              description: 'Mock video for testing daily search limits',
              thumbnails: { default: { url: 'https://via.placeholder.com/120x90?text=Mock+Video' } },
              channelTitle: 'Mock Guitar Channel',
              publishedAt: new Date().toISOString()
            }
          },
          {
            id: { videoId: 'mock2' },
            snippet: {
              title: `[MOCK] ${query.trim()} - Guitar Lesson 2`,
              description: 'Mock video for testing daily search limits',
              thumbnails: { default: { url: 'https://via.placeholder.com/120px?text=Mock+Video' } },
              channelTitle: 'Mock Guitar Channel',
              publishedAt: new Date().toISOString()
            }
          }
        ],
        nextPageToken: null
      };

      const results = useMockSearch
        ? mockResults
        : await searchVideos(query.trim(), {
            maxResults: 12,
            pageToken: null,
            order: sortOrder
          })

      setSearchResults(results.videos)
      setHasSearched(true)
      setNextPageToken(results.nextPageToken)
      setSearchQuery(query)

      // Update URL to maintain state for browser navigation
      router.push(`/search?q=${encodeURIComponent(query.trim())}`, undefined, { shallow: true })

      // Save to cache for future use
      saveSearchToCache(query, results.videos, results.nextPageToken)
      
      // Increment daily search count after successful search
      console.log('✅ SEARCH SUCCESSFUL (URL) - Incrementing daily count:', {
        userTier: profile?.subscription_tier,
        dailyLimit: getDailySearchLimit(),
        dailyUsed: dailySearchesUsed,
        remaining: Math.max(0, getDailySearchLimit() - dailySearchesUsed)
      });
      await incrementDailySearchCount()

    } catch (error) {
      console.error('Search error:', error)
      setSearchError(error.message || 'Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }



  // Load user favorites from database
  const loadUserFavorites = async () => {
    if (!user?.id) {

      return
    }

    try {

      
      const { data: favorites, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error loading favorites:', error)
        return
      }
      
      
      setUserFavorites(favorites || [])
      
    } catch (error) {
      console.error('❌ Error loading favorites:', error)
    }
  }

  // Check for saved video session data
  const checkForSavedSession = async () => {
    if (!user?.id) {

      return null
    }

    try {

      
      // Query the database for saved session data
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('last_video_id, last_video_timestamp, last_video_title, last_video_channel_name, last_session_date')
        .eq('id', user.id)
        .single()
      
      if (error) {

        return null
      }
      
      if (profile?.last_video_id && profile?.last_video_timestamp) {

        return profile
      } else {

        return null
      }
    } catch (error) {
      console.error('❌ Error checking saved session:', error)
      return null
    }
  }

  // Handle load more
  const handleLoadMore = () => {
    if (nextPageToken && !isLoadingMore) {
      handleSearch(nextPageToken)
    }
  }

  // Handle video click
  const handleVideoClick = (video) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Show login modal for unauthenticated users
      setShowAuthModal(true)
      setPendingVideo(video) // Store the video for post-login navigation
      return
    }

    // Handle both search results and favorites data structures
    const videoId = video.id?.videoId || video.video_id
    const title = video.snippet?.title || video.video_title
    const channelTitle = video.snippet?.channelTitle || video.video_channel
    const description = video.snippet?.description || ''
    const thumbnails = video.snippet?.thumbnails || {}
    const publishedAt = video.snippet?.publishedAt || new Date().toISOString()
    const statistics = video.statistics || {}
    const contentDetails = video.contentDetails || {}
    
    // Store video info for the player page
    localStorage.setItem('currentVideo', JSON.stringify({
      id: videoId,
      title: title,
      channelTitle: channelTitle,
      description: description,
      thumbnails: thumbnails,
      publishedAt: publishedAt,
      statistics: statistics,
      contentDetails: contentDetails
    }))
    
    // Navigate to video player
    router.push(`/watch?v=${videoId}&title=${encodeURIComponent(title)}&channel=${encodeURIComponent(channelTitle)}`)
  }

  // Handle sort order change
  const handleSortChange = (newOrder) => {
    setSortOrder(newOrder)
    // Note: Sort only affects new searches, not existing results
  }

  // Handle favorites toggle
  const handleFavoritesToggle = () => {
    // Only allow toggle if user is authenticated and has favorites
    if (!isAuthenticated) {
      showCustomAlertModal('Please log in to view your saved favorites.', [
        { text: 'Log In', action: () => {
          closeCustomAlertModal() // Close alert first
          setShowAuthModal(true)  // Then open auth modal
        }},
        { text: 'Cancel', action: closeCustomAlertModal }
      ])
      return
    }
    
    if (userFavorites.length === 0) {
      showCustomAlertModal('No Saved Faves found.', [
        { text: 'OK', action: closeCustomAlertModal }
      ])
      return
    }
    
    // User is authenticated and has favorites - allow toggle
    const newState = !showFavoritesOnly
    setShowFavoritesOnly(newState)
    
    // Update URL to maintain state for browser navigation
    if (newState) {
      // Switching to favorites mode
      router.push('/search?show_favorites=true', undefined, { shallow: true })
    } else {
      // Switching back to search mode - preserve search query if exists
      if (searchQuery) {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`, undefined, { shallow: true })
      } else {
        router.push('/search', undefined, { shallow: true })
      }
    }
  }

  // Handle video favorite toggle
  const handleVideoFavoriteToggle = async (video, isFavorited) => {
    if (!isAuthenticated || !user?.id) {
      
      return
    }

    const videoId = video.id?.videoId || video.video_id

    try {
      if (isFavorited) {
        // Remove from favorites

        
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', videoId)
        
        if (error) {
          console.error('❌ Error removing favorite:', error)
          return
        }
        
        // Update local state
        setUserFavorites(prev => prev.filter(fav => fav.video_id !== videoId))

        
      } else {
        // Add to favorites

        
        const favoriteData = {
          user_id: user.id,
          video_id: videoId,
          video_title: video.snippet?.title || video.video_title,
          video_channel: video.snippet?.channelTitle || video.video_channel,
          video_duration_seconds: video.contentDetails?.duration ? parseDuration(video.contentDetails.duration) : null,
          video_channel_id: video.snippet?.channelId || video.video_channel_id,
          is_public: false
        }
        
        const { data, error } = await supabase
          .from('favorites')
          .insert([favoriteData])
          .select()
        
        if (error) {
          console.error('❌ Error adding favorite:', error)
          return
        }
        
        // Update local state
        setUserFavorites(prev => [...prev, data[0]])

      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error)
    }
  }

  // Check if video is favorited
  const isVideoFavorited = (video) => {
    const videoId = video.id?.videoId || video.video_id
    return userFavorites.some(fav => fav.video_id === videoId)
  }

  // Standard Alert System Helper Function
  const showCustomAlertModal = (message, buttons = []) => {
    setCustomAlertMessage(message)
    setCustomAlertButtons(buttons)
    setShowCustomAlert(true)
  }

  const closeCustomAlertModal = () => {
    setShowCustomAlert(false)
    setCustomAlertMessage('')
    setCustomAlertButtons([])
  }

  // Favorites Confirmation Alert Helper Function
  const showFavoritesConfirmationAlert = (video, isFavorited) => {
    // Get plan info
    const planType = profile?.subscription_tier || 'freebird'
    const currentCount = userFavorites.length
    
    // Map plan types to display names and limits
    const planInfo = {
      'freebird': { name: 'Freebird', max: 0 },
      'roadie': { name: 'Roadie', max: 12 },
      'hero': { name: 'Hero', max: 'UNLIMITED' }
    }
    
    const plan = planInfo[planType] || planInfo['freebird']
    const maxDisplay = plan.max === 'UNLIMITED' ? 'UNLIMITED' : plan.max
    
    // Create message
    const message = `You have ${currentCount} of ${maxDisplay} max faves in ${plan.name} Plan.`
    
    // Create buttons
    const buttons = [
      {
        text: isFavorited ? 'REMOVE' : 'ADD',
        action: () => {
          closeCustomAlertModal()
          handleVideoFavoriteToggle(video, isFavorited)
        }
      },
      {
        text: 'CANCEL',
        action: closeCustomAlertModal
      }
    ]
    
    showCustomAlertModal(message, buttons)
  }

  if (!mounted || (loading && !router.isReady)) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden bg-black" style={{ 
      backgroundColor: '#000000',
      minHeight: '100vh',
      minHeight: '100dvh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      {/* Full-Screen Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/gt_splashBG_dark.png')`,
          width: '100%',
          height: '100%',
          minWidth: '100vw',
          minHeight: '100vh',
          minHeight: '100dvh'
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
        showFavoritesToggle={true}
        showResumeButton={true}
        showSortDropdown={true}
        // Search state
        searchQuery={searchQuery}
        sortOrder={sortOrder}
        showFavoritesOnly={showFavoritesOnly}
        savedSession={savedSession}
        // Event handlers
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        onFavoritesToggle={handleFavoritesToggle}
        onResumeClick={() => {
  
          
          
          // Navigate to video page with resume parameters
          router.push(`/watch?v=${savedSession.last_video_id}&title=${encodeURIComponent(savedSession.last_video_title || '')}&channel=${encodeURIComponent(savedSession.last_video_channel_name || '')}`)
        }}
        onSortChange={handleSortChange}
        // Standard props
        onAuthClick={handleAuthClick}
        onMenuClick={() => setShowMenuModal(true)}
        isAuthenticated={isAuthenticated}
      />
      
      {/* Main Content Area - Video Grid */}
      <div 
        className="relative z-10 flex-1 overflow-y-auto px-6 pb-6 hide-scrollbar mt-16 md:mt-20 bg-black/75" 
        style={{ 
          height: 'calc(100vh - 140px)'
        }}
      >
        {/* Search Error */}
        {searchError && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-center">
            {searchError}
          </div>
        )}

        {/* Video Grid */}
        {(hasSearched || showFavoritesOnly) && (
          <div>
    

            
            {(() => {
              // Define displayResults based on toggle state
              const displayResults = showFavoritesOnly 
                ? userFavorites  // Show favorites from database
                : searchResults  // Show search results from YouTube API
              

              
              return (
                <div className="mt-6">
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {showFavoritesOnly ? 'Favorites' : 'Search Results'}
                      {displayResults.length > 0 && (
                        <span className="text-lg font-normal text-white/60 ml-2">
                          ({displayResults.length} videos)
                        </span>
                      )}
                    </h2>
                  </div>

                  {/* Video Cards Grid */}
                  {displayResults.length === 0 && !isSearching ? (
                    // Show different messages based on whether we're in favorites mode or regular search
                    showFavoritesOnly ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎸</div>
                        <h4 className="text-lg font-medium text-white mb-2">No need to panic. yet..</h4>
                        <p className="text-white/60">No Saved Faves found.</p>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h4 className="text-lg font-medium text-white mb-2">No videos found</h4>
                        <p className="text-white/60">Try different keywords or check your search terms.</p>
                      </div>
                    )
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayResults.map((video, index) => (
                          <div
                            key={`${video.id?.videoId || video.video_id}-${index}`}
                            className="group cursor-pointer bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-yellow-400/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-yellow-400/20 relative"
                          >
                            {/* Thumbnail */}
                            <div 
                              className="relative aspect-video bg-gray-800 cursor-pointer"
                              onClick={() => handleVideoClick(video)}
                            >
                              <img
                                src={video.snippet?.thumbnails 
                                  ? getBestThumbnail(video.snippet.thumbnails) 
                                  : `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`
                                }
                                alt={video.snippet?.title || video.video_title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  // Fallback to a different thumbnail size if the first one fails
                                  if (e.target.src.includes('hqdefault.jpg')) {
                                    e.target.src = `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`
                                  } else if (e.target.src.includes('mqdefault.jpg')) {
                                    e.target.src = `https://img.youtube.com/vi/${video.video_id}/default.jpg`
                                  }
                                }}
                              />
                              
                              {/* Duration overlay */}
                              {video.contentDetails?.duration && (
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                  {formatDuration(video.contentDetails.duration)}
                                </div>
                              )}
                              
                              {/* Play button overlay */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-yellow-400 text-black rounded-full p-3">
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Video Info */}
                            <div className="p-4">
                              {/* Channel Avatar and Title Row */}
                              <div className="flex items-start space-x-3 mb-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">
                                    {(video.snippet?.channelTitle || video.video_channel).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 
                                    className="font-medium text-white line-clamp-2 group-hover:text-yellow-400 transition-colors cursor-pointer"
                                    onClick={() => handleVideoClick(video)}
                                  >
                                    {video.snippet?.title || video.video_title}
                                  </h4>
                                </div>
                                
                                {/* More options icon */}
                                <button className="text-white/60 hover:text-white transition-colors p-1">
                                  <FaEllipsisV className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {/* Channel Name */}
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm text-white/80">
                                  {video.snippet?.channelTitle || video.video_channel}
                                </p>
                                <FaCheck className="w-3 h-3 text-blue-400" />
                              </div>
                              
                              {/* Views and Date - Left Side */}
                              <div className="flex items-center text-xs text-white/60 mb-3">
                                <span>
                                  {video.statistics?.viewCount && formatViewCount(video.statistics.viewCount)}
                                </span>
                                <span className="mx-2">•</span>
                                <span>
                                  {formatPublishDate(video.snippet?.publishedAt || new Date().toISOString())}
                                </span>
                              </div>
                              
                              {/* Guitar Pick Icon - Bottom Right */}
                              <div className="absolute bottom-2 right-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    
                                    // Check if user can manage favorites (same logic as search gating)
                                    if (!canSearch) {
                                      // Show plan selection alert for unauthenticated or no-plan users
                                      setShowPlanSelectionAlert(true)
                                      return
                                    }
                                    
                                    // User has plan access - show favorites confirmation
                                    const isFavorited = isVideoFavorited(video)
                                    showFavoritesConfirmationAlert(video, isFavorited)
                                  }}
                                  className="p-1 hover:scale-110 transition-transform"
                                >
                                  {isVideoFavorited(video) ? (
                                    <TbGuitarPickFilled className="w-8 h-8 text-[#8dc641]" />
                                  ) : (
                                    <TbGuitarPick className="w-8 h-8 text-[#8dc641]" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Initial State - Before Search */}
        {!hasSearched && !showFavoritesOnly && (
          <div className="flex flex-col items-center justify-center h-full text-center text-white">
            <div className="text-6xl mb-6">🎸</div>
            <h1 className="text-4xl font-bold mb-4">Search for Videos</h1>
            <p className="text-xl text-white/60 mb-8">Find the perfect content to learn from</p>
            <div className="text-lg text-white/40">
              Type your search above and press Enter or click the search button
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
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

      {/* Standard Alert Modal */}
      {showCustomAlert && (
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
      )}
      
      {/* Plan Selection Alert */}
      <PlanSelectionAlert
        isOpen={showPlanSelectionAlert}
        onClose={() => setShowPlanSelectionAlert(false)}
      />
    </div>
  )
}