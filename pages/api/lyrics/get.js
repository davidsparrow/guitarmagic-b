// pages/api/lyrics/get.js - Get Lyrics from Musixmatch API

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, artist, duration } = req.query;

  if (!title || !artist) {
    return res.status(400).json({ 
      error: 'Missing required parameters: title and artist are required' 
    });
  }

  try {
    // Encode parameters for URL
    const encodedTitle = encodeURIComponent(title);
    const encodedArtist = encodeURIComponent(artist);
    const encodedDuration = duration ? encodeURIComponent(duration) : '';

    // Build Musixmatch API URL
    const apiUrl = `https://musixmatch-lyrics-songs.p.rapidapi.com/songs/lyrics?t=${encodedTitle}&a=${encodedArtist}&d=${encodedDuration}&type=json`;

    // Make request to Musixmatch API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'musixmatch-lyrics-songs.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || 'd72fa05843msh3e7b10ddf3dc9c5p188725jsn5c78636a8cb7'
      }
    });

    if (!response.ok) {
      throw new Error(`Musixmatch API error: ${response.status} ${response.statusText}`);
    }

    const lyricsData = await response.json();

    // Process the lyrics data into our format
    const processedLyrics = processLyricsData(lyricsData, title, artist);

    res.status(200).json({
      success: true,
      data: processedLyrics,
      metadata: {
        title,
        artist,
        duration,
        totalLines: lyricsData.length,
        hasTiming: true
      }
    });

  } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lyrics',
      details: error.message 
    });
  }
}

// Process raw Musixmatch data into our format
function processLyricsData(rawData, title, artist) {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return {
      title,
      artist,
      lyrics: [],
      html: '<div style="padding: 20px; text-align: center; color: white;">No lyrics found for this song.</div>'
    };
  }

  // Convert to our format
  const lyrics = rawData.map((item, index) => ({
    id: index + 1,
    text: item.text || '',
    time: item.time ? {
      total: item.time.total,
      minutes: item.time.minutes,
      seconds: item.time.seconds,
      hundredths: item.time.hundredths
    } : null,
    isEmpty: !item.text || item.text.trim() === ''
  }));

  // Generate HTML for display
  const html = generateLyricsHTML(lyrics, title, artist);

  return {
    title,
    artist,
    lyrics,
    html,
    totalDuration: rawData[rawData.length - 1]?.time?.total || 0
  };
}

// Generate HTML for the lyrics display
function generateLyricsHTML(lyrics, title, artist) {
  const lines = lyrics.map(item => {
    if (item.isEmpty) {
      return '<div class="lyric-line empty-line">&nbsp;</div>';
    }
    
    const timeStr = item.time ? formatTime(item.time.total) : '';
    return `<div class="lyric-line" data-time="${item.time?.total || 0}">${escapeHtml(item.text)}</div>`;
  }).join('');

  return `
    <style>
      .lyrics-container {
        padding: 20px;
        font-family: monospace;
        line-height: 1.6;
        color: white;
        background: black;
      }
      .song-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 1px solid #333;
        padding-bottom: 15px;
      }
      .song-title {
        font-size: 18px;
        font-weight: bold;
        color: #00ff00;
        margin-bottom: 5px;
      }
      .song-artist {
        font-size: 14px;
        color: #ccc;
      }
      .lyric-line {
        margin: 8px 0;
        padding: 4px 0;
        min-height: 20px;
      }
      .lyric-line.empty-line {
        height: 20px;
      }
      .lyric-line:hover {
        background: rgba(0, 255, 0, 0.1);
        border-radius: 4px;
      }
    </style>
    <div class="lyrics-container">
      <div class="song-header">
        <div class="song-title">${escapeHtml(title)}</div>
        <div class="song-artist">by ${escapeHtml(artist)}</div>
      </div>
      ${lines}
    </div>
  `;
}

// Helper function to format time
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to escape HTML (server-side compatible)
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
