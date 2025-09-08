// pages/mobile.js - Mobile-Only Homepage
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import AuthModal from '../components/AuthModal'
import { useRouter } from 'next/router'
import { FaHamburger, FaTimes, FaSearch } from "react-icons/fa"
import { IoMdPower } from "react-icons/io"
import { RiLogoutCircleRLine } from "react-icons/ri"
import { LuBrain } from "react-icons/lu"
import TopBanner from '../components/TopBanner'

export default function MobileHome() {
  const { isAuthenticated, user, loading, signOut } = useAuth()
  const { profile } = useUser()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showRightMenuModal, setShowRightMenuModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const searchInputRef = useRef(null)
  const router = useRouter()

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle login/logout
  const handleAuthClick = async () => {
    if (isAuthenticated) {
      try {
        await signOut()
        setShowAuthModal(false)
        setShowRightMenuModal(false)
        setShowProfileModal(false)
        setShowPlanModal(false)
      } catch (error) {
        console.error('Sign out failed:', error)
      }
    } else {
      setShowAuthModal(true)
    }
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('')
    if (searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.setSelectionRange(0, 0)
    }
  }

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return
    // Navigate to search page with query
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  // Handle search button click
  const handleSearchClick = () => {
    handleSearch()
  }

  // Handle enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  if (!mounted || (loading && !router.isReady)) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div 
      className="relative h-screen overflow-hidden"
      style={{ 
        backgroundImage: `url('/images/gt_splashBG_dark.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1a1a1a' // Fallback color
      }}
    >
      {/* 75% Black Overlay */}
      <div className="absolute inset-0 bg-black/75 z-0" />
      
      {/* Top Banner - Admin controlled */}
      <TopBanner />
      
      {/* Transparent Header - Mobile Optimized */}
      <header className="relative z-10 px-4 py-3" style={{ backgroundColor: 'transparent' }}>
        <div className="flex justify-between items-center">
          {/* Logo - Upper Left - Mobile Optimized Size */}
          <a 
            href="/?home=true" 
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src="/images/gt_logoM_PlayButton.png" 
              alt="VideoFlip Logo" 
              className="h-8 w-auto" // Smaller for mobile
            />
          </a>
          
          {/* Right side buttons - Mobile Optimized */}
          <div className="flex items-center space-x-1"> {/* Reduced spacing */}
            {/* Brain Icon Button - Mobile Optimized */}
            <button
              onClick={() => router.push('/features')}
              className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
              title="GuitarTube Features"
            >
              <LuBrain className="w-5 h-5 group-hover:text-yellow-400 transition-colors" /> {/* Smaller icon */}
            </button>
            
            {/* Login/Logout Icon - Mobile Optimized */}
            <button 
              onClick={handleAuthClick}
              className="p-2 rounded-lg transition-colors duration-300 relative group text-white hover:bg-white/10"
              title={isAuthenticated ? "End of the Party" : "Start Me Up"}
            >
              {isAuthenticated ? (
                <RiLogoutCircleRLine className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
              ) : (
                <IoMdPower className="w-5 h-5 group-hover:text-green-400 transition-colors" />
              )}
            </button>
            
            {/* Menu Icon - Mobile Optimized */}
            <button 
              onClick={() => setShowRightMenuModal(true)}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
              title="Yummy"
            >
              <FaHamburger className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized Layout */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4" style={{ 
        height: 'calc(100vh - 120px)', // Adjusted for mobile header
        backgroundColor: 'transparent'
      }}>
        {/* Logo and Subtitle Section - Mobile Optimized */}
        <div className="text-center mb-8 mt-14"> {/* Reduced to 56px top margin for spacing from header */}
          <img 
            src="/images/gt_logo_wide_on_black_450x90.png" 
            alt="GuitarTube" 
            className="mx-auto mb-3" 
            style={{ 
              width: '75%', 
              height: 'auto',
              maxWidth: '100%'
            }}
          />
          <p className="text-center text-white font-bold text-base px-4" style={{ fontFamily: 'Poppins, sans-serif' }}> {/* Mobile text size */}
            Press fast forward on your <br />
            Video Guitar Learning journey
          </p>
        </div>

        {/* Search and Sort Fields - Mobile Optimized */}
        <div className="flex flex-col items-center space-y-3 w-full max-w-sm"> {/* Mobile layout */}
          {/* Search Bar - Mobile Optimized */}
          <div className="relative w-4/5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="How to learn guitar faster"
              className="w-full px-4 py-3 bg-white/35 backdrop-blur-sm text-white placeholder-white border border-white/20 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all text-base" // Mobile sizing
              style={{ borderRadius: '77px' }}
              ref={searchInputRef}
              onKeyPress={handleKeyPress}
            />
            
            {/* Clear button - Mobile Optimized */}
            <button
              onClick={handleClearSearch}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-white/10"
            >
              <FaTimes className="w-4 h-4" /> {/* Smaller icon */}
            </button>
            
            {/* Vertical separator line */}
            <div className="absolute right-11 top-1/2 transform -translate-y-1/2 w-px h-4 bg-white/30"></div>
            
            {/* Search button - Mobile Optimized */}
            <button
              onClick={handleSearchClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <FaSearch className="w-4 h-4" />
            </button>
          </div>


        </div>

        {/* Stay Free Button - Mobile Optimized */}
        <div className="mt-auto mb-6"> {/* Adjusted positioning for mobile */}
          <button
            onClick={() => router.push('/pricing')}
            className="relative text-green-400 font-bold text-xl hover:text-green-300 transition-all duration-500 transform hover:scale-105 overflow-hidden group px-6 py-3 rounded-full" // Mobile sizing
            title="No credit card required to Join"
          >
            <span className="relative z-10 bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent animate-shine">
              STAY FREE
            </span>
            <img 
              src="/images/no_credit_card2.png" 
              alt="No Credit Card" 
              className="inline-block ml-2 -mt-0.5 w-6 h-6" // Smaller icon for mobile
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-300/40 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm rounded-full"></div>
          </button>
        </div>
      </div>

      {/* Footer - Mobile Optimized */}
      <footer className="relative z-10 px-4 py-4" style={{ backgroundColor: 'transparent' }}>
        <div className="flex justify-center items-center space-x-3 text-white/60 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}> {/* Mobile sizing */}
          <span>© 2025 GuitarTube</span>
          <a href="/terms" className="hover:text-white transition-colors underline">terms</a>
          <a href="/privacy" className="hover:text-white transition-colors underline">privacy</a>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Right-Side Menu Modal - Mobile Optimized */}
      {showRightMenuModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRightMenuModal(false)
            }
          }}
        >
          <div 
            className="w-full max-w-[280px] h-full relative" // Mobile width
            style={{
              marginTop: '5px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowRightMenuModal(false)}
              className="absolute top-3 right-4 text-white hover:text-yellow-400 transition-colors text-2xl font-bold"
            >
              ×
            </button>
            
            {/* Menu Content - Mobile Optimized */}
            <div className="p-4 pt-16"> {/* Reduced padding for mobile */}
              <div className="text-white text-center space-y-6"> {/* Reduced spacing */}
                {/* TOP OF MENU */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="block w-full text-white hover:text-yellow-400 transition-colors text-base font-semibold" // Mobile text size
                  >
                    PROFILE
                  </button>
                  
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="block w-full text-white hover:text-yellow-400 transition-colors text-base font-semibold"
                  >
                    PLAN DEETS
                  </button>
                </div>
                
                {/* BOTTOM OF MENU */}
                <div className="space-y-3 mt-auto">
                  <a 
                    href="mailto:support@guitartube.net"
                    className="block w-full text-white hover:text-yellow-400 transition-colors text-base font-semibold"
                  >
                    SUPPORT
                  </a>
                  
                  <a 
                    href="/terms"
                    className="block w-full text-white hover:text-yellow-400 transition-colors text-base font-semibold"
                  >
                    TERMS
                  </a>
                  
                  <a 
                    href="/privacy"
                    className="block w-full text-white hover:text-yellow-400 transition-colors text-base font-semibold"
                  >
                    PRIVACY
                  </a>
                  
                  <a 
                    href="/community_guidelines"
                    className="block w-full text-white hover:text-yellow-400 transition-colors text-base font-semibold"
                  >
                    COMMUNITY GUIDELINES
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal - Mobile Optimized */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowProfileModal(false)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-sm w-full relative text-white p-6"> {/* Mobile sizing */}
            {/* Close Button */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-3 right-3 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            
            {/* Profile Content */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-4">Profile</h2> {/* Mobile text size */}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center"> {/* Mobile sizing */}
                <span className="text-white text-xl font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3 text-gray-300">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Name</p>
                <p className="font-medium">{profile?.full_name || user?.email?.split('@')[0] || 'User'}</p>
              </div>
              
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="font-medium">{user?.email || 'No email'}</p>
              </div>
              
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Subscription</p>
                <p className="font-medium capitalize">{profile?.subscription_tier || 'Freebird'}</p>
              </div>
              
              <div className="pt-3">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Plan Modal - Mobile Optimized */}
      {showPlanModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPlanModal(false)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-sm w-full relative text-white p-6"> {/* Mobile sizing */}
            {/* Close Button */}
            <button
              onClick={() => setShowPlanModal(false)}
              className="absolute top-3 right-3 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            
            {/* Plan Content */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-4">Plan Details</h2> {/* Mobile text size */}
            </div>
            
            <div className="space-y-3 text-gray-300">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Current Plan</p>
                <p className="font-medium capitalize text-lg">{profile?.subscription_tier || 'Freebird'}</p>
              </div>
              
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Billing Cycle</p>
                <p className="font-medium">Monthly</p>
              </div>
              
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Amount</p>
                <p className="font-medium text-lg">
                  ${profile?.subscription_tier === 'hero' ? '19' : 
                    profile?.subscription_tier === 'roadie' ? '10' : '0'}/mo
                </p>
              </div>
              
              <div className="pt-3 space-y-2">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Change Credit Card
                </button>
                
                {profile?.subscription_tier !== 'hero' && (
                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
                    UPGRADE
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
