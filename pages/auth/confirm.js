// pages/auth/confirm.js - Email confirmation page
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase/client'

export default function EmailConfirm() {
  const router = useRouter()
  const [status, setStatus] = useState('confirming')
  const [message, setMessage] = useState('Confirming your email...')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the access_token from URL hash
        const hash = window.location.hash
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (!accessToken) {
          setStatus('error')
          setMessage('Invalid confirmation link. Please check your email and try again.')
          return
        }

        // Set the session using the tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (error) {
          console.error('Email confirmation error:', error)
          setStatus('error')
          setMessage('Failed to confirm email. Please try again or contact support.')
          return
        }

        // Success!
        setStatus('success')
        setMessage('Email confirmed successfully! Redirecting to your dashboard...')

        // Redirect to search page after a short delay
        setTimeout(() => {
          router.push('/search')
        }, 2000)

      } catch (error) {
        console.error('Email confirmation failed:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    // Only run if we have a hash in the URL
    if (window.location.hash) {
      handleEmailConfirmation()
    } else {
      setStatus('error')
      setMessage('Invalid confirmation link. Please check your email and try again.')
    }
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
          {status === 'confirming' && (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
              <span className="text-white">Confirming...</span>
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
              Try Signing Up Again
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
