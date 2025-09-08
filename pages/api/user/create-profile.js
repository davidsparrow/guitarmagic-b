// pages/api/user/create-profile.js
// Create missing user profile for authenticated users
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, email, subscriptionTier = 'hero' } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        message: 'userId is required in request body' 
      });
    }

    console.log('🔧 Creating user profile for:', userId);

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing profile:', checkError);
      return res.status(500).json({ 
        message: 'Error checking existing profile',
        error: checkError.message 
      });
    }

    if (existingProfile) {
      console.log('✅ Profile already exists for user:', userId);
      return res.status(200).json({ 
        message: 'Profile already exists',
        profile: existingProfile 
      });
    }

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          email: email || `${userId}@user.com`,
          subscription_tier: subscriptionTier,
          resume_enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating profile:', createError);
      return res.status(500).json({ 
        message: 'Failed to create user profile',
        error: createError.message,
        code: createError.code
      });
    }

    console.log('✅ Profile created successfully:', newProfile);
    return res.status(201).json({ 
      message: 'User profile created successfully',
      profile: newProfile 
    });

  } catch (error) {
    console.error('❌ Create profile error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
