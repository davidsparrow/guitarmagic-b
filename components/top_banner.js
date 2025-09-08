// components/TopBanner.js - Scrolling Admin Banner
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const TopBanner = () => {
  const [bannerConfig, setBannerConfig] = useState(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Fetch banner configuration
  useEffect(() => {
    const fetchBannerConfig = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_admin_setting', { setting_key_param: 'top_banner' })

        if (error) {
          console.error('Error fetching banner config:', error)
          return
        }

        if (data && data.enabled) {
          setBannerConfig(data)
          
          // Check if user has dismissed this banner (localStorage)
          const dismissedBanners = JSON.parse(localStorage.getItem('dismissedBanners') || '[]')
          const bannerHash = btoa(data.text).substring(0, 10) // Simple hash of text
          setIsDismissed(dismissedBanners.includes(bannerHash))
        }
      } catch (error) {
        console.error('Error loading banner:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBannerConfig()
  }, [])

  // Handle banner dismissal
  const handleDismiss = () => {
    if (!bannerConfig) return
    
    setIsDismissed(true)
    
    // Save dismissal in localStorage
    const dismissedBanners = JSON.parse(localStorage.getItem('dismissedBanners') || '[]')
    const bannerHash = btoa(bannerConfig.text).substring(0, 10)
    
    if (!dismissedBanners.includes(bannerHash)) {
      dismissedBanners.push(bannerHash)
      localStorage.setItem('dismissedBanners', JSON.stringify(dismissedBanners))
    }
  }

  // Handle banner click
  const handleBannerClick = () => {
    if (bannerConfig?.clickable && bannerConfig?.clickUrl) {
      router.push(bannerConfig.clickUrl)
    }
  }

  // Handle CTA button click
  const handleButtonClick = (e) => {
    e.stopPropagation() // Prevent banner click
    if (bannerConfig?.buttonUrl) {
      router.push(bannerConfig.buttonUrl)
    }
  }

  // Format text with bold words
  const formatTextWithBold = (text, boldWords = []) => {
    if (!boldWords || boldWords.length === 0) return text

    let formattedText = text
    boldWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      formattedText = formattedText.replace(regex, `<strong>${word}</strong>`)
    })

    return formattedText
  }

  // Don't render if loading, no config, not enabled, or dismissed
  if (isLoading || !bannerConfig || !bannerConfig.enabled || isDismissed) {
    return null
  }

  const bannerStyles = {
    backgroundColor: bannerConfig.backgroundColor || '#3b82f6',
    color: bannerConfig.textColor || '#ffffff',
    fontSize: bannerConfig.fontSize || '14px',
    fontWeight: bannerConfig.fontWeight || '500'
  }

  const buttonStyles = {
    backgroundColor: bannerConfig.buttonBackgroundColor || '#ffffff',
    color: bannerConfig.buttonTextColor || '#3b82f6',
    borderColor: bannerConfig.buttonBorderColor || '#ffffff'
  }

  const buttonHoverStyles = {
    backgroundColor: bannerConfig.buttonHoverBackgroundColor || '#f3f4f6',
    color: bannerConfig.buttonHoverTextColor || '#1e40af'
  }

  return (
    <div 
      className={`relative w-full overflow-hidden border-b border-opacity-20 ${
        bannerConfig.clickable ? 'cursor-pointer' : ''
      }`}
      style={bannerStyles}
      onClick={handleBannerClick}
    >
      {/* Scrolling Text Container */}
      <div className="relative h-12 flex items-center">
        <div 
          className="animate-scroll whitespace-nowrap"
          style={{
            animationDuration: `${bannerConfig.scrollSpeed || 50}s`
          }}
          dangerouslySetInnerHTML={{
            __html: formatTextWithBold(bannerConfig.text, bannerConfig.boldWords)
          }}
        />
      </div>

      {/* CTA Button */}
      {bannerConfig.showButton && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
          <button
            onClick={handleButtonClick}
            className="px-4 py-1.5 text-xs font-medium rounded-md border transition-all duration-200 hover:scale-105"
            style={buttonStyles}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, buttonHoverStyles)
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, buttonStyles)
            }}
          >
            {bannerConfig.buttonText || 'Learn More'}
          </button>
        </div>
      )}

      {/* Dismiss Button */}
      {bannerConfig.dismissible && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDismiss()
          }}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-current opacity-70 hover:opacity-100 transition-opacity"
          style={{ right: bannerConfig.showButton ? '120px' : '8px' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* CSS for scrolling animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-scroll {
          animation: scroll linear infinite;
        }
      `}</style>
    </div>
  )
}

export default TopBanner