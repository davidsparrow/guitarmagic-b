// components/Footer.js - Reusable Footer Component
import { useState, useImperativeHandle, forwardRef } from 'react'
import SupportModal from './SupportModal'

const Footer = forwardRef((props, ref) => {
  const [showSupportModal, setShowSupportModal] = useState(false)

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    openSupportModal: () => setShowSupportModal(true)
  }))

  return (
    <>
      {/* Redesigned Footer - Sticky to Bottom with Padding */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/55 backdrop-blur-sm z-20">
        {/* Escher Geometric Pattern Background - Much Dimmer */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35"
          style={{
            backgroundImage: `url('/images/escher_geometric_pattern_GRN.png')`,
            width: '100%',
            height: '100%'
          }}
        />
        <div className="px-6 py-5 relative z-10">
          <div className="flex flex-col items-center space-y-2" style={{ fontFamily: 'Futura, sans-serif' }}>
            <div className="flex justify-center items-center space-x-4 text-white/60 text-xs">
              <span>© 2025 GuitarTube</span>
              <a href="/pricing" className="hover:text-white transition-colors underline">pricing</a>
              <a href="/how-to-faqs" className="hover:text-white transition-colors underline">faq</a>
              <a href="/community_guidelines" className="hover:text-white transition-colors underline">community</a>
              <button onClick={() => setShowSupportModal(true)} className="hover:text-white transition-colors underline bg-transparent border-none text-white/60 cursor-pointer">support</button>
              <a href="/terms" className="hover:text-white transition-colors underline">terms</a>
              <a href="/privacy" className="hover:text-white transition-colors underline">privacy</a>
            </div>
            <div className="text-white text-xs">
              Made with 🎸 in Millhatten, CA
            </div>
          </div>
        </div>
      </footer>

      {/* Support Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </>
  )
})

export default Footer
