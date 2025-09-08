// pages/api/user/update-session-simple.js
// Simplified version that handles missing database columns gracefully
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      videoId, 
      timestamp, 
      title, 
      channelId, 
      channelName 
    } = req.body;

    console.log('📝 Update session request:', { userId, videoId, timestamp, title, channelName });

    // Validate required fields
    if (!userId || !videoId || timestamp === undefined) {
      return res.status(400).json({ 
        message: 'userId, videoId, and timestamp are required' 
      });
    }

    // First, try to get basic user profile to check if user exists
    console.log('🔍 Fetching basic user profile...');
    const { data: basicProfile, error: basicProfileError } = await supabase
      .from('user_profiles')
      .select('id, subscription_tier')
      .eq('id', userId)
      .single();

    if (basicProfileError) {
      console.error('❌ Error fetching basic user profile:', basicProfileError);
      return res.status(500).json({ 
        message: 'Failed to fetch user profile',
        error: basicProfileError.message 
      });
    }

    if (!basicProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    console.log('✅ Basic user profile found:', { subscriptionTier: basicProfile.subscription_tier });

    // Check if user has access to resume feature (Roadie+ only)
    if (basicProfile.subscription_tier === 'freebird') {
      return res.status(403).json({ 
        message: 'Resume feature requires Roadie or Hero plan',
        currentPlan: basicProfile.subscription_tier,
        upgradeRequired: true
      });
    }

    // Try to update with resume columns, but handle gracefully if they don't exist
    console.log('💾 Attempting to update session data...');
    
    try {
      // First, try the full update with resume columns
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          last_video_id: videoId,
          last_video_timestamp: timestamp,
          last_video_title: title || null,
          last_video_channel_id: channelId || null,
          last_video_channel_name: channelName || null,
          last_session_date: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.log('⚠️ Full update failed, trying basic update...');
        
        // If that fails, try a basic update with just the columns we know exist
        const { error: basicUpdateError } = await supabase
          .from('user_profiles')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (basicUpdateError) {
          console.error('❌ Basic update also failed:', basicUpdateError);
          return res.status(500).json({ 
            message: 'Failed to update session data',
            error: basicUpdateError.message 
          });
        }

        // Log that we couldn't save the full session data
        console.log('⚠️ Session data partially saved (basic update only)');
        return res.status(200).json({ 
          message: 'Session data partially saved (resume columns not available)',
          warning: 'Database needs resume columns to be added',
          sessionData: {
            videoId,
            timestamp,
            title,
            channelName,
            updatedAt: new Date().toISOString()
          }
        });
      }

      console.log('✅ Session data updated successfully');
      res.status(200).json({ 
        message: 'Session data updated successfully',
        sessionData: {
          videoId,
          timestamp,
          title,
          channelName,
          updatedAt: new Date().toISOString()
        }
      });

    } catch (updateError) {
      console.error('❌ Update operation failed:', updateError);
      return res.status(500).json({ 
        message: 'Failed to update session data',
        error: updateError.message 
      });
    }

  } catch (error) {
    console.error('❌ Update session error:', error);
    res.status(500).json({ 
      message: 'Failed to update session',
      error: error.message 
    });
  }
}
