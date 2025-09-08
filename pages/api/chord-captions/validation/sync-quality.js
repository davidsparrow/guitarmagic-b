// 🎸 API Endpoint: Validate Video-Song Sync Quality
// This endpoint checks if video timing matches song metadata for sync validation
// POST /api/chord-captions/validation/sync-quality

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
    const { favoriteId } = req.body;

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

    // Call the SQL helper function to validate sync quality
    const { data, error } = await supabase.rpc('validate_video_song_sync', {
      p_favorite_id: favoriteId,
      p_user_id: user.id
    });

    if (error) {
      console.error('Database error:', error);
      
      // Handle specific database errors
      if (error.message.includes('Both favorite_id and user_id must be provided')) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Both favorite_id and user_id must be provided' 
        });
      }

      // Generic database error
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to validate sync quality',
        details: error.message
      });
    }

    // Check if we got data back
    if (!data || data.length === 0) {
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'No sync validation data returned' 
      });
    }

    // Get the first (and should be only) result
    const syncValidation = data[0];

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Sync quality validation completed successfully',
      data: {
        favoriteId,
        isSynced: syncValidation.is_synced,
        videoDuration: syncValidation.video_duration,
        songDuration: syncValidation.song_duration,
        durationDifference: syncValidation.duration_difference,
        syncQuality: syncValidation.sync_quality,
        recommendations: syncValidation.recommendations,
        validatedAt: new Date().toISOString()
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
