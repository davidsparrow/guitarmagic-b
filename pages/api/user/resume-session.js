// pages/api/user/resume-session.js
// Get user's last session data for resume functionality
import { adminSupabase } from '../../../lib/adminSupabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user ID from query parameter or header
    const userId = req.query.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Get user profile with resume data
    const { data: profile, error: profileError } = await adminSupabase
      .from('user_profiles')
      .select(`
        id,
        email,
        subscription_tier,
        subscription_status,
        last_video_id,
        last_video_timestamp,
        last_video_title,
        last_video_channel_name,
        last_session_date,
        resume_enabled
      `)
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

    // Check if resume is enabled and has data
    if (!profile.resume_enabled || !profile.last_video_id) {
      return res.status(200).json({ 
        hasResumeData: false,
        message: 'No resume data available'
      });
    }

    // Check if session is still valid (within 7 days)
    const sessionDate = new Date(profile.last_session_date);
    const now = new Date();
    const daysSinceSession = (now - sessionDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceSession > 7) {
      // Session expired, clear resume data
      await adminSupabase
        .from('user_profiles')
        .update({
          last_video_id: null,
          last_video_timestamp: null,
          last_video_title: null,
          last_video_channel_name: null,
          last_session_date: null
        })
        .eq('id', userId);

      return res.status(200).json({ 
        hasResumeData: false,
        message: 'Resume session expired'
      });
    }

    // Return resume data
    res.status(200).json({
      hasResumeData: true,
      resumeData: {
        videoId: profile.last_video_id,
        timestamp: profile.last_video_timestamp,
        title: profile.last_video_title,
        channelName: profile.last_video_channel_name,
        sessionDate: profile.last_session_date,
        daysAgo: Math.floor(daysSinceSession)
      }
    });

  } catch (error) {
    console.error('Resume session error:', error);
    res.status(500).json({ 
      message: 'Failed to get resume session',
      error: error.message 
    });
  }
}
