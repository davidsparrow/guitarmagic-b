// 🎸 API Endpoint: Search Songs
// This endpoint searches for songs using flexible name matching
// GET /api/chord-captions/songs/search?q=searchTerm&limit=10

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

    // Extract query parameters
    const { q: searchTerm, limit = 10 } = req.query;

    // Validate required parameters
    if (!searchTerm) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Search term (q) is required' 
      });
    }

    // Validate search term length
    if (searchTerm.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Search term must be at least 2 characters' 
      });
    }

    // Validate and parse limit
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Limit must be a number between 1 and 100' 
      });
    }

    // Call the SQL helper function to search for songs
    const { data, error } = await supabase.rpc('find_song_variations', {
      p_search_term: searchTerm.trim(),
      p_limit: parsedLimit
    });

    if (error) {
      console.error('Database error:', error);
      
      // Handle specific database errors
      if (error.message.includes('Search term must be at least 2 characters')) {
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Search term must be at least 2 characters' 
        });
      }

      // Generic database error
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Failed to search for songs',
        details: error.message
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Song search completed successfully',
      data: {
        searchTerm: searchTerm.trim(),
        limit: parsedLimit,
        results: data || [],
        count: data ? data.length : 0,
        searchedAt: new Date().toISOString()
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
