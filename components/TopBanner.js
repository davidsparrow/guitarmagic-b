// components/TopBanner.js - Top banner component for promotional messages
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

const TopBanner = () => {
  const [bannerConfig, setBannerConfig] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Load banner settings
  useEffect(() => {
    const loadBannerSettings = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_admin_setting', { setting_key_param: 'top_banner' })

        if (error) {
          console.error('Error loading banner settings:', error)
          return
        }

        if (data && Object.keys(data).length > 0 && data.enabled) {
          setBannerConfig(data)
          setIsVisible(true)
        }
      } catch (error) {
        console.error('Error loading banner settings:', error)
      }
    }

    loadBannerSettings()
  }, [])

  // Check if banner should be visible based on time settings
  useEffect(() => {
    if (!bannerConfig) return

    const now = new Date()
    const currentTime = now.getTime()

    // Check if banner has start/stop time restrictions
    if (bannerConfig.startTime && bannerConfig.stopTime) {
      const startTime = new Date(bannerConfig.startTime).getTime()
      const stopTime = new Date(bannerConfig.stopTime).getTime()
      
      if (currentTime < startTime || currentTime > stopTime) {
        setIsVisible(false)
        return
      }
    }

    // Check if banner was dismissed
    const dismissedUntil = localStorage.getItem('banner_dismissed_until')
    if (dismissedUntil && currentTime < parseInt(dismissedUntil)) {
      setIsVisible(false)
      return
    }

    setIsVisible(true)
  }, [bannerConfig])

  // Handle banner dismissal
  const handleDismiss = () => {
    if (bannerConfig?.dismissible) {
      setIsDismissed(true)
      // Dismiss for 24 hours
      const dismissUntil = Date.now() + (24 * 60 * 60 * 1000)
      localStorage.setItem('banner_dismissed_until', dismissUntil.toString())
    }
  }

  // Handle banner click
  const handleBannerClick = () => {
    if (bannerConfig?.clickable && bannerConfig?.clickUrl) {
      window.location.href = bannerConfig.clickUrl
    }
  }

  // Handle button click
  const handleButtonClick = (e) => {
    e.stopPropagation()
    if (bannerConfig?.buttonUrl) {
      window.location.href = bannerConfig.buttonUrl
    }
  }

  // Render bold words with emphasis
  const renderBoldText = (text, boldWords = []) => {
    if (!boldWords || boldWords.length === 0) return text

    let result = text
    boldWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi')
      result = result.replace(regex, '<strong>$1</strong>')
    })

    return <span dangerouslySetInnerHTML={{ __html: result }} />
  }

  if (!isVisible || !bannerConfig || isDismissed) {
    return null
  }

  return (
    <div 
      className="relative w-full z-50"
      style={{
        backgroundColor: bannerConfig.backgroundColor,
        color: bannerConfig.textColor
      }}
    >
      {/* Banner Content */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Scrolling Text */}
        <div 
          className="flex-1 overflow-hidden whitespace-nowrap"
          style={{ fontSize: bannerConfig.fontSize, fontWeight: bannerConfig.fontWeight }}
        >
          <div 
            className="inline-block animate-scroll"
            style={{
              animationDuration: `${bannerConfig.scrollSpeed}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear'
            }}
          >
            {renderBoldText(bannerConfig.text, bannerConfig.boldWords)}
          </div>
        </div>

        {/* Right Side - Button and Dismiss */}
        <div className="flex items-center space-x-3 ml-4">
          {/* CTA Button */}
          {bannerConfig.showButton && (
            <button
              onClick={handleButtonClick}
              className="px-3 py-1 rounded text-sm font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: bannerConfig.buttonBackgroundColor,
                color: bannerConfig.buttonTextColor,
                border: `1px solid ${bannerConfig.buttonBorderColor}`
              }}
            >
              {bannerConfig.buttonText}
            </button>
          )}

          {/* Dismiss Button */}
          {bannerConfig.dismissible && (
            <button
              onClick={handleDismiss}
              className="text-current hover:opacity-70 transition-opacity p-1"
              title="Dismiss banner"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Clickable Overlay */}
      {bannerConfig.clickable && bannerConfig.clickUrl && (
        <button
          onClick={handleBannerClick}
          className="absolute inset-0 w-full h-full opacity-0 hover:opacity-10 transition-opacity"
          aria-label="Click banner"
        />
      )}
    </div>
  )
}

export default TopBanner
