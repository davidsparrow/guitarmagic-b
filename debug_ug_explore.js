// Debug script to examine the actual HTML content from UG explore page
import { scanUGExplorePage } from './utils/ugExplorePageScanner.js'

console.log('🔍 Debugging UG Explore Page HTML Content...')
console.log('=' .repeat(60))

// First, let's see what the scanner returns
scanUGExplorePage('https://www.ultimate-guitar.com/explore?order=hitstotal_desc&type[]=Pro')
  .then(results => {
    console.log('📊 SCANNER RESULTS:')
    console.log('=' .repeat(50))
    console.log(JSON.stringify(results, null, 2))
    
    // Now let's examine the raw HTML by looking at the response
    console.log('\n🔍 ANALYZING RESPONSE STRUCTURE:')
    console.log('=' .repeat(50))
    
    if (results.rawHtml) {
      console.log(`📄 Raw HTML length: ${results.rawHtml.length} bytes`)
      
      // Look for common patterns that might contain song data
      console.log('\n🔍 SEARCHING FOR SONG DATA PATTERNS:')
      console.log('=' .repeat(50))
      
      // Look for js-store divs (like in your existing scraper)
      const jsStorePattern = /<div class="js-store" data-content="(.+?)"><\/div>/g
      const jsStoreMatches = results.rawHtml.match(jsStorePattern)
      console.log(`🎯 js-store divs found: ${jsStoreMatches ? jsStoreMatches.length : 0}`)
      
      if (jsStoreMatches && jsStoreMatches.length > 0) {
        console.log('✅ Found js-store divs! This is good news.')
        console.log('📋 First js-store content (first 200 chars):')
        console.log(jsStoreMatches[0].substring(0, 200))
      }
      
      // Look for any links containing 'tab'
      const tabLinkPattern = /href=["']([^"']*tab[^"']*)["']/gi
      const tabLinks = results.rawHtml.match(tabLinkPattern)
      console.log(`🔗 Links containing 'tab': ${tabLinks ? tabLinks.length : 0}`)
      
      if (tabLinks && tabLinks.length > 0) {
        console.log('📋 Sample tab links:')
        tabLinks.slice(0, 5).forEach((link, i) => {
          console.log(`  ${i + 1}. ${link}`)
        })
      }
      
      // Look for any URLs in the HTML
      const urlPattern = /https?:\/\/[^\s"<>]+/g
      const urls = results.rawHtml.match(urlPattern)
      console.log(`🌐 Total URLs found: ${urls ? urls.length : 0}`)
      
      if (urls && urls.length > 0) {
        console.log('📋 Sample URLs:')
        urls.slice(0, 10).forEach((url, i) => {
          console.log(`  ${i + 1}. ${url}`)
        })
      }
      
      // Show first 1000 characters of HTML to see structure
      console.log('\n🔍 FIRST 1000 CHARACTERS OF HTML:')
      console.log('=' .repeat(60))
      console.log(results.rawHtml.substring(0, 1000))
      console.log('=' .repeat(60))
      
    } else {
      console.log('⚠️ No raw HTML found in results')
      console.log('Available keys:', Object.keys(results))
    }
    
  })
  .catch(error => {
    console.error('❌ Debug failed:', error.message)
    console.error('Stack trace:', error.stack)
  })
