// pages/auth/reset-password.js - Password reset page
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase/client'

export default function ResetPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Password reset email sent! Check your inbox.')
        setEmail('')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8">
        {/* Logo or Brand */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-yellow-400">GuitarTube</h1>
          <p className="text-gray-400 mt-2">Reset Your Password</p>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
              placeholder="Enter your email address"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-black py-3 px-4 rounded-lg font-medium hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        {/* Messages */}
        {message && (
          <div className="mt-6 p-4 bg-green-900/50 border border-green-500 rounded-lg">
            <p className="text-green-400 text-center">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 text-center space-y-3">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Back to Homepage
          </button>
          <div className="text-gray-500">|</div>
          <button
            onClick={() => router.push('/pricing')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}
