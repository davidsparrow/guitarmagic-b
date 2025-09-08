// components/PlanSelectionAlert.js - Standardized Plan Selection Alert
import { useRouter } from 'next/router'

export default function PlanSelectionAlert({ isOpen, onClose, onNavigateAway }) {
  const router = useRouter()



  if (!isOpen) return null



  const handleSelectPlan = () => {

    onClose()
    if (onNavigateAway) onNavigateAway()
    try {
      router.push('/pricing')
    } catch (error) {
      console.error('🔍 PlanSelectionAlert: Navigation error:', error)
    }
  }

  const handleCancel = () => {
    onClose()
    window.location.href = '/'
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-gray-600">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white">
            Alert. No need to panic. Yet.
          </h3>
        </div>
        
        {/* Message */}
        <div className="px-6 py-4">
          <p className="text-white text-base">
            Please select a Plan to plug-in. Get started without a credit card.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-600 flex space-x-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white"
          >
            CANCEL
          </button>
          <button
            onClick={handleSelectPlan}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-pink-500 hover:bg-pink-600 text-white"
          >
            SELECT PLAN
          </button>
        </div>
      </div>
    </div>
  )
}
