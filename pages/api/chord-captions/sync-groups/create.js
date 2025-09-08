// 🎸 API Endpoint: Create Chord Sync Group
// This endpoint creates a new sync group for organizing chord captions
// POST /api/chord-captions/sync-groups/create

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
    const { favoriteId, groupColor = '#3B82F6' } = req.body;

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

    // Validate color format (hex color)
    const colorRegex = /^#[0-9A-F]{6}$/i;
    if (!colorRegex.test(groupColor)) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'groupColor must be a valid hex color (e.g., #FF0000)' 
      });
    }

    // Call the SQL helper function to create the sync group
    const { data, error } = await supabase.rpc('create_chord_sync_group', {
      p_favorite_id: favoriteId,
      p_user_id: user.id,
      p_group_color: groupColor
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
      
      if (error.message.includes('favorite_id cannot be null')) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'favorite_id cannot be null' 
        });
      }
      
      if (error.message.includes('user_id cannot be null')) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'user_id cannot be null' 
        });
      }

      // Generic database error
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to create sync group',
        details: error.message
      });
    }

    // Success response
    return res.status(201).json({
      success: true,
      message: 'Sync group created successfully',
      data: {
        groupId: data,
        favoriteId,
        groupColor,
        createdAt: new Date().toISOString()
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
