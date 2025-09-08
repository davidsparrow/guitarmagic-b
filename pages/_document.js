import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon Configuration - Mobile-First Approach */}
        
        {/* Standard favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        
        {/* PNG favicons for different sizes */}
        <link rel="icon" type="image/png" sizes="72x72" href="/images/favicons/icon-72.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/images/favicons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/images/favicons/icon-512.png" />
        
        {/* Apple Touch Icon - iOS Safari and Home Screen */}
        <link rel="apple-touch-icon" href="/images/favicons/apple-touch-icon.png" />
        
        {/* PWA Manifest for mobile app-like experience */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme colors for mobile browsers */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        
        {/* Mobile optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GuitarMagic" />
        
        {/* Preload critical favicon for performance */}
        <link rel="preload" href="/images/favicons/icon-192.png" as="image" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
