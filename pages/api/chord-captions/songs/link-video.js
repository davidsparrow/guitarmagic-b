// 🎸 API Endpoint: Link Video to Song
// This endpoint links a favorite video to a UG song in the database
// POST /api/chord-captions/songs/link-video

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'Only POST requests are supported' 
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

    // Extract request parameters
    const { favoriteId, songId, expectedDurationSeconds } = req.body;

    // Validate required parameters
    if (!favoriteId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'favoriteId is required' 
      });
    }

    if (!songId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'songId is required' 
      });
    }

    // Validate UUID format for both parameters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(favoriteId)) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'favoriteId must be a valid UUID' 
      });
    }

    if (!uuidRegex.test(songId)) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'songId must be a valid UUID' 
      });
    }

    // Validate expectedDurationSeconds if provided
    let parsedDuration = null;
    if (expectedDurationSeconds !== undefined && expectedDurationSeconds !== null) {
      parsedDuration = parseInt(expectedDurationSeconds, 10);
      if (isNaN(parsedDuration) || parsedDuration <= 0) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'expectedDurationSeconds must be a positive number' 
        });
      }
    }

    // Call the SQL helper function to link video to song
    const { data, error } = await supabase.rpc('link_video_to_song', {
      p_favorite_id: favoriteId,
      p_song_id: songId,
      p_user_id: user.id,
      p_expected_duration_seconds: parsedDuration
    });

    if (error) {
      console.error('Database error:', error);
      
      // Handle specific database errors
      if (error.message.includes('Favorite not found or access denied')) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Favorite not found or access denied' 
        });
      }
      
      if (error.message.includes('Song not found')) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Song not found' 
        });
      }
      
      if (error.message.includes('All parameters must be provided')) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'All parameters must be provided' 
        });
      }

      // Generic database error
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to link video to song',
        details: error.message
      });
    }

    // Check if the operation was successful
    if (!data) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Failed to link video to song - operation returned false' 
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Video linked to song successfully',
      data: {
        favoriteId,
        songId,
        linked: data,
        expectedDurationSeconds: parsedDuration,
        linkedAt: new Date().toISOString()
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
