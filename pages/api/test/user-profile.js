// pages/api/test/user-profile.js
// Test endpoint to check user profile status
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user ID from query parameter
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        message: 'userId query parameter is required',
        example: '/api/test/user-profile?userId=your-user-id-here'
      });
    }

    console.log('🔍 Testing user profile access for:', userId);

    // Test 1: Check if we can access the table at all
    console.log('1️⃣ Testing basic table access...');
    const { data: tableTest, error: tableError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError);
      return res.status(500).json({ 
        message: 'Table access failed',
        error: tableError.message,
        code: tableError.code
      });
    }
    console.log('✅ Table access successful');

    // Test 2: Check if the specific user profile exists
    console.log('2️⃣ Checking if user profile exists...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log('❌ User profile NOT FOUND');
        return res.status(404).json({ 
          message: 'User profile not found',
          error: 'PGRST116 - No rows returned',
          code: profileError.code,
          solution: 'Profile record needs to be created for this user'
        });
      } else {
        console.error('❌ Error fetching profile:', profileError);
        return res.status(500).json({ 
          message: 'Error fetching profile',
          error: profileError.message,
          code: profileError.code
        });
      }
    }
    
    if (profile) {
      console.log('✅ User profile found');
      return res.status(200).json({ 
        message: 'User profile found',
        profile: {
          id: profile.id,
          email: profile.email,
          subscription_tier: profile.subscription_tier,
          resume_enabled: profile.resume_enabled,
          has_resume_columns: {
            last_video_id: !!profile.last_video_id,
            last_video_timestamp: !!profile.last_video_timestamp,
            last_video_title: !!profile.last_video_title,
            last_video_channel_name: !!profile.last_video_channel_name,
            last_session_date: !!profile.last_session_date
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return res.status(500).json({ 
      message: 'Test failed',
      error: error.message 
    });
  }
}
