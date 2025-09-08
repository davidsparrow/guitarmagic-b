// components/AuthModal.js - Complete Authentication Modal
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase/client'

const AuthModal = ({ isOpen, onClose, initialTab = 'signin' }) => {
  const { signIn, signUp, resetPassword } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  if (!isOpen) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setShowPasswordReset(false)
    setIsSignUp(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        // Keep loading state active for the green button and delay
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!fullName.trim()) {
      setError('Full name is required')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await signUp(email, password, fullName.trim())
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your email to confirm your account!')
        setIsSignUp(false) // Switch back to signin
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        // OAuth redirect will happen automatically
        // User will be redirected to Google, then back to /auth/callback
        console.log('Google OAuth initiated successfully')
      }
    } catch (err) {
      console.error('Google OAuth error:', err)
      setError('Google OAuth failed. Please try again.')
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Password reset email sent!')
        setShowPasswordReset(false)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={handleClose}>
      {/* Guitar Background with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("/images/custom-mini-guitar.jpg")',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-70"></div>
      </div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-transparent modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Body */}
        <div className="bg-transparent backdrop-blur-sm rounded-2xl border border-white border-opacity-20 p-6 auth-modal relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-9 text-white hover:text-yellow-400 transition-colors text-2xl font-bold z-10"
          >
            ×
          </button>
          {/* Logo */}
          <div className="text-center mb-6">
            <img 
              src="/images/gt_logoM_PlayButton.png" 
              alt="GuitarTube Logo" 
              className="h-12 w-auto mx-auto"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-400 border-opacity-50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-900 bg-opacity-50 border border-green-400 border-opacity-50 rounded-lg text-green-200 text-sm">
              {success}
            </div>
          )}

          {/* Password Reset Form */}
          {showPasswordReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all auth-input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors auth-button"
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>

              <button
                type="button"
                onClick={() => setShowPasswordReset(false)}
                className="w-full text-gray-300 hover:text-white text-sm transition-colors"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <>
              {/* Main Form */}
              {isSignUp ? (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all auth-input"
                    placeholder="Full Name"
                    required
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all auth-input"
                    placeholder="Email Address"
                    required
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all auth-input"
                    placeholder="Password (6+ characters)"
                    required
                  />

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 transition-all auth-input"
                    placeholder="Confirm Password"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors auth-button"
                  >
                    {loading ? 'Tuning up...' : 'Tune Up & Shred Hard'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all auth-input"
                    placeholder="Username"
                    required
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all auth-input"
                    placeholder="Password"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors auth-button ${
                      loading 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    title="Sign In"
                  >
                    {loading ? 'Putting you in Centerfield!' : 'Put Me in Coach'}
                  </button>

                  {/* Forgot Password Link */}
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="w-full text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    title="Forgot Password?"
                  >
                    I don't Remember, I don't Recall
                  </button>

                  {/* Separator */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white border-opacity-30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-transparent text-gray-300">or</span>
                    </div>
                  </div>

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-transparent text-white py-3 px-4 rounded-lg font-medium border border-white hover:bg-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 auth-button"
                    title="Continue with Google"
                  >
                    <span>Baby, it's the</span>
                    <svg className="w-5 h-5 mx-0.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="-ml-2">uitar Man</span>
                  </button>
                </form>
              )}

              {/* Footer Links */}
              <div className="mt-8 text-center space-y-2">
                {isSignUp ? (
                  <p className="text-gray-200 text-sm">
                    Already have an account?{' '}
                    <button
                      onClick={() => setIsSignUp(false)}
                      className="text-blue-400 underline hover:text-blue-300 transition-colors"
                    >
                      Sign in here
                    </button>
                  </p>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm">
                      <button
                        onClick={() => setIsSignUp(true)}
                        className="text-blue-400 underline hover:text-blue-300 transition-colors"
                        title="Create New Account"
                      >
                        Signup Here
                      </button>
                    </p>
                  </>
                )}
              </div>

              {/* Terms and Privacy Policy */}
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-[10px] leading-tight">
                  By continuing, you agree to GuitarTube's{' '}
                  <a 
                    href="/terms" 
                    className="text-blue-400 underline hover:text-blue-300 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms
                  </a>{' '}
                  of Service and{' '}
                  <a 
                    href="/privacy" 
                    className="text-blue-400 underline hover:text-blue-300 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                  , and to receive periodic emails with updates.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal