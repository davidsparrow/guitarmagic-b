// components/MenuModal.js - Standalone Menu Modal Component
import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { useAuth } from '../contexts/AuthContext'

export default function MenuModal({ isOpen, onClose, onSupportClick }) {
  const { profile, userEmail } = useUser()
  const { isAuthenticated } = useAuth()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showBackstageAlert, setShowBackstageAlert] = useState(false)

  if (!isOpen) return null

  // Check authentication - show backstage alert for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <div className="bg-black rounded-2xl shadow-2xl max-w-md w-full relative text-white p-6">
          {/* Modal Content */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-4">🎭 Backstage Access Only</h2>
            <p className="text-gray-300 text-sm">
              You're only backstage. Signup to get in front of the crowd!
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => {
                onClose()
                window.location.href = '/pricing'
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Free
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Menu Modal */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose()
          }
        }}
      >
        <div 
          className="w-[300px] h-full relative"
          style={{
            marginTop: '5px', // Position just below hamburger
            backgroundColor: 'rgba(255, 255, 255, 0.08)' // Ghost-white with 8% transparency
          }}
        >
          {/* Close Button - Same style as other modals */}
          <button
            onClick={onClose}
            className="absolute top-3 right-9 text-white hover:text-yellow-400 transition-colors text-2xl font-bold"
          >
            ×
          </button>
          
          {/* Menu Content */}
          <div className="p-6 pt-16">
            <div className="text-white text-center space-y-8">
              {/* TOP OF MENU */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="block w-full text-white hover:text-yellow-400 transition-colors text-lg font-semibold"
                >
                  PROFILE
                </button>
                
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="block w-full text-white hover:text-yellow-400 transition-colors text-lg font-semibold"
                >
                  PLAN DEETS
                </button>
              </div>
              
              {/* BOTTOM OF MENU */}
              <div className="space-y-4 mt-auto">
                <a 
                  href="/how-to-faqs"
                  className="block w-full text-white hover:text-yellow-400 transition-colors text-lg font-semibold"
                >
                  HOW-TO & FAQS
                </a>
                
                <button
                  onClick={() => {
                    onClose() // Close menu modal first
                    if (onSupportClick) onSupportClick() // Then open support modal
                  }}
                  className="block w-full text-white hover:text-yellow-400 transition-colors text-lg font-semibold bg-transparent border-none cursor-pointer"
                >
                  SUPPORT
                </button>
                
                <a 
                  href="/terms"
                  className="block w-full text-white hover:text-yellow-400 transition-colors text-lg font-semibold"
                >
                  TERMS
                </a>
                
                <a 
                  href="/privacy"
                  className="block w-full text-white hover:text-yellow-400 transition-colors text-lg font-semibold"
                >
                  PRIVACY
                </a>
                
                <a 
                  href="/community_guidelines"
                  className="block w-full text-white hover:text-yellow-400 transition-colors text-lg font-semibold"
                >
                  COMMUNITY GUIDELINES
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowProfileModal(false)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-md w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            
            {/* Profile Content */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-4">Profile</h2>
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {userEmail?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Name</p>
                <p className="font-medium">{profile?.full_name || userEmail?.split('@')[0] || 'User'}</p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Email</p>
                <p className="font-medium">{userEmail || 'No email'}</p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Subscription</p>
                <p className="font-medium capitalize">{profile?.subscription_tier || 'Freebird'}</p>
              </div>
              
              <div className="pt-4">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Plan Modal */}
      {showPlanModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPlanModal(false)
            }
          }}
        >
          <div className="bg-black rounded-2xl shadow-2xl max-w-md w-full relative text-white p-8">
            {/* Close Button */}
            <button
              onClick={() => setShowPlanModal(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
            >
              ×
            </button>
            
            {/* Plan Content */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-4">Plan Details</h2>
            </div>
            
            <div className="space-y-4 text-gray-300">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Current Plan</p>
                <p className="font-medium capitalize text-xl">{profile?.subscription_tier || 'Freebird'}</p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Daily Watch Limit</p>
                <p className="font-medium text-xl">
                  {profile?.subscription_tier === 'hero' ? '480 minutes (8 hours)' : 
                   profile?.subscription_tier === 'roadie' ? '180 minutes (3 hours)' : 
                   '60 minutes (1 hour)'}
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Daily Search Limit</p>
                <p className="font-medium text-xl">
                  {profile?.subscription_tier === 'hero' ? 'Unlimited' : 
                   profile?.subscription_tier === 'roadie' ? '20 searches' : 
                   '0 searches (blocked)'}
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Saved Faves Limit</p>
                <p className="font-medium text-xl">
                  {profile?.subscription_tier === 'hero' ? 'Unlimited' : 
                   profile?.subscription_tier === 'roadie' ? '12 faves' : 
                   '0 faves (blocked)'}
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Billing Cycle</p>
                <p className="font-medium">Monthly</p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Amount</p>
                <p className="font-medium text-xl">
                  ${profile?.subscription_tier === 'hero' ? '19' : 
                    profile?.subscription_tier === 'roadie' ? '10' : '0'}/mo
                </p>
              </div>
              
              <div className="pt-4 space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Change Credit Card
                </button>
                
                {profile?.subscription_tier !== 'hero' && (
                  <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
                    UPGRADE
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
