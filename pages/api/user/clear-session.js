// pages/api/user/clear-session.js
// Clear user's resume session data
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Get user profile to check subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return res.status(500).json({ message: 'Failed to fetch user profile' });
    }

    if (!profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Check if user has access to resume feature (Roadie+ only)
    if (profile.subscription_tier === 'freebird') {
      return res.status(403).json({ 
        message: 'Resume feature requires Roadie or Hero plan',
        currentPlan: profile.subscription_tier,
        upgradeRequired: true
      });
    }

    // Clear all resume session data
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        last_video_id: null,
        last_video_timestamp: null,
        last_video_title: null,
        last_video_channel_id: null,
        last_video_channel_name: null,
        last_session_date: null
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error clearing session data:', updateError);
      return res.status(500).json({ message: 'Failed to clear session data' });
    }

    res.status(200).json({ 
      message: 'Session data cleared successfully',
      clearedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Clear session error:', error);
    res.status(500).json({ 
      message: 'Failed to clear session',
      error: error.message 
    });
  }
}
