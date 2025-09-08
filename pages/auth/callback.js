// pages/auth/callback.js - OAuth callback page
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('processing')
  const [message, setMessage] = useState('Processing authentication...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setMessage('Authentication failed. Please try again.')
          return
        }

        if (data.session) {
          // Successfully authenticated
          setStatus('success')
          setMessage('Authentication successful! Redirecting to your dashboard...')

          // Redirect to search page after a short delay
          setTimeout(() => {
            router.push('/search')
          }, 2000)
        } else {
          // No session found
          setStatus('error')
          setMessage('Authentication failed. Please try again.')
        }

      } catch (error) {
        console.error('Auth callback failed:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    // Process the callback
    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
        {/* Logo or Brand */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-yellow-400">GuitarTube</h1>
        </div>

        {/* Status Display */}
        <div className="mb-6">
          {status === 'processing' && (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
              <span className="text-white">Processing...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="text-green-400">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {status === 'error' && (
            <div className="text-red-400">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Message */}
        <p className="text-white text-lg mb-6">{message}</p>

        {/* Action Buttons */}
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-yellow-500 text-black py-3 px-4 rounded-lg font-medium hover:bg-yellow-400 transition-colors"
            >
              Go to Homepage
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Try Signing In Again
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="text-sm text-gray-400">
            <p>You'll be redirected automatically...</p>
          </div>
        )}
      </div>
    </div>
  )
}
