// pages/index.js - Homepage Using Your Actual Images
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from '../components/AuthModal'
import MenuModal from '../components/MenuModal'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'
import { FaRegCreditCard } from "react-icons/fa"
import { GiChickenOven, GiGuitar } from "react-icons/gi"
import { loadStripe } from '@stripe/stripe-js'
export default function Home() {
  const { isAuthenticated, user, profile, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isAnnualBilling, setIsAnnualBilling] = useState(true) // Default to annual billing
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const searchInputRef = useRef(null)
  const router = useRouter()
  
  // Stripe initialization
  const [stripe, setStripe] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const footerRef = useRef()
  
  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
    
    // Initialize Stripe
    const initStripe = async () => {
      const stripeInstance = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      setStripe(stripeInstance)
    }
    
    if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      initStripe()
    }
  }, [])
  // REMOVED: Smart redirect logic for authenticated users
  // Users need to be able to access the pricing page to select plans!

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

  // Handle Stripe checkout
  const handleCheckout = async (plan) => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    if (!stripe) {
      console.error('Stripe not initialized')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan,
          billingCycle: isAnnualBilling ? 'annual' : 'monthly',
          userEmail: user.email,
          userId: user.id
        }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        // Handle errors (like duplicate subscription)
        if (data.message === 'You already have an active subscription') {
          alert(`You already have an active ${data.currentPlan} subscription.`)
        } else {
          alert('Failed to create checkout session. Please try again.')
        }
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle free plan selection (no Stripe needed)
  const handleFreePlanSelection = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    // ✅ Use AuthContext to check existing subscription (no API call needed)
    if (profile?.subscription_tier && profile?.subscription_tier !== 'freebird') {
      alert(`You already have a ${profile.subscription_tier} plan. Contact support to downgrade.`)
      return
    }
    
    if (profile?.subscription_tier === 'freebird') {
      alert('You\'re already on the Freebird plan!')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'freebird',
          billingCycle: 'none', // Free plans don't have billing cycles
          userEmail: user.email,
          userId: user.id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Successfully updated to free plan
        alert('Welcome to the Freebird plan! You can now enjoy basic features.')
        // Optionally redirect to search page or refresh the page
        router.push('/search')
      } else {
        alert('Failed to update plan. Please try again.')
      }
    } catch (error) {
      console.error('Free plan selection error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
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
      width: '100vw',
      overflow: 'hidden'
    }}>
      {/* Full-Screen Background - NEW DARK IMAGE */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
        style={{
          backgroundImage: `url('/images/gt_splashBG_dark.png')`,
          width: '100%',
          height: '100%',
          minWidth: '100vw',
          minHeight: '100vh',
        }}
      />
      {/* Header Component */}
      <Header 
        showBrainIcon={true}
        showSearchIcon={false}
        onAuthClick={handleAuthClick}
        onMenuClick={() => setShowMenuModal(true)}
        isAuthenticated={isAuthenticated}
      />
      {/* Main Content - Pricing */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 mt-16 md:mt-20" style={{ 
        height: 'calc(100vh - 120px)',
        backgroundColor: 'transparent'
      }}>
        <div className="max-w-4xl w-full rounded-2xl p-8 text-white overflow-y-auto max-h-full pb-24" style={{ 
          fontFamily: 'Poppins, sans-serif',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent'
        }}>
          <h1 className="text-2xl md:text-4xl font-bold text-center mb-2 text-yellow-400">Choose Your Plan</h1>
          <p className="text-center text-white font-bold text-l mb-11" style={{ fontFamily: 'Futura, sans-serif' }}>Subscriptions are like Guitars. New ones all the time.</p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8 space-x-4">
            <span className={`text-sm font-medium ${isAnnualBilling ? 'text-gray-500' : 'text-orange-400'}`}>
              Billed Monthly
            </span>
            <button
              onClick={() => setIsAnnualBilling(!isAnnualBilling)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isAnnualBilling ? 'bg-blue-600' : 'bg-orange-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnualBilling ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${!isAnnualBilling ? 'text-gray-500' : 'text-blue-400'}`}>
              Billed Annually
            </span>
          </div>
          
          {/* Pricing Tiers */}
          <div className="flex flex-col md:grid md:grid-cols-3 gap-6 space-y-5 md:space-y-0">
            {/* Freebird */}
            <div className="border border-white/60 rounded-xl p-6 relative bg-black/75">
              
              {/* Plan Icon - Upper Right */}
              <div className="absolute top-4 right-4">
                <img 
                  src="/images/plan_icon_freebird.png" 
                  alt="Freebird Plan Icon" 
                  className="w-12 h-12 filter brightness-0 invert"
                />
              </div>
              
              {/* No Credit Card Pill - Bottom Edge Overlap */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                No credit card
              </div>
              <div className="mb-6">
                <div className="-mt-2">
                  <h3 className="text-2xl font-bold text-left">Freebird</h3>
                  <div className="text-gray-400 font-bold text-base">free</div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <span className="mr-3" style={{ color: '#8dc641' }}>✓</span>
                  <span>Flippin some vids</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-3">✗</span>
                  <span>Loopin some segments</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-3">✗</span>
                  <span>Login Resume</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-3">✗</span>
                  <span>Captions & Chords</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-3">✗</span>
                  <span>Tabs (coming soon)</span>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm text-gray-400">
                <div>max faves: <span className="text-white">0</span></div>
                <div>max daily searches: <span className="text-white">12</span></div>
                <div>max daily watch time: <span className="text-white">1 Hr.</span></div>
              </div>
              <button 
                onClick={handleFreePlanSelection}
                disabled={isLoading}
                className="w-full mt-6 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <span>STAY FREE</span>
                    <img 
                      src="/images/no_credit_card2.png" 
                      alt="No Credit Card" 
                      className="w-5 h-5"
                    />
                  </>
                )}
              </button>
            </div>

            {/* Roadie */}
            <div className="border border-yellow-500 rounded-xl p-6 relative bg-black/75">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </div>
              
              {/* Plan Icon - Upper Right */}
              <div className="absolute top-4 right-4">
                <img 
                  src="/images/plan_icon_roadie.png" 
                  alt="Roadie Plan Icon" 
                  className="w-12 h-12"
                  style={{ filter: 'hue-rotate(45deg) saturate(200%) brightness(1.6)' }}
                />
              </div>
              
              {/* 30-day Trial Pill - Bottom Edge Overlap */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                30-day Free Trial
              </div>
              <div className="mb-6">
                <div className="-mt-2">
                  <h3 className="text-2xl font-bold text-left">Roadie</h3>
                  <div className="text-yellow-400 font-bold text-base">
                    ${isAnnualBilling ? '8' : '10'}/mo.
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <span className="mr-3" style={{ color: '#8dc641' }}>✓</span>
                  <span>Everything in Freebird</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3" style={{ color: '#8dc641' }}>✓</span>
                  <span>Loopin some segments</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3" style={{ color: '#8dc641' }}>✓</span>
                  <span>Login Resume</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3" style={{ color: '#8dc641' }}>✓</span>
                  <span>Custom 2-Line Captions</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <span className="mr-3">✗</span>
                  <span>Captioned Chord Diagrams</span>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm text-gray-400">
                <div>max faves: <span className="text-yellow-400">12</span></div>
                <div>max daily searches: <span className="text-yellow-400">36</span></div>
                <div>max daily watch time: <span className="text-yellow-400">3 Hrs.</span></div>
              </div>
              
              <button 
                onClick={() => handleCheckout('roadie')}
                disabled={isLoading}
                className="w-full mt-6 bg-yellow-500 text-black py-3 rounded-lg hover:bg-yellow-400 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'STAY CHEAP'
                )}
              </button>
            </div>

            {/* Hero */}
            <div className="border rounded-xl p-6 relative bg-black/75" style={{ borderColor: '#8dc641' }}>
              {/* Plan Icon - Upper Right */}
              <div className="absolute top-4 right-4">
                <img 
                  src="/images/plan_icon_hero.png" 
                  alt="Hero Plan Icon" 
                  className="w-14 h-14"
                  style={{ filter: 'brightness(0.8)' }}
                />
              </div>
              
              {/* 30-day Trial Pill - Bottom Edge Overlap */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                30-day Free Trial
              </div>
              <div className="mb-6">
                <div className="-mt-2">
                  <h3 className="text-2xl font-bold text-left">Hero</h3>
                  <div className="font-bold text-base" style={{ color: '#8dc641' }}>
                    ${isAnnualBilling ? '16' : '19'}/mo.
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <span className="mr-3" style={{ color: '#8dc641' }}>✓</span>
                  <span>Everything in Roadie</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3" style={{ color: '#8dc641' }}>✓</span>
                  <span>Captioned Chord Diagrams</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3" style={{ color: '#8dc641' }}>✓</span>
                  <span>Auto-Gen Chord Diagrams</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-3" style={{ color: '#8dc641' }}>✓</span>
                  <span>Auto-Gen Tabs</span>
                </div>
                <div className="flex items-center">
                  <span className="text-black mr-3">-</span>
                  <span className="text-black">-</span>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm text-gray-400">
                <div>max faves: <span style={{ color: '#8dc641' }}>UNLIMITED</span></div>
                <div>max daily searches: <span style={{ color: '#8dc641' }}>UNLIMITED</span></div>
                <div>max daily watch time: <span style={{ color: '#8dc641' }}>8 Hrs.</span></div>
              </div>
              
              <button 
                onClick={() => handleCheckout('hero')}
                disabled={isLoading}
                className="w-full mt-6 text-black py-3 rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ backgroundColor: '#8dc641' }}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'GO BROKE'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Footer Component */}
      <Footer ref={footerRef} />
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      

      {/* Menu Modal */}
      <MenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        onSupportClick={() => footerRef.current?.openSupportModal()}
      />
      

      

    </div>
  )
}