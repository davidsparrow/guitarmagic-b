// utils/lyricsUtils.js - Lyrics processing utilities

/**
 * Fetch lyrics from our API endpoint
 * @param {string} title - Song title
 * @param {string} artist - Song artist
 * @param {string} duration - Song duration (optional)
 * @returns {Promise<Object>} Processed lyrics data
 */
export async function fetchLyrics(title, artist, duration = '') {
  try {
    const params = new URLSearchParams({
      title: title || '',
      artist: artist || '',
      duration: duration || ''
    });

    const response = await fetch(`/api/lyrics/get?${params}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch lyrics');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    throw error;
  }
}

/**
 * Extract song info from video title and channel
 * @param {string} videoTitle - YouTube video title
 * @param {string} videoChannel - YouTube channel name
 * @returns {Object} Extracted song info
 */
export function extractSongInfo(videoTitle, videoChannel) {
  // Common patterns for YouTube video titles
  const patterns = [
    // "Artist - Song Title"
    /^([^-]+)\s*-\s*(.+)$/,
    // "Song Title - Artist"
    /^(.+)\s*-\s*([^-]+)$/,
    // "Artist: Song Title"
    /^([^:]+):\s*(.+)$/,
    // "Song Title by Artist"
    /^(.+)\s+by\s+(.+)$/i,
    // "Artist | Song Title"
    /^([^|]+)\s*\|\s*(.+)$/,
  ];

  let title = videoTitle || '';
  let artist = videoChannel || '';

  // Try to extract from video title
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      const [, first, second] = match;
      // Determine which is likely the artist vs title
      if (first.length < second.length) {
        artist = first.trim();
        title = second.trim();
      } else {
        artist = second.trim();
        title = first.trim();
      }
      break;
    }
  }

  // Clean up common YouTube suffixes
  title = title
    .replace(/\s*\(Official Video\)/gi, '')
    .replace(/\s*\(Official Music Video\)/gi, '')
    .replace(/\s*\(Official\)/gi, '')
    .replace(/\s*\[Official Video\]/gi, '')
    .replace(/\s*\[Official Music Video\]/gi, '')
    .replace(/\s*\[Official\]/gi, '')
    .replace(/\s*\(Lyrics\)/gi, '')
    .replace(/\s*\[Lyrics\]/gi, '')
    .replace(/\s*\(Audio\)/gi, '')
    .replace(/\s*\[Audio\]/gi, '')
    .trim();

  return {
    title: title || 'Unknown Title',
    artist: artist || 'Unknown Artist'
  };
}

/**
 * Generate fallback lyrics HTML when API fails
 * @param {string} title - Song title
 * @param {string} artist - Song artist
 * @returns {string} Fallback HTML
 */
export function generateFallbackLyrics(title, artist) {
  return `
    <style>
      .fallback-container {
        padding: 20px;
        text-align: center;
        color: white;
        background: black;
        font-family: monospace;
      }
      .fallback-title {
        font-size: 18px;
        font-weight: bold;
        color: #00ff00;
        margin-bottom: 10px;
      }
      .fallback-artist {
        font-size: 14px;
        color: #ccc;
        margin-bottom: 20px;
      }
      .fallback-message {
        font-size: 14px;
        color: #888;
        margin-bottom: 15px;
      }
      .fallback-sample {
        font-size: 12px;
        color: #666;
        font-style: italic;
      }
    </style>
    <div class="fallback-container">
      <div class="fallback-title">${escapeHtml(title)}</div>
      <div class="fallback-artist">by ${escapeHtml(artist)}</div>
      <div class="fallback-message">Lyrics not available</div>
      <div class="fallback-sample">
        This song doesn't have synchronized lyrics available.<br/>
        You can still enjoy the video with the music!
      </div>
    </div>
  `;
}

// Helper function to escape HTML
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
