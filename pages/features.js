// pages/features.js - Features Page
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from '../components/AuthModal'
import MenuModal from '../components/MenuModal'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'
import TopBanner from '../components/TopBanner'
export default function Features() {
  const { isAuthenticated, user, profile, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showFeatureModal, setShowFeatureModal] = useState(null) // 'loops', 'resume', 'chords', 'tabs', 'scrambled-brain', 'lightbulb-brain', 'sloth', 'cheetah'
  const [showCaptionsModal, setShowCaptionsModal] = useState(false)
  const [showChordDiagramsModal, setShowChordDiagramsModal] = useState(false)
  const [currentCarouselPage, setCurrentCarouselPage] = useState(0)
  const footerRef = useRef()
  const router = useRouter()
  
  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Auto-advance carousel every 20 seconds
  useEffect(() => {
    if (!mounted) return
    
    const interval = setInterval(() => {
      setCurrentCarouselPage((prevPage) => (prevPage + 1) % 3)
    }, 20000) // 20 seconds
    
    return () => clearInterval(interval)
  }, [mounted])
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

  // Handle feature hotspot clicks
  const handleFeatureClick = (feature) => {
    // Handle new modal types
    if (feature === 'captions') {
      setShowCaptionsModal(true)
    } else if (feature === 'chord-diagrams') {
      setShowChordDiagramsModal(true)
    } else {
      // Handle existing feature modals
      setShowFeatureModal(feature)
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
      
      {/* Top Banner - Admin controlled */}
      <TopBanner />
      
      {/* Header Component */}
      <Header 
        showBrainIcon={true}
        showSearchIcon={false}
        onAuthClick={handleAuthClick}
        onMenuClick={() => setShowMenuModal(true)}
        isAuthenticated={isAuthenticated}
      />
      {/* Main Content - Pricing */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 mt-20 md:mt-24" style={{ 
        height: 'calc(100vh - 140px)',
        backgroundColor: 'transparent'
      }}>
        <div className="max-w-4xl w-full rounded-2xl p-8 text-white overflow-y-auto max-h-full pb-24" style={{ 
          fontFamily: 'Futura, sans-serif',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent'
        }}>
          <h1 className="text-2xl md:text-4xl font-bold text-center mb-2 text-yellow-400">Addictive features. Astounding results</h1>
          <p className="text-center text-white font-bold text-l mb-6" style={{ fontFamily: 'Futura, sans-serif' }}>Flippin', Loopin', Resumin', Text & Chord-Captionin', Auto-generatin' Chords and Tabs</p>
          
          {/* Main Feature Graphic with Hotspots */}
          <div className="relative max-w-4xl mx-auto">
            <img 
              src="/images/webUiExample__HomePage_modalWHAT.png" 
              alt="Features Overview" 
              className="w-full rounded-2xl"
              onError={(e) => {
                console.error('Image failed to load:', e.target.src);
                e.target.style.display = 'none';
              }}
            />
            {/* Invisible Hotspot Areas Positioned Over Your Image */}
            {/* Custom Loops Hotspot (Pink Infinity) - Moved 12px left */}
            <button
              onClick={() => handleFeatureClick('loops')}
              className="absolute bottom-[25%] right-[34.5%] w-[12%] h-[20%] hover:bg-pink-500/20 transition-colors rounded-lg"
              title="Custom Loops"
            />

            {/* Cheetah Hotspot (Duplicated from Custom Loops, moved 30px left, 5px down) */}
            <button
              onClick={() => handleFeatureClick('cheetah')}
              className="absolute bottom-[14%] right-[49%] w-[13%] h-[23%] hover:bg-orange-500/20 transition-colors rounded-lg"
              title="Wayyyy faster"
            />

            {/* Lightbulb Hotspot (Duplicated from Cheetah, moved 10px left) */}
            <button
              onClick={() => handleFeatureClick('lightbulb-brain')}
              className="absolute bottom-[14%] right-[64%] w-[13%] h-[23%] hover:bg-yellow-500/20 transition-colors rounded-lg"
              title="Lightbulb session"
            />

            {/* Stringbrain Hotspot (Duplicated from Cheetah, moved 20px up) */}
            <button
              onClick={() => handleFeatureClick('sloth')}
              className="absolute bottom-[47%] right-[49%] w-[13%] h-[23%] hover:bg-red-500/20 transition-colors rounded-lg"
              title="Sad. But cute!"
            />

            {/* Sloth Hotspot (Duplicated from Lightbulb, moved 20px up) */}
            <button
              onClick={() => handleFeatureClick('scrambled-brain')}
              className="absolute bottom-[47%] right-[64%] w-[13%] h-[23%] hover:bg-orange-500/20 transition-colors rounded-lg"
              title="Brain fog"
            />
            {/* Login Resume Hotspot (Green Power Button) - Moved 12px left */}
            <button
              onClick={() => handleFeatureClick('resume')}
              className="absolute bottom-[5%] right-[34.5%] w-[12%] h-[20%] hover:bg-green-500/20 transition-colors rounded-lg"
              title="Login & Resume"
            />
            {/* Auto-gen Chords Hotspot (Light Blue Guitar Chord Diagram) - New Feature */}
            <button
              onClick={() => handleFeatureClick('chords')}
              className="absolute bottom-[25%] right-[4.5%] w-[12%] h-[20%] hover:bg-blue-500/20 transition-colors rounded-lg"
              title="Auto-gen Chords"
            />
            {/* Auto-gen Tabs Hotspot (Green Guitar Tablature) - New Feature */}
            <button
              onClick={() => handleFeatureClick('tabs')}
              className="absolute bottom-[5%] right-[4.5%] w-[12%] h-[20%] hover:bg-green-500/20 transition-colors rounded-lg"
              title="Auto-gen Tabs"
            />
            
            {/* Duplicate hotspots moved 36 pixels left */}
            <button
              onClick={() => handleFeatureClick('captions')}
              className="absolute bottom-[25%] right-[20%] w-[12%] h-[20%] hover:bg-purple-500/20 transition-colors rounded-lg"
              title="Custom Captions"
            />
            <button
              onClick={() => handleFeatureClick('chord-diagrams')}
              className="absolute bottom-[5%] right-[20%] w-[12%] h-[20%] hover:bg-orange-500/20 transition-colors rounded-lg"
              title="Select Chord Diagrams"
            />
          </div>
          
          {/* Review Cards Carousel */}
          <div className="mt-6">
            
            {/* Carousel Container */}
            <div className="relative">
              {/* Review Cards - Page 1 of 3 */}
              {currentCarouselPage === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Review Card 1 */}
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-white text-sm leading-relaxed px-2">
                        GuitarTube completely changed how I learn guitar. The video flipping feature is a game-changer!
                      </p>
                    </div>
                    <div className="mt-2 text-right">
                      <p className="text-white/70 text-xs italic">Sarah - Guitar Student</p>
                    </div>
                  </div>

                  {/* Review Card 2 */}
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-white text-sm leading-relaxed px-2">
                        The loop feature helped me master that difficult solo in just a week!
                      </p>
                    </div>
                    <div className="mt-2 text-right">
                      <p className="text-white/70 text-xs italic">Mike - Rock Guitarist</p>
                    </div>
                  </div>

                  {/* Review Card 3 */}
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-white text-sm leading-relaxed px-2">
                        Finally, I can see guitar videos from my perspective. No more mental gymnastics!
                      </p>
                    </div>
                    <div className="mt-2 text-right">
                      <p className="text-white/70 text-xs italic">Alex - Beginner Guitarist</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Cards - Page 2 of 3 */}
              {currentCarouselPage === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Review Card 4 */}
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-white text-sm leading-relaxed px-2">
                        The auto-generated chord diagrams are incredible. Saves me so much time!
                      </p>
                    </div>
                    <div className="mt-2 text-right">
                      <p className="text-white/70 text-xs italic">Emma - Folk Guitarist</p>
                    </div>
                  </div>

                  {/* Review Card 5 */}
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-white text-sm leading-relaxed px-2">
                        I love how I can resume exactly where I left off. Perfect for busy schedules!
                      </p>
                    </div>
                    <div className="mt-2 text-right">
                      <p className="text-white/70 text-xs italic">David - Working Professional</p>
                    </div>
                  </div>

                  {/* Review Card 6 */}
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-white text-sm leading-relaxed px-2">
                        The custom captions feature makes learning so much easier. Brilliant idea!
                      </p>
                    </div>
                    <div className="mt-2 text-right">
                      <p className="text-white/70 text-xs italic">Lisa - Visual Learner</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Cards - Page 3 of 3 */}
              {currentCarouselPage === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Review Card 7 */}
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-white text-sm leading-relaxed px-2">
                        Auto-generated tabs are a lifesaver. No more struggling to figure out fingerings!
                      </p>
                    </div>
                    <div className="mt-2 text-right">
                      <p className="text-white/70 text-xs italic">Tom - Tab Reader</p>
                    </div>
                  </div>

                  {/* Review Card 8 */}
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-white text-sm leading-relaxed px-2">
                        The chord diagram selection tool is genius. I can see exactly which chords to play!
                      </p>
                    </div>
                    <div className="mt-2 text-right">
                      <p className="text-white/70 text-xs italic">Rachel - Chord Learner</p>
                    </div>
                  </div>

                  {/* Review Card 9 */}
                  <div className="p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <div className="flex space-x-1">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="text-yellow-400 text-lg">★</span>
                      </div>
                    </div>
                    <div className="relative">
                      <p className="text-white text-sm leading-relaxed px-2">
                        GuitarTube has everything I need to learn guitar effectively. Highly recommend!
                      </p>
                    </div>
                    <div className="mt-2 text-right">
                      <p className="text-white/70 text-xs italic">Chris - Guitar Enthusiast</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Carousel Navigation - Hidden on Mobile */}
              <div className="hidden md:flex justify-center mt-4 space-x-2">
                <button
                  onClick={() => setCurrentCarouselPage(0)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentCarouselPage === 0 ? 'bg-yellow-400' : 'bg-white/30'
                  }`}
                />
                <button
                  onClick={() => setCurrentCarouselPage(1)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentCarouselPage === 1 ? 'bg-yellow-400' : 'bg-white/30'
                  }`}
                />
                <button
                  onClick={() => setCurrentCarouselPage(2)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentCarouselPage === 2 ? 'bg-yellow-400' : 'bg-white/30'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature Detail Modals */}
      {/* Feature Detail Modal (Custom Loops) */}
      {showFeatureModal === 'loops' && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeatureModal(null)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowFeatureModal(null)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            {/* Feature Icon */}
            <div className="text-center mb-6">
              <div className="text-8xl text-pink-400 mb-4">∞</div>
              <h2 className="text-3xl font-bold">Custom Loops</h2>
            </div>
            {/* Feature Description */}
            <div className="space-y-4 text-gray-300">
              <p>
                Create precise practice loops for mastering difficult sections. Perfect for musicians who want to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Loop challenging guitar solos or chord progressions</li>
                <li>Practice difficult timing or rhythm sections</li>
                <li>Master complex fingerpicking patterns</li>
                <li>Perfect transitions between chords</li>
              </ul>
              <div className="bg-pink-900/30 p-4 rounded-lg border border-pink-500/30 mt-6">
                <p className="text-pink-300 text-sm">
                  <strong>Premium Feature:</strong> Custom loops require a subscription for unlimited use and saving capabilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal (Login Resume) */}
      {showFeatureModal === 'resume' && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeatureModal(null)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowFeatureModal(null)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            {/* Feature Icon */}
            <div className="text-center mb-6">
              <div className="text-8xl text-green-400 mb-4">⏻</div>
              <h2 className="text-3xl font-bold">Login & Resume</h2>
            </div>
            {/* Feature Description */}
            <div className="space-y-4 text-gray-300">
              <p>
                Never lose your place again. Resume exactly where you left off with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Exact timeline position saved automatically</li>
                <li>Custom loop settings preserved</li>
                <li>Video flip preferences remembered</li>
                <li>Cross-device synchronization</li>
              </ul>
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/30 mt-6">
                <p className="text-green-300 text-sm">
                  <strong>Premium Feature:</strong> Session resume is available for premium subscribers across all devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal (Auto-gen Chords) */}
      {showFeatureModal === 'chords' && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeatureModal(null)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowFeatureModal(null)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            {/* Feature Icon */}
            <div className="text-center mb-6">
              <div className="text-8xl text-blue-400 mb-4">⚙️</div>
              <h2 className="text-3xl font-bold">Auto-gen Chords</h2>
            </div>
            {/* Feature Description */}
            <div className="space-y-4 text-gray-300">
              <p>
                Automatically generate guitar chord diagrams for any song section. Perfect for musicians who want to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>See chord fingerings in real-time</li>
                <li>Learn proper chord transitions</li>
                <li>Understand chord progressions</li>
                <li>Practice with visual chord guides</li>
              </ul>
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30 mt-6">
                <p className="text-blue-300 text-sm">
                  <strong>Coming Soon for Premium Members only:</strong> Auto-generated chords will be available for premium subscribers with unlimited access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal (Auto-gen Tabs) */}
      {showFeatureModal === 'tabs' && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeatureModal(null)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowFeatureModal(null)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            {/* Feature Icon */}
            <div className="text-center mb-6">
              <div className="text-8xl text-green-400 mb-4">🤖</div>
              <h2 className="text-3xl font-bold">Auto-gen Tabs</h2>
            </div>
            {/* Feature Description */}
            <div className="space-y-4 text-gray-300">
              <p>
                Automatically generate guitar tablature for any song section. Perfect for musicians who want to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>See exact finger positions and strings</li>
                <li>Learn complex guitar solos note-by-note</li>
                <li>Practice with precise tablature</li>
                <li>Master difficult guitar techniques</li>
              </ul>
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/30 mt-6">
                <p className="text-green-300 text-sm">
                  <strong>Coming Soon for Premium Members only:</strong> Auto-generated tabs will be available for premium subscribers with unlimited access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal (Scrambled Brain) */}
      {showFeatureModal === 'scrambled-brain' && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeatureModal(null)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowFeatureModal(null)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            {/* Feature Icon */}
            <div className="text-center mb-6">
              <div className="text-8xl text-red-400 mb-4">🧠</div>
              <h2 className="text-3xl font-bold">Why Learning Guitar face-on is Hard</h2>
            </div>
            {/* Feature Description */}
            <div className="space-y-4 text-gray-300">
              <p>
                Ever tried learning guitar from a video and felt like your brain was doing mental gymnastics? Here's why:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Guitar players in videos face you (upright)</li>
                <li>But when you play guitar, you see the fretboard from above</li>
                <li>Your brain has to flip the image TWICE to understand it</li>
                <li>It's like trying to read a book through a mirror while standing on your head!</li>
              </ul>
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/30 mt-6">
                <p className="text-red-300 text-sm">
                  <strong>The Problem:</strong> Learning new chords and fingerings is hard enough without this mental flip-flopping!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal (Lightbulb Brain) */}
      {showFeatureModal === 'lightbulb-brain' && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeatureModal(null)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowFeatureModal(null)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            {/* Feature Icon */}
            <div className="text-center mb-6">
              <div className="text-8xl text-yellow-400 mb-4">💡</div>
              <h2 className="text-3xl font-bold">How We Fix It</h2>
            </div>
            {/* Feature Description */}
            <div className="space-y-4 text-gray-300">
              <p>
                GuitarTube flips the video for you, so you see the fretboard exactly like you do when playing:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>No more mental gymnastics or brain flipping</li>
                <li>See fingers and frets from your perspective</li>
                <li>Works for any fretted instrument (guitar, bass, ukulele, etc.)</li>
                <li>Your brain can focus on learning, not spatial reasoning</li>
              </ul>
              <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-500/30 mt-6">
                <p className="text-yellow-300 text-sm">
                  <strong>The Solution:</strong> We do the flipping so you don't have to think about it!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal (Sloth) */}
      {showFeatureModal === 'sloth' && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeatureModal(null)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowFeatureModal(null)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            {/* Feature Icon */}
            <div className="text-center mb-6">
              <div className="text-8xl text-orange-400 mb-4">🦥</div>
              <h2 className="text-3xl font-bold">Before GuitarTube</h2>
            </div>
            {/* Feature Description */}
            <div className="space-y-4 text-gray-300">
              <p>
                Learning guitar without GuitarTube is like watching a sloth try to win a marathon - painfully slow and kinda hilarious:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Sloths move at 0.15 mph (slower than a snail!)</li>
                <li>They sleep 15-20 hours per day (sound familiar?)</li>
                <li>It takes them 30 days to digest one leaf</li>
                <li>They're so slow, algae grows on their fur!</li>
              </ul>
              <div className="bg-orange-900/30 p-4 rounded-lg border border-orange-500/30 mt-6">
                <p className="text-red-300 text-sm">
                  <strong>The Reality:</strong> Without proper video flipping, learning guitar feels this slow - you're basically a musical sloth! 🦥
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal (Cheetah) */}
      {showFeatureModal === 'cheetah' && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeatureModal(null)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowFeatureModal(null)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            {/* Feature Icon */}
            <div className="text-center mb-6">
              <div className="text-8xl text-orange-400 mb-4">🐆</div>
              <h2 className="text-3xl font-bold">After GuitarTube</h2>
            </div>
            {/* Feature Description */}
            <div className="space-y-4 text-gray-300">
              <p>
                With GuitarTube, you'll be learning guitar like a cheetah chasing its prey - lightning fast and unstoppable:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cheetahs can accelerate from 0 to 60 mph in just 3 seconds</li>
                <li>They can reach speeds up to 70 mph (faster than most cars!)</li>
                <li>They can change direction mid-sprint without losing speed</li>
                <li>They're the fastest land animals on Earth</li>
              </ul>
              <div className="bg-orange-900/30 p-4 rounded-lg border border-orange-500/30 mt-6">
                <p className="text-orange-300 text-sm">
                  <strong>The Result:</strong> With proper video flipping, you'll learn guitar at cheetah speed - fast, smooth, and efficient! 🐆
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal (Custom Captions) */}
      {showCaptionsModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCaptionsModal(false)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowCaptionsModal(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            {/* Feature Icon */}
            <div className="text-center mb-6">
              <div className="text-8xl text-purple-400 mb-4">📝</div>
              <h2 className="text-3xl font-bold">Custom Captions</h2>
            </div>
            {/* Feature Description */}
            <div className="space-y-4 text-gray-300">
              <p>
                Add 2 lines (stacked) of your own custom captions to any guitar video. Perfect for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chord Names above Lyrics</li>
                <li>Chord Names above Strumming Patterns</li>
                <li>Highlighting key techniques and tips</li>
                <li>Adding song structure markers</li>
              </ul>
              <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/30 mt-6">
                <p className="text-purple-300 text-sm">
                  <strong>Premium Feature:</strong> Custom captions are available for premium subscribers with unlimited access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Detail Modal (Select Chord Diagrams) */}
      {showChordDiagramsModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowChordDiagramsModal(false)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-2xl w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowChordDiagramsModal(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            {/* Feature Icon */}
            <div className="text-center mb-6">
              <div className="text-8xl text-orange-400 mb-4">🎸</div>
              <h2 className="text-3xl font-bold">Select Chord Diagrams</h2>
            </div>
            {/* Feature Description */}
            <div className="space-y-4 text-gray-300">
              <p>
                Choose from a library of chord diagrams and place them directly on your video timeline. Perfect for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Placing chord diagrams next to custom captions</li>
                <li>Visual chord reference during practice</li>
                <li>Saved preferences for future sessions</li>
                <li>Consistent chord display across videos</li>
              </ul>
              <div className="bg-orange-900/30 p-4 rounded-lg border border-orange-500/30 mt-6">
                <p className="text-orange-300 text-sm">
                  <strong>Premium Feature:</strong> Chord diagram selection is available for premium subscribers with unlimited access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
      
      {/* Footer Component */}
      <Footer ref={footerRef} />
      

    </div>
  )
}