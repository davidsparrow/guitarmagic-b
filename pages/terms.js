// pages/terms.js - Terms of Use Page
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from '../components/AuthModal'
import MenuModal from '../components/MenuModal'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'

export default function TermsOfUse() {
  const { isAuthenticated, user, profile, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const footerRef = useRef()
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
        setShowMenuModal(false)
      } catch (error) {
        console.error('Sign out failed:', error)
      }
    } else {
      setShowAuthModal(true)
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
      {/* Full-Screen Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/dark_guitarPink.png')`,
          width: '100vw',
          height: '100vh'
        }}
      />
      
      {/* Header Component */}
      <Header 
        showBrainIcon={false}
        showSearchIcon={false}
        onAuthClick={handleAuthClick}
        onMenuClick={() => setShowMenuModal(true)}
        isAuthenticated={isAuthenticated}
      />

      {/* Main Content - Terms of Use */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 mt-16 md:mt-20" style={{ 
        height: 'calc(100vh - 120px)',
        backgroundColor: 'transparent'
      }}>
        <div className="max-w-4xl w-full rounded-2xl p-8 text-white overflow-y-auto max-h-full" style={{ 
          fontFamily: 'Futura, sans-serif',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent'
        }}>
          <h1 className="text-4xl font-bold text-center mb-8 text-yellow-400">Terms of Use</h1>
          
          <div className="space-y-6 text-lg leading-relaxed">
            <p className="text-center text-yellow-300 font-semibold">
              <strong>Effective Date: January 1, 2025</strong>
            </p>
            
            <p>
              Welcome to GuitarTube, a video learning platform that provides tools for musicians and content creators. 
              These Terms of Use ("Terms") govern your access to and use of our website, services, and applications 
              (collectively, the "Service").
            </p>
            
            <div className="bg-yellow-400/20 p-4 rounded-lg border border-yellow-400/30">
              <p className="text-yellow-300 text-center font-semibold">
                <strong>By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, then you may not access the Service.</strong>
              </p>
            </div>
            
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">1. DEFINITIONS</h2>
                <ul className="space-y-2 ml-6">
                  <li><strong>"Service"</strong> refers to GuitarTube website, mobile applications, and all related features</li>
                  <li><strong>"User"</strong> refers to any individual who accesses or uses our Service</li>
                  <li><strong>"Creator"</strong> refers to Users who upload or create content on our platform</li>
                  <li><strong>"Content"</strong> refers to any text, images, videos, audio, code, captions, chord charts, or other materials</li>
                  <li><strong>"User Content"</strong> refers to Content that Users submit, upload, or create using our Service</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">2. ACCEPTANCE AND ELIGIBILITY</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">2.1 Age Requirements</h3>
                    <p>You must be at least 13 years old to use this Service. Users between 13-17 must have parental consent.</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">2.2 Account Registration</h3>
                    <p>To access premium features, you must create an account with accurate information and maintain the security of your login credentials.</p>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">3. USER CONTENT AND INTELLECTUAL PROPERTY</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">3.1 User Content Ownership</h3>
                    <p className="bg-green-400/20 p-3 rounded-lg border border-green-400/30">
                      <strong>You retain full ownership of all User Content you create, upload, or submit to our Service.</strong> This includes:
                    </p>
                    <ul className="ml-6 mt-2 space-y-1">
                      <li>• Custom video captions and annotations</li>
                      <li>• Chord charts and musical notations</li>
                      <li>• Comments, reviews, and ratings</li>
                      <li>• Practice session data and custom loops</li>
                      <li>• Any other content you generate using our tools</li>
                    </ul>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">4. THIRD-PARTY SERVICES AND DISCLAIMERS</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">4.1 Third-Party Integrations</h3>
                    <p>Our Service integrates with various third-party platforms and APIs, including but not limited to:</p>
                    <ul className="ml-6 mt-2 space-y-1">
                      <li>• YouTube Data API and YouTube Player API</li>
                      <li>• Stripe payment processing</li>
                      <li>• Supabase database and authentication</li>
                      <li>• Ultimate Guitar content and chord databases</li>
                      <li>• UberChord API and chord libraries</li>
                      <li>• Amazon S3 and cloud hosting services</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">4.2 LIMITATION OF LIABILITY FOR THIRD-PARTY SERVICES</h3>
                    <p className="bg-red-400/20 p-3 rounded-lg border border-red-400/30">
                      <strong>GuitarTube IS NOT RESPONSIBLE OR LIABLE for:</strong>
                    </p>
                    <ul className="ml-6 mt-2 space-y-1">
                      <li>• Service interruptions, downtime, or failures of third-party providers</li>
                      <li>• Data loss, corruption, or security breaches at third-party services</li>
                      <li>• Changes to third-party APIs, pricing, or terms of service</li>
                      <li>• Content accuracy, availability, or copyright issues from external sources</li>
                    </ul>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">5. CREATOR REVENUE SHARING PROGRAM</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">5.1 Eligibility</h3>
                    <p>Creators may be eligible for revenue sharing based on:</p>
                    <ul className="ml-6 mt-2 space-y-1">
                      <li>• Monthly rankings by total watch time on their content</li>
                      <li>• Top 100 creator leaderboard placement</li>
                      <li>• Compliance with community guidelines and terms</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">5.2 Revenue Distribution</h3>
                    <ul className="ml-6 mt-2 space-y-1">
                      <li>• <strong>10% of net platform revenue</strong> is distributed monthly to eligible creators</li>
                      <li>• Payouts are calculated based on proportional watch time and engagement</li>
                      <li>• Minimum payout threshold: $25 USD per month</li>
                      <li>• Payments processed through Stripe or other payment providers</li>
                    </ul>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">6. SUBSCRIPTION SERVICES AND BILLING</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">6.1 Paid Subscriptions</h3>
                    <p>Premium features require paid subscriptions with the following tiers:</p>
                    <ul className="ml-6 mt-2 space-y-1">
                      <li>• <strong>Freebird</strong>: Free tier with limited features</li>
                      <li>• <strong>Roadie</strong>: $10/month with enhanced features</li>
                      <li>• <strong>Hero</strong>: $19/month with unlimited access</li>
                    </ul>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">7. PROHIBITED USES</h2>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">7.1 You may NOT use our Service to:</h3>
                  <ul className="ml-6 space-y-1">
                    <li>• Upload copyrighted content without permission</li>
                    <li>• Manipulate view counts, engagement metrics, or creator rankings</li>
                    <li>• Reverse engineer, scrape, or extract data from our platform</li>
                    <li>• Distribute malware, spam, or harmful content</li>
                    <li>• Harass, threaten, or abuse other users</li>
                    <li>• Violate any applicable laws or regulations</li>
                  </ul>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">8. LIMITATION OF LIABILITY</h2>
                <div className="space-y-3">
                  <div className="bg-red-400/20 p-3 rounded-lg border border-red-400/30">
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">8.1 DISCLAIMER OF WARRANTIES</h3>
                    <p><strong>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</strong></p>
                  </div>
                  <div className="bg-red-400/20 p-3 rounded-lg border border-red-400/30">
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">8.2 MAXIMUM LIABILITY</h3>
                    <p><strong>Our total liability to you for any claims related to the Service shall not exceed $100 USD or the amount you paid us in the past 12 months, whichever is greater.</strong></p>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">9. CONTACT INFORMATION</h2>
                <p>For questions about these Terms, contact us at:</p>
                <ul className="ml-6 mt-2 space-y-1">
                  <li>• <strong>Email</strong>: legal@GuitarTube.com</li>
                  <li>• <strong>Support</strong>: support@GuitarTube.com</li>
                </ul>
              </section>
              
              <div className="mt-8 p-4 bg-yellow-400/20 rounded-lg border border-yellow-400/30">
                <p className="text-yellow-300 text-center font-semibold">
                  <strong>BY USING OUR SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF USE.</strong>
                </p>
                <p className="text-center text-yellow-300 mt-2">
                  Last Updated: January 1, 2025 • GuitarTube Terms of Use v2.0
                </p>
              </div>
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
