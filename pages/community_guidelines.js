// pages/community_guidelines.js - Community Guidelines Page
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from '../components/AuthModal'
import MenuModal from '../components/MenuModal'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'

export default function CommunityGuidelines() {
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
      
      {/* Header Component */}
      <Header 
        showBrainIcon={false}
        showSearchIcon={false}
        onAuthClick={handleAuthClick}
        onMenuClick={() => setShowMenuModal(true)}
        isAuthenticated={isAuthenticated}
      />

      {/* Main Content - Community Guidelines */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 mt-16 md:mt-20" style={{ 
        height: 'calc(100vh - 120px)',
        backgroundColor: 'transparent'
      }}>
        <div className="max-w-4xl w-full rounded-2xl p-8 text-white overflow-y-auto max-h-full" style={{ 
          fontFamily: 'Futura, sans-serif',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent'
        }}>
          <h1 className="text-4xl font-bold text-center mb-8 text-yellow-400">Community Guidelines</h1>
          
          <div className="space-y-6 text-lg leading-relaxed">
            <p className="text-center text-yellow-300 font-semibold">
              <strong>Effective Date: January 1, 2025</strong>
            </p>
            
            <p>
              Welcome to GuitarTube! We're building a community of guitar enthusiasts who support and inspire each other. 
              To ensure everyone has a positive experience, please follow these guidelines:
            </p>
            
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">1. BE RESPECTFUL</h2>
                <p>
                  Treat all community members with kindness and respect. We welcome players of all skill levels, 
                  from beginners to advanced musicians. Remember that everyone was a beginner once.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">2. SHARE CONSTRUCTIVELY</h2>
                <p>
                  When sharing feedback or advice, be constructive and encouraging. Focus on helping others improve 
                  rather than pointing out mistakes. Celebrate progress and effort.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">3. RESPECT COPYRIGHT</h2>
                <p>
                  Only share content that you have the right to use. Respect the intellectual property of artists, 
                  songwriters, and content creators. When in doubt, seek permission or use royalty-free materials.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">4. KEEP IT MUSICAL</h2>
                <p>
                  This is a space for guitar-related content and discussions. While we encourage friendly conversation, 
                  please keep discussions focused on music, learning, and the guitar community.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">5. REPORT ISSUES</h2>
                <p>
                  If you encounter content that violates these guidelines, please report it to our support team. 
                  We're committed to maintaining a safe and welcoming environment for all members.
                </p>
              </section>
              
              <div className="bg-yellow-400/20 p-4 rounded-lg border border-yellow-400/30">
                <p className="text-yellow-300 text-center font-semibold">
                  <strong>Remember:</strong> The goal is to create a supportive community where guitarists can learn, 
                  grow, and share their passion for music together.
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
