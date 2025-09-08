// 🎸 API Endpoint: Get Song Data for Video
// This endpoint retrieves complete song information for a linked video
// GET /api/chord-captions/songs/[favoriteId]

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'Only GET requests are supported' 
    });
  }

  try {
    // Get user from request (assuming you have auth middleware)
    const { user } = req.body;
    
    if (!user || !user.id) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User authentication required' 
      });
    }

    // Extract favoriteId from the URL parameter
    const { favoriteId } = req.query;

    // Validate required parameters
    if (!favoriteId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'favoriteId is required' 
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(favoriteId)) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'favoriteId must be a valid UUID' 
      });
    }

    // Call the SQL helper function to get comprehensive song data
    const { data, error } = await supabase.rpc('get_song_data_for_video', {
      p_favorite_id: favoriteId,
      p_user_id: user.id
    });

    if (error) {
      console.error('Database error:', error);
      
      // Handle specific database errors
      if (error.message.includes('No song linked to this video')) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'No song linked to this video' 
        });
      }
      
      if (error.message.includes('Both favorite_id and user_id must be provided')) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Both favorite_id and user_id must be provided' 
        });
      }

      // Generic database error
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to retrieve song data',
        details: error.message
      });
    }

    // Check if we got data back
    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'No song data found for this video' 
      });
    }

    // Get the first (and should be only) result
    const songData = data[0];

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Song data retrieved successfully',
      data: {
        favoriteId,
        song: {
          id: songData.song_id,
          title: songData.song_title,
          artist: songData.artist_name,
          ugTabId: songData.ug_tab_id,
          instrumentType: songData.instrument_type,
          tuning: songData.tuning,
          keySignature: songData.key_signature,
          tempo: songData.tempo,
          timeSignature: songData.time_signature,
          difficulty: songData.difficulty,
          genre: songData.genre,
          year: songData.year,
          album: songData.album,
          tabbedBy: songData.tabbed_by
        },
        structure: {
          sectionsCount: songData.sections_count,
          chordProgressionsCount: songData.chord_progressions_count,
          totalDurationSeconds: songData.total_duration_seconds,
          hasTimingData: songData.has_timing_data
        },
        retrievedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
