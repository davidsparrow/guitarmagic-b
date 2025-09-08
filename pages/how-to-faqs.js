// pages/how-to-faqs.js - How-To & FAQs Page
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from '../components/AuthModal'
import MenuModal from '../components/MenuModal'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'
import { IoMdPower } from "react-icons/io"
import { RiLogoutCircleRLine } from "react-icons/ri"
import { FaHamburger } from "react-icons/fa"

export default function HowToFaqs() {
  const { isAuthenticated, user, profile, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [mounted, setMounted] = useState(false)
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
    <div className="relative min-h-screen" style={{ 
      fontFamily: 'Poppins, sans-serif'
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
      
      {/* Header - Same as other pages */}
      <header className="relative z-10 px-4 md:px-6 py-3 md:py-4 bg-black/80 md:bg-transparent">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <a 
            href="/?home=true" 
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src="/images/gt_logo_wide_on_black_450x90.png" 
              alt="GuitarTube Logo" 
              className="h-8 md:h-10 w-auto"
            />
          </a>
          
          {/* Right side buttons */}
          <div className="flex items-center space-x-1 md:space-x-2">
            {/* Login/Logout Icon */}
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
            
            {/* Menu Icon */}
            <button 
              onClick={() => setShowMenuModal(true)}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
              title="Yummy!"
            >
              <FaHamburger className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - How-To & FAQs */}
      <div className="relative px-6 pb-32" style={{ 
        minHeight: 'calc(100vh - 200px)',
        backgroundColor: 'transparent'
      }}>
        <div className="max-w-6xl mx-auto text-white px-6 md:px-36">
          <h1 className="text-5xl font-bold text-center mb-12 mt-8">How-To & FAQs</h1>
          
          {/* Platform Demo Videos Section */}
          <section className="mb-16">
            {/* Video Grid - Full width, stacked top to bottom */}
            <div className="space-y-6 mb-8">
              {/* Video 1 */}
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="aspect-video rounded-lg mb-3 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/ytRyZUfZHEo?si=VhoOf-amlh7xZ2tf" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                  ></iframe>
                </div>
                <h3 className="text-lg font-semibold mb-2">Platform Demo</h3>
                <p className="text-gray-300 text-sm">Click video to watch in full size</p>
              </div>
              
              {/* Video 2 */}
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="aspect-video rounded-lg mb-3 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/Er0N6ihY5T8?si=pe-NLYMnZsAtZplX" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                  ></iframe>
                </div>
                <h3 className="text-lg font-semibold mb-2">Platform Demo</h3>
                <p className="text-gray-300 text-sm">Click video to watch in full size</p>
              </div>
              
              {/* Video 3 */}
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="aspect-video rounded-lg mb-3 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/egTCWvcxZjg?si=PmerIe8cm00juHpk" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                  ></iframe>
                </div>
                <h3 className="text-lg font-semibold mb-2">Platform Demo</h3>
                <p className="text-gray-300 text-sm">Click video to watch in full size</p>
              </div>
            </div>
          </section>
          
          {/* MVP Features Section */}
          <section className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-yellow-400">🎯 MVP Features (3-4 weeks)</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">1. Enhanced Video Controls ⭐ PRIORITY 1</h3>
                <p className="text-lg leading-relaxed mb-2">Auto-unflip during ads (ad detection)</p>
                <p className="text-gray-300">Estimate: 2-3 days • Complexity: Medium (YouTube Player API events)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">2. Session State & Resume ⭐ PRIORITY 1</h3>
                <p className="text-lg leading-relaxed mb-2">Save exact timeline position + loop settings, resume where user left off</p>
                <p className="text-gray-300">Estimate: 1-2 days • Complexity: Low (database + localStorage)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">3. Usage Tracking & Limits ⭐ PRIORITY 1</h3>
                <p className="text-lg leading-relaxed mb-2">Track video watch time, search usage, enforce tier limits</p>
                <p className="text-gray-300">Estimate: 2-3 days • Complexity: Medium (database functions + UI enforcement)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">4. Legal Foundation ✅ COMPLETED</h3>
                <p className="text-lg leading-relaxed mb-2">Privacy Policy, Terms of Service, Pricing pages, menu integration</p>
                <p className="text-gray-300">Estimate: 1 day • Complexity: Low</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">5. UI/UX Enhancement ⭐ PRIORITY 2</h3>
                <p className="text-lg leading-relaxed mb-2">Home page redesign with floating modals, "How It Works", "Features", "Getting Started" modals</p>
                <p className="text-gray-300">Estimate: 2-3 days • Complexity: Medium (responsive design + animations)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">6. Top Banner System ✅ COMPLETED</h3>
                <p className="text-lg leading-relaxed mb-2">Admin-controlled announcement banner</p>
                <p className="text-gray-300">Estimate: 0.5 days • Complexity: Low (already designed)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">7. Pricing Tiers Admin ⭐ PRIORITY 2</h3>
                <p className="text-lg leading-relaxed mb-2">Complete admin interface for pricing management</p>
                <p className="text-gray-300">Estimate: 1 day • Complexity: Low (UI + database already designed)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">8. Top 100 Creators Tracking ⭐ MVP ADDITION</h3>
                <p className="text-lg leading-relaxed mb-2">Monthly creator leaderboard by watch time, 10% revenue sharing transparency, public leaderboard page</p>
                <p className="text-gray-300">Estimate: 3-4 days • Complexity: Medium (aggregation + public page)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">9. Caption Management Integration ⭐ NEW PRIORITY</h3>
                <p className="text-lg leading-relaxed mb-2">Supabase integration for captions, user caption storage and retrieval, inline editing in control strips</p>
                <p className="text-gray-300">Estimate: 2-3 days • Complexity: Medium (database integration + UI updates)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">10. Watch Time Tracking System ⭐ NEW PRIORITY</h3>
                <p className="text-lg leading-relaxed mb-2">Per-channel watch time monitoring, user engagement analytics, creator revenue calculation foundation</p>
                <p className="text-gray-300">Estimate: 2-3 days • Complexity: Medium (tracking logic + database updates)</p>
              </div>
            </div>
          </section>

          {/* Phase 2: Music Magic Section */}
          <section className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-yellow-400">🎵 Phase 2: Music Magic (4-5 weeks)</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">11. Custom Caption Creator ⭐ GAME-CHANGER</h3>
                <p className="text-lg leading-relaxed mb-2">Timeline-based text annotations, 120-char text strings with start/stop times, no overlap validation, edit existing segments</p>
                <p className="text-gray-300">Estimate: 4-5 days • Complexity: Medium-High (timeline UI + sync logic)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">12. Basic Chord Diagrams ⭐ GAME-CHANGER</h3>
                <p className="text-lg leading-relaxed mb-2">Manual chord name entry → visual diagrams, integration with custom captions, sync with video timeline</p>
                <p className="text-gray-300">Estimate: 3-4 days • Complexity: Medium • APIs: VexChords, ChordJS, or UberChord API</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">13. Song Name Detection ⭐ ENHANCEMENT</h3>
                <p className="text-lg leading-relaxed mb-2">Parse YouTube titles for artist/song, smart title cleaning algorithms, auto-populate song search fields</p>
                <p className="text-gray-300">Estimate: 2-3 days • Complexity: Medium (text parsing + validation)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">14. Enhanced Search Features ⭐ PREMIUM</h3>
                <p className="text-lg leading-relaxed mb-2">Advanced video filters and sorting, saved search collections, search history analytics</p>
                <p className="text-gray-300">Estimate: 2-3 days • Complexity: Medium</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">15. Caption Sharing System ⭐ NEW FEATURE</h3>
                <p className="text-lg leading-relaxed mb-2">Share captions between paid users, sharing links with expiration and usage limits, import captions from shared favorites</p>
                <p className="text-gray-300">Estimate: 3-4 days • Complexity: Medium (sharing logic + UI)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">16. Creator Analytics Dashboard ⭐ NEW FEATURE</h3>
                <p className="text-lg leading-relaxed mb-2">Channel performance metrics, watch time analytics, revenue projection tools</p>
                <p className="text-gray-300">Estimate: 4-5 days • Complexity: Medium-High (analytics + visualization)</p>
              </div>
            </div>
          </section>

          {/* Phase 3: Ultimate Platform Section */}
          <section className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-yellow-400">🏆 Phase 3: Ultimate Platform (6-8 weeks)</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">17. Ultimate Guitar Integration ⭐ HOLY GRAIL</h3>
                <p className="text-lg leading-relaxed mb-2">Auto-fetch chord progressions by song name, multiple tab versions (acoustic, electric, etc.), green/orange/red light status system, song matching with confidence scoring</p>
                <p className="text-gray-300">Estimate: 7-10 days • Complexity: High (scraper integration + matching logic)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">18. Auto-Synchronized Chords ⭐ REVOLUTIONARY</h3>
                <p className="text-lg leading-relaxed mb-2">Automatic chord timeline from UG database, song structure detection (verse, chorus, bridge), pre-timed chord changes with video</p>
                <p className="text-gray-300">Estimate: 5-7 days • Complexity: High (data parsing + timeline sync)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">19. Advanced Practice Features ⭐ PREMIUM</h3>
                <p className="text-lg leading-relaxed mb-2">Loop sections with chord displays, slow-down playback with synchronized chords, export practice sessions, practice mode with metronome</p>
                <p className="text-gray-300">Estimate: 3-4 days • Complexity: Medium (YouTube Player API + UI)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">20. Creator Revenue Dashboard ⭐ BUSINESS</h3>
                <p className="text-lg leading-relaxed mb-2">Creator portal for earnings tracking, payment history and analytics, creator onboarding and verification</p>
                <p className="text-gray-300">Estimate: 4-5 days • Complexity: Medium-High</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">21. Advanced Caption Features ⭐ NEW FEATURE</h3>
                <p className="text-lg leading-relaxed mb-2">Caption templates and presets, bulk caption operations, caption versioning and history</p>
                <p className="text-gray-300">Estimate: 3-4 days • Complexity: Medium</p>
              </div>
            </div>
          </section>

          {/* Phase 4: Platform Scale Section */}
          <section className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-yellow-400">🚀 Phase 4: Platform Scale (8+ weeks)</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">22. Advanced Tab Features ⭐ ENTERPRISE</h3>
                <p className="text-lg leading-relaxed mb-2">Full guitar tablature display, bass tabs, multiple instruments, GuitarPro-style playback with timing, interactive tab following</p>
                <p className="text-gray-300">Estimate: 10-15 days • Complexity: Very High (complex rendering + sync)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">23. User-Generated Content ⭐ COMMUNITY</h3>
                <p className="text-lg leading-relaxed mb-2">Share custom caption/chord sets, community-contributed timings, rating and review system, content moderation tools</p>
                <p className="text-gray-300">Estimate: 8-12 days • Complexity: High (moderation + social features)</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">24. Mobile Application ⭐ EXPANSION</h3>
                <p className="text-lg leading-relaxed mb-2">React Native app with core features, offline chord charts and saved content, mobile-optimized video controls</p>
                <p className="text-gray-300">Estimate: 15-20 days • Complexity: Very High</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">25. Video Hosting Platform ⭐ FUTURE VISION</h3>
                <p className="text-lg leading-relaxed mb-2">Creator direct uploads, multi-platform video hosting, advanced monetization tools</p>
                <p className="text-gray-300">Estimate: 20-30 days • Complexity: Extremely High</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">26. Creator Economy Platform ⭐ NEW VISION</h3>
                <p className="text-lg leading-relaxed mb-2">Advanced revenue sharing models, creator marketplace for lessons, subscription-based creator channels</p>
                <p className="text-gray-300">Estimate: 15-20 days • Complexity: Very High</p>
              </div>
            </div>
          </section>

          {/* Success Metrics Section */}
          <section className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-yellow-400">📊 Success Metrics by Phase</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">MVP Success (Month 1)</h3>
                <p className="text-lg leading-relaxed">1,000+ registered users, 100+ daily active users, basic revenue from subscriptions, creator leaderboard engagement, caption system adoption</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">Phase 2 Success (Month 3)</h3>
                <p className="text-lg leading-relaxed">10,000+ registered users, 1,000+ daily active users, custom caption usage &gt; 50%, chord diagram feature adoption, creator revenue sharing active</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">Phase 3 Success (Month 6)</h3>
                <p className="text-lg leading-relaxed">50,000+ registered users, 5,000+ daily active users, Ultimate Guitar integration driving growth, creator revenue sharing program active, advanced caption collaboration</p>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-yellow-300">Phase 4 Success (Year 1)</h3>
                <p className="text-lg leading-relaxed">500,000+ registered users, platform-hosted content library, industry recognition as music learning leader, sustainable creator economy, global caption sharing community</p>
              </div>
            </div>
          </section>

          {/* Timeline Summary */}
          <section className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-yellow-400">🎯 Estimated Total Timeline</h2>
            <div className="space-y-4 text-lg">
              <p><strong>MVP Launch:</strong> 4 weeks</p>
              <p><strong>Music Platform:</strong> 3 months</p>
              <p><strong>Industry Leader:</strong> 6 months</p>
              <p><strong>Platform Dominance:</strong> 12 months</p>
            </div>
          </section>
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
