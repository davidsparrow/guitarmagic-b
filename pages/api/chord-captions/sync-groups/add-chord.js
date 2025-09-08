// 🎸 API Endpoint: Add Chord to Sync Group
// This endpoint adds an existing chord caption to a sync group
// POST /api/chord-captions/sync-groups/add-chord

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
    const { chordCaptionId, syncGroupId } = req.body;

    // Validate required parameters
    if (!chordCaptionId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'chordCaptionId is required' 
      });
    }

    if (!syncGroupId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'syncGroupId is required' 
      });
    }

    // Validate UUID format for both parameters
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(chordCaptionId)) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'chordCaptionId must be a valid UUID' 
      });
    }

    if (!uuidRegex.test(syncGroupId)) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'syncGroupId must be a valid UUID' 
      });
    }

    // Call the SQL helper function to add chord to sync group
    const { data, error } = await supabase.rpc('add_chord_to_sync_group', {
      p_chord_caption_id: chordCaptionId,
      p_sync_group_id: syncGroupId,
      p_user_id: user.id
    });

    if (error) {
      console.error('Database error:', error);
      
      // Handle specific database errors
      if (error.message.includes('Chord caption not found or access denied')) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Chord caption not found or access denied' 
        });
      }
      
      if (error.message.includes('Sync group not found or access denied')) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Sync group not found or access denied' 
        });
      }
      
      if (error.message.includes('Chord caption and sync group must belong to the same favorite')) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Chord caption and sync group must belong to the same favorite' 
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
        message: 'Failed to add chord to sync group',
        details: error.message
      });
    }

    // Check if the operation was successful
    if (!data) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Failed to add chord to sync group - operation returned false' 
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Chord added to sync group successfully',
      data: {
        chordCaptionId,
        syncGroupId,
        added: data,
        updatedAt: new Date().toISOString()
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
