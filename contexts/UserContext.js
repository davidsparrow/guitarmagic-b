// contexts/UserContext.js - User Profile and Feature Management
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { useAuth } from './AuthContext'

const UserContext = createContext({})

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dailyLimits, setDailyLimits] = useState(null)

  // Get user from AuthContext
  const { user } = useAuth()

  // Fetch daily limits from admin_settings
  const fetchDailyLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_gates')
        .single()

      if (error) throw error

      if (data?.setting_value) {
        setDailyLimits({
          daily_search_limits: data.setting_value.daily_search_limits || { freebird: 8, roadie: 24, hero: 100 },
          daily_watch_time_limits: data.setting_value.daily_watch_time_limits || { freebird: 60, roadie: 180, hero: 480 },
          favorite_limits: data.setting_value.favorite_limits || { freebird: 0, roadie: 12, hero: -1 }
        })
      }
    } catch (error) {
      console.error('Error fetching daily limits:', error)
      // Fallback to default values
      setDailyLimits({
        daily_search_limits: { freebird: 8, roadie: 24, hero: 100 },
        daily_watch_time_limits: { freebird: 60, roadie: 180, hero: 480 },
        favorite_limits: { freebird: 0, roadie: 12, hero: -1 }
      })
    }
  }

  // Fetch profile when user changes
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile(user.id)
    } else {
      setProfile(null)
    }
  }, [user])

  // Fetch daily limits on mount
  useEffect(() => {
    fetchDailyLimits()
  }, [])

  // Daily search reset logic - check if we need to reset daily counts
  useEffect(() => {
    if (profile?.last_search_reset) {
      const lastReset = new Date(profile.last_search_reset);
      const today = new Date();
      
      if (lastReset.toDateString() !== today.toDateString()) {
        resetDailySearchCount();
      }
    }
  }, [profile?.last_search_reset])

  const fetchUserProfile = async (userId) => {
    if (!userId) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, subscription_tier, subscription_status')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        return
      }

      if (data) {
        setProfile(data)
        console.log('Profile loaded:', data.email, data.subscription_tier, 'Plan:', data.subscription_tier, 'Status:', data.subscription_status)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = () => {
    if (profile?.id) {
      fetchUserProfile(profile.id)
    }
  }

  // Daily search limit management
  const getDailySearchLimit = () => {
    if (!dailyLimits || !profile?.subscription_tier) return 0;
    
    const limit = dailyLimits.daily_search_limits?.[profile.subscription_tier] || 0;
    
    console.log('🔍 getDailySearchLimit:', {
      userTier: profile?.subscription_tier,
      dailyLimit: limit,
      dailyUsed: profile?.daily_searches_used || 0,
      limitsFromDB: dailyLimits.daily_search_limits
    });
    
    return limit;
  }

  const checkDailySearchLimit = () => {
    const limit = getDailySearchLimit();
    const used = profile?.daily_searches_used || 0;
    const canSearch = limit === -1 ? true : used < limit; // -1 means unlimited
    
    console.log('🔍 checkDailySearchLimit:', {
      userTier: profile?.subscription_tier,
      dailyLimit: limit,
      dailyUsed: used,
      canSearch: canSearch,
      remaining: limit === -1 ? 'UNLIMITED' : Math.max(0, limit - used)
    });
    
    return canSearch;
  }

  // Get daily watch time limit
  const getDailyWatchTimeLimit = () => {
    if (!dailyLimits || !profile?.subscription_tier) return 60;
    return dailyLimits.daily_watch_time_limits?.[profile.subscription_tier] || 60;
  }

  // Get favorite limit
  const getFavoriteLimit = () => {
    if (!dailyLimits || !profile?.subscription_tier) return 0;
    return dailyLimits.favorite_limits?.[profile.subscription_tier] || 0;
  }

  const incrementDailySearchCount = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase.rpc('increment_search_usage', {
        user_id_param: user.id
      });
      
      if (!error) {
        refreshProfile(); // Refresh to get updated count
      } else {
        console.error('Failed to increment search count:', error);
      }
    } catch (error) {
      console.error('Failed to increment search count:', error);
    }
  }

  const resetDailySearchCount = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase.rpc('reset_daily_searches');
      if (!error) {
        refreshProfile();
      } else {
        console.error('Failed to reset search count:', error);
      }
    } catch (error) {
      console.error('Failed to reset search count:', error);
    }
  }

  // Debug logging for profile state
  console.log('🔍 UserContext Debug:', {
    userId: user?.id,
    profile: profile,
    subscription_tier: profile?.subscription_tier,
    subscription_status: profile?.subscription_status,
    isPremium: profile?.subscription_tier === 'premium',
    hasPlanAccess: !!(profile?.subscription_tier && profile?.subscription_status === 'active'),
    planType: profile?.subscription_tier || 'freebird',
    planStatus: profile?.subscription_status || null
  })

  const value = {
    // State
    profile,
    loading,
    
    // Computed values
    isPremium: profile?.subscription_tier === 'premium',
    hasPlanAccess: !!(profile?.subscription_tier && profile?.subscription_status === 'active'),
    planType: profile?.subscription_tier || 'freebird',
    planStatus: profile?.subscription_status || null,
    
    // Feature access - Free users cannot search, only paid users can
    canSearch: profile?.subscription_tier !== 'freebird' && profile?.subscription_status === 'active',
    
    // User data helpers
    userName: profile?.full_name || profile?.email?.split('@')[0] || 'User',
    userEmail: profile?.email,
    dailySearchesUsed: profile?.daily_searches_used || 0,
    searchLimit: getDailySearchLimit(),
    
    // Daily limits management
    getDailySearchLimit,
    getDailyWatchTimeLimit,
    getFavoriteLimit,
    checkDailySearchLimit,
    incrementDailySearchCount,
    resetDailySearchCount,
    dailyLimits,
    
    // Actions
    fetchUserProfile,
    refreshProfile,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
