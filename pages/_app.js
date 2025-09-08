import { AuthProvider } from '../contexts/AuthContext'
import { UserProvider } from '../contexts/UserContext'
import '../styles/globals.css'
import Head from 'next/head'
import { useEffect, useState } from 'react'

function MyApp({ Component, pageProps, router }) {
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Mobile detection function
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      const isMobileDevice = mobileRegex.test(userAgent.toLowerCase())
      
      // Also check screen width for additional mobile detection
      const isMobileScreen = window.innerWidth < 768
      
      return isMobileDevice || isMobileScreen
    }

    // Set mobile state
    const mobile = checkMobile()
    setIsMobile(mobile)

    // Redirect logic for mobile users
    if (mobile && window.location.pathname === '/' && !window.location.search.includes('mobile')) {
      // Only redirect if we're on the homepage and not already on mobile
      window.location.href = '/mobile'
    }

    // Handle window resize
    const handleResize = () => {
      const mobile = checkMobile()
      setIsMobile(mobile)
      
      // Redirect if switching between mobile/desktop
      if (mobile && window.location.pathname === '/' && !window.location.search.includes('mobile')) {
        window.location.href = '/mobile'
      } else if (!mobile && window.location.pathname === '/mobile') {
        window.location.href = '/'
      }
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Don't render until client-side to avoid hydration issues
  if (!isClient) {
    return null
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </Head>
      <AuthProvider>
        <UserProvider>
          <Component {...pageProps} />
        </UserProvider>
      </AuthProvider>
    </>
  )
}

export default MyApp