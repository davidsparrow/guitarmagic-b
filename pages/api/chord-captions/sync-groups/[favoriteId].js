// 🎸 API Endpoint: Get Chord Captions with Sync Groups
// This endpoint retrieves all chord captions for a video with their sync group information
// GET /api/chord-captions/sync-groups/[favoriteId]

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

    // Call the SQL helper function to get chord captions with groups
    const { data, error } = await supabase.rpc('get_chord_captions_with_groups', {
      p_favorite_id: favoriteId,
      p_user_id: user.id
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
      
      if (error.message.includes('Both favorite_id and user_id must be provided')) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Both favorite_id and user_id must be provided' 
        });
      }

      // Generic database error
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to retrieve chord captions',
        details: error.message
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Chord captions retrieved successfully',
      data: {
        favoriteId,
        chordCaptions: data || [],
        count: data ? data.length : 0,
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
