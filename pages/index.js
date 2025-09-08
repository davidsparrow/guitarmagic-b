// pages/index.js - Homepage Using Your Actual Images
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import AuthModal from '../components/AuthModal'
import SupportModal from '../components/SupportModal'
import MenuModal from '../components/MenuModal'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'
import { FaTimes, FaSearch } from "react-icons/fa"
import TopBanner from '../components/TopBanner'
import PlanSelectionAlert from '../components/PlanSelectionAlert'
export default function Home() {
  const { isAuthenticated, user, loading, signOut } = useAuth()
  const { profile, canSearch } = useUser()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAnnualBilling, setIsAnnualBilling] = useState(true) // Default to annual billing
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showPlanSelectionAlert, setShowPlanSelectionAlert] = useState(false)
  const searchInputRef = useRef(null)
  const footerRef = useRef()
  const router = useRouter()
  

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])
  // Smart redirect logic for authenticated users
  useEffect(() => {
    if (mounted && isAuthenticated && !loading && router.isReady) {
      const urlParams = new URLSearchParams(window.location.search)
      const isIntentionalHomeVisit = urlParams.get('home') === 'true'
      const referrer = document.referrer
      const isDirectNavigation = !referrer || !referrer.includes(window.location.origin)
      if (isDirectNavigation && !isIntentionalHomeVisit) {
        router.replace('/search')
      }
    }
  }, [mounted, isAuthenticated, loading, router])

  // Handle login/logout
  const handleAuthClick = async () => {
    if (isAuthenticated) {
      try {
        await signOut()
        setShowAuthModal(false)
        setShowMenuModal(false)
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
    if (!canSearch) {
      setShowPlanSelectionAlert(true)
      return
    }
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
    <div className="relative h-screen overflow-hidden bg-black" style={{ 
      backgroundColor: '#000000',
      minHeight: '100vh',
      minHeight: '100dvh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      {/* Full-Screen Background - NEW DARK IMAGE */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/gt_splashBG_1200_dark2.png')`,
          width: '100%',
          height: '100%',
          minWidth: '100vw',
          minHeight: '100vh'
        }}
      />
      
      {/* Top Banner - Admin controlled */}
      <TopBanner />
      
      {/* Header Component */}
      <Header 
        showBrainIcon={true}
        showSearchIcon={false}
        logoImage="/images/gt_logoM_PlayButton.png"
        onAuthClick={handleAuthClick}
        onMenuClick={() => setShowMenuModal(true)}
        isAuthenticated={isAuthenticated}
      />
      {/* Main Content - Desktop Optimized */}
      <div className="relative z-10 flex flex-col items-center px-6" style={{ 
        height: 'calc(100vh - 140px)',
        backgroundColor: 'transparent'
      }}>
        {/* 1. Large Centered Logo - Desktop Optimized */}
        <div className="mt-32 mb-8">
                      <img 
              src="/images/gt_logo_wide_on_black_450x90.png" 
              alt="GuitarTube" 
              className="mx-auto mb-3 h-28 w-auto"
            />
          <p className="text-center text-white font-bold text-xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Futura, sans-serif' }}>
            Press fast forward on your Video Guitar Learning journey
          </p>
        </div>

        {/* Search and Sort Fields - Desktop Optimized */}
        <div className="flex items-center justify-center space-x-4 mt-11">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="How to learn guitar faster"
              className="w-[500px] px-6 py-3 bg-white/35 backdrop-blur-sm text-white placeholder-white border border-white/20 focus:bg-white/10 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all text-lg"
              style={{ borderRadius: '77px' }}
              ref={searchInputRef}
              onKeyPress={handleKeyPress}
            />
            
            {/* Clear button */}
            <button
              onClick={handleClearSearch}
              className="absolute right-11 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white hover:scale-110 transition-all duration-200 p-1 rounded-full hover:bg-white/10"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            
            {/* Vertical separator line */}
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2 w-px h-4 bg-white/30"></div>
            
            {/* Search button */}
            <button
              onClick={handleSearchClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <FaSearch className="w-4 h-4" />
            </button>
          </div>


        </div>

        {/* Main Feature Graphic with Hotspots */}
        
        {/* 2. Stay Free Button - Desktop Optimized */}
        <div className="mt-auto mb-4">
          {/* Stay Free - Now Clickable Button with Shiny Effect */}
          <button
            onClick={() => router.push('/pricing')}
            className="relative text-green-400 font-bold text-3xl hover:text-green-300 transition-all duration-500 transform hover:scale-105 overflow-hidden group px-8 py-3 rounded-full"
            style={{ fontFamily: 'Futura, sans-serif' }}
            title="No credit card required to Join"
          >
            <span className="relative z-10 bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent animate-shine">
              STAY FREE
            </span>
            <img 
              src="/images/no_credit_card2.png" 
              alt="No Credit Card" 
              className="inline-block ml-3 -mt-2 w-7 h-7"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-300/40 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm rounded-full"></div>
          </button>
        </div>

      </div>
      {/* Footer Component */}
      <Footer ref={footerRef} />
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      {/* Support Modal */}
      <SupportModal 
        isOpen={showSupportModal} 
        onClose={() => setShowSupportModal(false)} 
      />
      {/* Menu Modal */}
      <MenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        onSupportClick={() => footerRef.current?.openSupportModal()}
      />
      
      {/* Plan Selection Alert */}
      <PlanSelectionAlert
        isOpen={showPlanSelectionAlert}
        onClose={() => setShowPlanSelectionAlert(false)}
      />

    </div>
  )
}