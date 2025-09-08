// pages/_app.js
import { AuthProvider } from '../contexts/AuthContext'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp

// =============================================================

// pages/index.js (Home/Landing Page)
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import AuthModal from '../components/AuthModal'
import { useRouter } from 'next/router'

export default function Home() {
  const { isAuthenticated, user, profile, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()

  // Redirect authenticated users to search page
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push('/search')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-20 sm:py-32">
            <div className="text-center">
              {/* Logo */}
              <div className="flex items-center justify-center space-x-3 mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">YV</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VideoFlip
                </h1>
              </div>

              {/* Hero Text */}
              <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6">
                Transform Your
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  YouTube Experience
                </span>
              </h2>

              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Flip videos, create custom loops, and enjoy YouTube like never before. 
                Perfect for learning, entertainment, and creative exploration.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300 border-2 border-gray-200"
                >
                  See Features
                </button>
              </div>

              {/* Features Preview */}
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Video Flipping</h3>
                  <p className="text-gray-600">Flip videos vertically, horizontally, or both for unique viewing experiences.</p>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">🔁</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Loops</h3>
                  <p className="text-gray-600">
                    Create precise loop points for practice, study, or entertainment.
                    <span className="block text-sm text-yellow-600 font-medium mt-1">Premium Feature</span>
                  </p>
                </div>

                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Clean Interface</h3>
                  <p className="text-gray-600">Distraction-free design focused entirely on your video content.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-white/30 backdrop-blur-sm py-20">
            <div className="max-w-4xl mx-auto px-4">
              <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Choose Your Plan
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Free Plan */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">Free</h4>
                    <p className="text-4xl font-bold text-gray-900 mb-6">$0<span className="text-lg text-gray-500">/month</span></p>
                    
                    <ul className="space-y-3 mb-8 text-left">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-3">✓</span>
                        Video search & playback
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-3">✓</span>
                        Basic flip controls
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-3">✓</span>
                        20 searches per day
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-3">✓</span>
                        Last 5 search history
                      </li>
                    </ul>
                    
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Get Started
                    </button>
                  </div>
                </div>

                {/* Premium Plan */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-xl border-2 border-blue-500 relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                  
                  <div className="text-center text-white">
                    <h4 className="text-2xl font-bold mb-2">Premium</h4>
                    <p className="text-4xl font-bold mb-6">$9<span className="text-lg opacity-80">/month</span></p>
                    
                    <ul className="space-y-3 mb-8 text-left">
                      <li className="flex items-center">
                        <span className="text-green-300 mr-3">✓</span>
                        Everything in Free
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-300 mr-3">✓</span>
                        Custom loop timeline
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-300 mr-3">✓</span>
                        Save custom loops
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-300 mr-3">✓</span>
                        Unlimited searches
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-300 mr-3">✓</span>
                        Full search history
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-300 mr-3">✓</span>
                        No ads
                      </li>
                    </ul>
                    
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Start Premium
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    )
  }

  // This shouldn't render since authenticated users are redirected
  return null
}

// =============================================================

// pages/search.js (Protected Search Page)
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'
import { checkFeatureAccess } from '../lib/supabase'

export default function Search() {
  const { isAuthenticated, user, profile, loading, isPremium } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [hasLoopAccess, setHasLoopAccess] = useState(false)

  // Redirect non-authenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
      return
    }

    // Check feature access for authenticated users
    if (user && !loading) {
      checkFeatureAccess(user.id, 'custom_loops').then(setHasLoopAccess)
    }
  }, [isAuthenticated, loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-gray-600">
            Search for YouTube videos and experience them like never before.
          </p>
          
          {/* Usage Stats */}
          <div className="mt-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Plan:</span>
              <span className={`font-medium ${isPremium ? 'text-yellow-600' : 'text-blue-600'}`}>
                {isPremium ? '✨ Premium' : 'Free'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Daily Searches:</span>
              <span className="font-medium text-blue-600">
                {profile?.daily_searches_used || 0} / {isPremium ? '∞' : '20'}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🔄</span>
              <h3 className="font-semibold text-gray-900">Video Flipping</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">Flip videos vertically and horizontally</p>
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              ✓ Available
            </span>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🔁</span>
              <h3 className="font-semibold text-gray-900">Custom Loops</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">Create precise loop points</p>
            {hasLoopAccess ? (
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                ✓ Available
              </span>
            ) : (
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                ⭐ Premium Only
              </span>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">📚</span>
              <h3 className="font-semibold text-gray-900">Search History</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">Access your saved searches</p>
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              ✓ Available ({isPremium ? 'Unlimited' : 'Last 5'})
            </span>
          </div>
        </div>

        {/* Search Interface */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Search YouTube Videos
            </h2>
            <p className="text-gray-600">
              Find videos to flip, loop, and enjoy with our custom controls
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for videos... (e.g., 'funny cats', 'guitar tutorial')"
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => alert('Search functionality coming soon!')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <span className="text-sm text-gray-500">Popular searches:</span>
              {['music videos', 'tutorials', 'comedy', 'gaming', 'nature'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upgrade Prompt for Free Users */}
        {!isPremium && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">
              🚀 Unlock Premium Features
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Get unlimited searches, custom loop controls, and advanced video features. Perfect for creators, learners, and entertainment enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                Upgrade to Premium - $9/month
              </button>
              <button className="text-white border border-white/30 px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

// =============================================================

// styles/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Animation for auth modal */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

/* Gradient text animation */
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}