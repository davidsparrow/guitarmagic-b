const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

if (!YOUTUBE_API_KEY) {
  console.error('YouTube API key is missing! Add NEXT_PUBLIC_YOUTUBE_API_KEY to your .env.local file')
}

// =============================================================
// CORE API FUNCTIONS
// =============================================================

/**
 * Generic YouTube API request handler
 */
const youtubeRequest = async (endpoint, params = {}) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured')
  }

  const searchParams = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    ...params
  })

  const url = `${YOUTUBE_API_BASE_URL}${endpoint}?${searchParams}`

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`YouTube API Error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('YouTube API request failed:', error)
    throw error
  }
}

// =============================================================
// SEARCH FUNCTIONS
// =============================================================

/**
 * Search for videos on YouTube
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<object>} Search results
 */
export const searchVideos = async (query, options = {}) => {
  const {
    maxResults = 20,
    order = 'relevance', // relevance, date, rating, viewCount, title
    duration = 'any', // any, short, medium, long
    publishedAfter = null,
    publishedBefore = null,
    channelId = null,
    pageToken = null
  } = options

  const params = {
    part: 'snippet',
    type: 'video',
    q: query,
    maxResults: Math.min(maxResults, 50), // YouTube API limit
    order,
    videoEmbeddable: 'true', // Only embeddable videos
    fields: 'items(id,snippet(title,description,thumbnails,channelTitle,publishedAt)),nextPageToken,prevPageToken,pageInfo'
  }

  // Add optional filters
  if (duration !== 'any') {
    params.videoDuration = duration
  }
  if (publishedAfter) {
    params.publishedAfter = publishedAfter
  }
  if (publishedBefore) {
    params.publishedBefore = publishedBefore
  }
  if (channelId) {
    params.channelId = channelId
  }
  if (pageToken) {
    params.pageToken = pageToken
  }

  try {
    const data = await youtubeRequest('/search', params)
    
    // Get additional video details (duration, view count, etc.)
    if (data.items && data.items.length > 0) {
      const videoIds = data.items.map(item => item.id.videoId).join(',')
      const videoDetails = await getVideoDetails(videoIds)
      
      // Merge search results with video details
      data.items = data.items.map(item => {
        const details = videoDetails.find(detail => detail.id === item.id.videoId)
        return {
          ...item,
          statistics: details?.statistics,
          contentDetails: details?.contentDetails
        }
      })
    }

    return {
      videos: data.items || [],
      nextPageToken: data.nextPageToken,
      prevPageToken: data.prevPageToken,
      totalResults: data.pageInfo?.totalResults || 0,
      resultsPerPage: data.pageInfo?.resultsPerPage || 0
    }
  } catch (error) {
    console.error('Video search failed:', error)
    throw new Error(`Search failed: ${error.message}`)
  }
}

/**
 * Get detailed information about specific videos
 * @param {string} videoIds - Comma-separated video IDs
 * @returns {Promise<Array>} Video details
 */
export const getVideoDetails = async (videoIds) => {
  const params = {
    part: 'contentDetails,statistics,snippet',
    id: videoIds,
    fields: 'items(id,contentDetails(duration),statistics(viewCount,likeCount),snippet(categoryId))'
  }

  try {
    const data = await youtubeRequest('/videos', params)
    return data.items || []
  } catch (error) {
    console.error('Failed to get video details:', error)
    return []
  }
}

// =============================================================
// UTILITY FUNCTIONS
// =============================================================

/**
 * Convert YouTube duration format (PT4M13S) to seconds
 * @param {string} duration - YouTube duration string
 * @returns {number} Duration in seconds
 */
export const parseDuration = (duration) => {
  if (!duration) return 0
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || 0)
  const minutes = parseInt(match[2] || 0)
  const seconds = parseInt(match[3] || 0)
  
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Format duration in seconds to readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "4:13", "1:02:30")
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}

/**
 * Format view count to readable string
 * @param {string|number} viewCount - View count
 * @returns {string} Formatted view count (e.g., "1.2M", "834K")
 */
export const formatViewCount = (viewCount) => {
  if (!viewCount) return '0 views'
  
  const count = parseInt(viewCount)
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`
  } else {
    return `${count} views`
  }
}

