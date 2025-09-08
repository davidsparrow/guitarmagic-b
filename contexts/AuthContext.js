// contexts/AuthContext.js - Authentication Only (Profile moved to UserContext)
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // SEPARATE useEffect for timeout (not nested!)
  useEffect(() => {
    // Safety timeout - if loading stays true for more than 10 seconds, force it to false
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⚠️ Loading timeout - forcing loading to false')
        setLoading(false)
      }
    }, 10000) // 10 seconds

    return () => clearTimeout(timeout)
  }, [loading])

  // Auth state management
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth session error:', error)
        } else if (session?.user) {
          setUser(session.user)
        }
      } catch (error) {
        console.error('Failed to get session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // RESUME FUNCTIONALITY REMOVED - Was causing infinite loop bug
  // TODO: Re-implement login resume with proper state management

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        return { data: null, error }
      }

      console.log('Sign up successful:', data.user?.email)
      return { data, error: null }
    } catch (error) {
      console.error('Sign up failed:', error)
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        return { data: null, error }
      }

      console.log('Sign in successful:', data.user?.email)
      return { data, error: null }
    } catch (error) {
      console.error('Sign in failed:', error)
      return { data: null, error }
    }
  }

const signOut = async () => {
  try {
    console.log('Starting sign out...')
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      return { error }
    }

    console.log('Sign out successful - forcing reload')
    // Force page reload to clear all state
    window.location.href = '/'
    return { error: null }
  } catch (error) {
    console.error('Sign out failed:', error)
    return { error }
  }
}

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        console.error('Password reset error:', error)
        return { error }
      }

      console.log('Password reset email sent')
      return { error: null }
    } catch (error) {
      console.error('Password reset failed:', error)
      return { error }
    }
  }

  const value = {
    // State
    user,
    loading,
    
    // Computed values
    isAuthenticated: !!user,
    isEmailConfirmed: user?.email_confirmed_at != null,
    
    // Actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    
    // Basic user data (from auth, not profile)
    userEmail: user?.email,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}