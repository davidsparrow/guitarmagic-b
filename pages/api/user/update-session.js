// pages/api/user/update-session.js
// Save user's current session data for resume functionality
import { supabase } from '../../../lib/supabase';
import { adminSupabase } from '../../../lib/adminSupabase';

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

    // Validate required fields
    if (!userId || !videoId || timestamp === undefined) {
      return res.status(400).json({ 
        message: 'userId, videoId, and timestamp are required' 
      });
    }

    // Get user profile to check subscription tier
    // Use service role key for admin access to bypass RLS
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, resume_enabled')
      .eq('id', userId);

    if (profileError) {
      console.error('Error fetching user profiles:', profileError);
      return res.status(500).json({ 
        message: 'Failed to fetch user profile',
        error: profileError.message,
        code: profileError.code
      });
    }

    // Handle multiple profiles or no profiles
    let profile = null;
    if (profiles && profiles.length > 0) {
      if (profiles.length > 1) {
        console.log('⚠️ Multiple profiles found for user, using first one');
        console.log('🔍 Profile count:', profiles.length);
        console.log('🔍 First profile:', profiles[0]);
        // Could also clean up duplicates here if needed
      }
      profile = profiles[0];
      console.log('✅ Using profile:', profile);
    } else {
      console.log('⚠️ No profiles found for user');
    }

    // Profile fetching is now handled above

    if (!profile) {
      console.log('⚠️ No profile found - proceeding with basic access check');
      // Continue with basic validation
    }

    // Check if user has access to resume feature (Roadie+ only)
    if (profile && profile.subscription_tier === 'freebird') {
      return res.status(403).json({ 
        message: 'Resume feature requires Roadie or Hero plan',
        currentPlan: profile.subscription_tier,
        upgradeRequired: true
      });
    }

    // Check if resume is enabled (only if profile exists)
    if (profile && !profile.resume_enabled) {
      return res.status(200).json({ 
        message: 'Resume feature is disabled for this user' 
      });
    }

    // Use UPSERT to either create or update the profile
    console.log('🔄 Using UPSERT to ensure profile exists and update session data');
    
    const { data: upsertResult, error: upsertError } = await adminSupabase
      .from('user_profiles')
      .upsert([
        {
          id: userId,
          email: `${userId}@user.com`, // Placeholder email
          subscription_tier: profile?.subscription_tier || 'hero', // Use existing or default
          resume_enabled: profile?.resume_enabled !== false, // Default to true unless explicitly false
          last_video_id: videoId,
          last_video_timestamp: timestamp,
          last_video_title: title || null,
          last_video_channel_name: channelName || null,
          last_session_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], {
        onConflict: 'id', // Handle conflicts on the primary key
        ignoreDuplicates: false // Update existing records
      })
      .select()
      .single();

    if (upsertError) {
      console.error('❌ Error with UPSERT operation:', upsertError);
      return res.status(500).json({ 
        message: 'Failed to upsert user profile',
        error: upsertError.message 
      });
    }

    console.log('✅ Profile upserted successfully:', upsertResult);

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

  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ 
      message: 'Failed to update session',
      error: error.message 
    });
  }
}