/**
 * Format publish date to relative time
 * @param {string} publishedAt - ISO date string
 * @returns {string} Relative time (e.g., "2 days ago", "1 week ago")
 */
export const formatPublishDate = (publishedAt) => {
  if (!publishedAt) return ''
  
  const now = new Date()
  const published = new Date(publishedAt)
  const diffInSeconds = Math.floor((now - published) / 1000)
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
    }
  }
  
  return 'Just now'
}

/**
 * Get high quality thumbnail URL
 * @param {object} thumbnails - YouTube thumbnails object
 * @returns {string} Best available thumbnail URL
 */
export const getBestThumbnail = (thumbnails) => {
  if (!thumbnails) return ''
  
  // Priority: maxres > high > medium > default
  if (thumbnails.maxres) return thumbnails.maxres.url
  if (thumbnails.high) return thumbnails.high.url
  if (thumbnails.medium) return thumbnails.medium.url
  if (thumbnails.default) return thumbnails.default.url
  
  return ''
}

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
export const extractVideoId = (url) => {
  if (!url) return null
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

/**
 * Get YouTube video embed URL
 * @param {string} videoId - YouTube video ID
 * @param {object} options - Embed options
 * @returns {string} Embed URL
 */
export const getEmbedUrl = (videoId, options = {}) => {
  const {
    autoplay = 0,
    controls = 1,
    start = 0,
    end = null,
    loop = 0,
    mute = 0,
    rel = 0, // Hide related videos
    modestbranding = 1 // Minimal YouTube branding
  } = options
  
  const params = new URLSearchParams({
    autoplay,
    controls,
    rel,
    modestbranding
  })
  
  if (start > 0) params.append('start', start)
  if (end) params.append('end', end)
  if (loop) params.append('loop', loop)
  if (mute) params.append('mute', mute)
  
  return `https://www.youtube.com/embed/${videoId}?${params}`
}

// =============================================================
// SEARCH SUGGESTIONS & TRENDING
// =============================================================

/**
 * Get popular/trending videos
 * @param {object} options - Options
 * @returns {Promise<object>} Trending videos
 */
export const getTrendingVideos = async (options = {}) => {
  const {
    maxResults = 20,
    regionCode = 'US',
    categoryId = null
  } = options
  
  const params = {
    part: 'snippet,contentDetails,statistics',
    chart: 'mostPopular',
    maxResults: Math.min(maxResults, 50),
    regionCode,
    fields: 'items(id,snippet(title,description,thumbnails,channelTitle,publishedAt),contentDetails(duration),statistics(viewCount)),nextPageToken'
  }
  
  if (categoryId) {
    params.videoCategoryId = categoryId
  }
  
  try {
    const data = await youtubeRequest('/videos', params)
    
    return {
      videos: data.items || [],
      nextPageToken: data.nextPageToken
    }
  } catch (error) {
    console.error('Failed to get trending videos:', error)
    throw new Error(`Trending videos failed: ${error.message}`)
  }
}

// =============================================================
// ERROR HANDLING & VALIDATION
// =============================================================

/**
 * Validate search query
 * @param {string} query - Search query
 * @returns {object} Validation result
 */
export const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Search query is required' }
  }
  
  if (query.trim().length === 0) {
    return { valid: false, error: 'Search query cannot be empty' }
  }
  
  if (query.length > 500) {
    return { valid: false, error: 'Search query is too long (max 500 characters)' }
  }
  
  return { valid: true, error: null }
}

/**
 * Check if API key is configured
 * @returns {boolean} True if API key is available
 */
export const isApiConfigured = () => {
  return !!YOUTUBE_API_KEY
}

// Export default object for convenience
export default {
  searchVideos,
  getVideoDetails,
  getTrendingVideos,
  parseDuration,
  formatDuration,
  formatViewCount,
  formatPublishDate,
  getBestThumbnail,
  extractVideoId,
  getEmbedUrl,
  validateSearchQuery,
  isApiConfigured
}