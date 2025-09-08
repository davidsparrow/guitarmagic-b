// components/SupportModal.js - Standalone Support Contact Modal
import { useState } from 'react'

export default function SupportModal({ isOpen, onClose }) {
  // Support form states
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false)
  const [supportSubmitStatus, setSupportSubmitStatus] = useState(null)
  
  // Handle support form submission
  const handleSupportSubmit = async (e) => {
    e.preventDefault()
    setIsSubmittingSupport(true)
    setSupportSubmitStatus(null)
    
    try {
      // Send form data to our API endpoint
      const response = await fetch('/api/support/contact-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supportForm)
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Success - email sent via Mailjet
        setSupportSubmitStatus('success')
        setSupportForm({ name: '', email: '', subject: '', message: '' })
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose()
          setSupportSubmitStatus(null)
        }, 2000)
      } else {
        // API error
        console.error('Support API error:', data.error)
        setSupportSubmitStatus('error')
      }
      
    } catch (error) {
      console.error('Support form error:', error)
      setSupportSubmitStatus('error')
    } finally {
      setIsSubmittingSupport(false)
    }
  }
  
  // Handle support form input changes
  const handleSupportInputChange = (e) => {
    const { name, value } = e.target
    setSupportForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-black rounded-2xl shadow-2xl max-w-md w-full relative text-white p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors text-2xl font-bold"
        >
          ×
        </button>
        
        {/* Support Form */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Contact Support</h2>
        </div>
        
        <form onSubmit={handleSupportSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              value={supportForm.name}
              onChange={handleSupportInputChange}
              required
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none transition-colors"
              placeholder="Your name"
            />
          </div>
          
          <div>
            <input
              type="email"
              name="email"
              value={supportForm.email}
              onChange={handleSupportInputChange}
              required
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none transition-colors"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Subject</label>
            <input
              type="text"
              name="subject"
              value={supportForm.subject}
              onChange={handleSupportInputChange}
              required
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none transition-colors"
              placeholder="What can we help with?"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Message</label>
            <textarea
              name="message"
              value={supportForm.message}
              onChange={handleSupportInputChange}
              required
              rows={4}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-yellow-400 focus:outline-none transition-colors resize-none"
              placeholder="Tell us more about your issue..."
            />
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmittingSupport}
            className="w-full bg-yellow-500 text-black py-3 px-4 rounded-lg font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingSupport ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send Message'
            )}
          </button>
          
          {/* Status Messages */}
          {supportSubmitStatus === 'success' && (
            <div className="text-green-400 text-center text-sm">
              ✓ Message sent! We'll get back to you soon.
            </div>
          )}
          {supportSubmitStatus === 'error' && (
            <div className="text-red-400 text-center text-sm">
              ✗ Something went wrong. Please try again.
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
