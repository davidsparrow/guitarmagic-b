/**
 * 🧪 Test Script for URL Tab ID Extraction
 * 
 * Tests the URL parsing functionality without requiring database connections
 * or Go tool access. This is a standalone validation script.
 */

import { extractTabIdFromUrl, extractTabIdAndTypeFromUrl } from './url_tab_id_processor.js'

/**
 * 🧪 Test URL parsing with various URL formats
 */
function testUrlParsing() {
  console.log('🧪 Testing URL Tab ID Extraction')
  console.log('=================================')
  console.log('')

  // Test cases with expected results
  const testCases = [
    {
      url: 'https://tabs.ultimate-guitar.com/tab/radiohead/creep-chords-4169',
      expected: '4169',
      description: 'Standard UG URL with chords'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/metallica/enter-sandman-tabs-8595',
      expected: '8595',
      description: 'Standard UG URL with tabs'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/thank-you-scientist/my-famed-disappearing-act-guitar-pro-5932688',
      expected: '5932688',
      description: 'Standard UG URL with guitar-pro'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/12345',
      expected: '12345',
      description: 'Direct tab access'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/artist/song-67890',
      expected: '67890',
      description: 'No type specified'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/artist/song?tab=11111',
      expected: '11111',
      description: 'Query parameter tab'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/artist/song#tab-22222',
      expected: '22222',
      description: 'URL fragment tab'
    },
    {
      url: 'https://www.ultimate-guitar.com/tab/artist/song-33333',
      expected: '33333',
      description: 'www subdomain'
    },
    {
      url: 'https://m.ultimate-guitar.com/tab/artist/song-44444',
      expected: '44444',
      description: 'Mobile subdomain'
    }
  ]

  // Invalid URL test cases
  const invalidTestCases = [
    {
      url: 'https://example.com/tab/artist/song-12345',
      description: 'Wrong domain'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/artist/song',
      description: 'No Tab ID in URL'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/artist/song-abc123',
      description: 'Non-numeric Tab ID'
    },
    {
      url: '',
      description: 'Empty URL'
    },
    {
      url: null,
      description: 'Null URL'
    },
    {
      url: 'not-a-url',
      description: 'Invalid URL format'
    }
  ]

  console.log('✅ Testing Valid URLs:')
  console.log('----------------------')
  
  let validTestsPassed = 0
  let validTestsTotal = testCases.length

  testCases.forEach((testCase, index) => {
    const result = extractTabIdFromUrl(testCase.url)
    const passed = result === testCase.expected
    
    if (passed) {
      validTestsPassed++
      console.log(`  ${index + 1}. ✅ PASS: ${testCase.description}`)
      console.log(`     URL: ${testCase.url}`)
      console.log(`     Expected: ${testCase.expected}, Got: ${result}`)
    } else {
      console.log(`  ${index + 1}. ❌ FAIL: ${testCase.description}`)
      console.log(`     URL: ${testCase.url}`)
      console.log(`     Expected: ${testCase.expected}, Got: ${result}`)
    }
    console.log('')
  })

  console.log('❌ Testing Invalid URLs:')
  console.log('------------------------')
  
  let invalidTestsPassed = 0
  let invalidTestsTotal = invalidTestCases.length

  invalidTestCases.forEach((testCase, index) => {
    const result = extractTabIdFromUrl(testCase.url)
    const passed = result === null // Invalid URLs should return null
    
    if (passed) {
      invalidTestsPassed++
      console.log(`  ${index + 1}. ✅ PASS: ${testCase.description}`)
      console.log(`     URL: ${testCase.url}`)
      console.log(`     Result: ${result} (correctly rejected)`)
    } else {
      console.log(`  ${index + 1}. ❌ FAIL: ${testCase.description}`)
      console.log(`     URL: ${testCase.url}`)
      console.log(`     Expected: null, Got: ${result}`)
    }
    console.log('')
  })

  // Summary
  console.log('📊 Test Results Summary')
  console.log('=======================')
  console.log(`Valid URL tests: ${validTestsPassed}/${validTestsTotal} passed`)
  console.log(`Invalid URL tests: ${invalidTestsPassed}/${invalidTestsTotal} passed`)
  console.log(`Total tests: ${validTestsPassed + invalidTestsPassed}/${validTestsTotal + invalidTestsTotal} passed`)
  
  if (validTestsPassed === validTestsTotal && invalidTestsPassed === invalidTestsTotal) {
    console.log('\n🎉 All tests passed! URL parsing is working correctly.')
  } else {
    console.log('\n⚠️ Some tests failed. Please review the URL parsing logic.')
  }
}

/**
 * 🧪 Test enhanced URL parsing with Tab ID and Song Type extraction
 */
function testEnhancedUrlParsing() {
  console.log('\n🧪 Testing Enhanced URL Tab ID + Song Type Extraction')
  console.log('=====================================================')
  console.log('')

  // Test cases with expected Tab ID and Song Type
  const enhancedTestCases = [
    {
      url: 'https://tabs.ultimate-guitar.com/tab/radiohead/creep-chords-4169',
      expectedTabId: '4169',
      expectedSongType: 'chords',
      description: 'Standard UG URL with chords'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/metallica/enter-sandman-tabs-8595',
      expectedTabId: '8595',
      expectedSongType: 'tabs',
      description: 'Standard UG URL with tabs'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/thank-you-scientist/my-famed-disappearing-act-guitar-pro-5932688',
      expectedTabId: '5932688',
      expectedSongType: 'guitar-pro',
      description: 'Standard UG URL with guitar-pro'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/12345',
      expectedTabId: '12345',
      expectedSongType: 'tab',
      description: 'Direct tab access (defaults to tab)'
    },
    {
      url: 'https://tabs.ultimate-guitar.com/tab/artist/song-67890',
      expectedTabId: '67890',
      expectedSongType: 'tab',
      description: 'No type specified (defaults to tab)'
    }
  ]

  console.log('✅ Testing Enhanced URL Parsing:')
  console.log('--------------------------------')
  
  let enhancedTestsPassed = 0
  let enhancedTestsTotal = enhancedTestCases.length

  enhancedTestCases.forEach((testCase, index) => {
    const result = extractTabIdAndTypeFromUrl(testCase.url)
    
    if (result && result.tabId === testCase.expectedTabId && result.songType === testCase.expectedSongType) {
      enhancedTestsPassed++
      console.log(`  ${index + 1}. ✅ PASS: ${testCase.description}`)
      console.log(`     URL: ${testCase.url}`)
      console.log(`     Expected: Tab ID ${testCase.expectedTabId}, Type ${testCase.expectedSongType}`)
      console.log(`     Got: Tab ID ${result.tabId}, Type ${result.songType}`)
    } else {
      console.log(`  ${index + 1}. ❌ FAIL: ${testCase.description}`)
      console.log(`     URL: ${testCase.url}`)
      console.log(`     Expected: Tab ID ${testCase.expectedTabId}, Type ${testCase.expectedSongType}`)
      console.log(`     Got: ${result ? `Tab ID ${result.tabId}, Type ${result.songType}` : 'null'}`)
    }
    console.log('')
  })

  // Summary for enhanced tests
  console.log('📊 Enhanced Test Results Summary')
  console.log('================================')
  console.log(`Enhanced URL tests: ${enhancedTestsPassed}/${enhancedTestsTotal} passed`)
  
  if (enhancedTestsPassed === enhancedTestsTotal) {
    console.log('🎉 All enhanced tests passed! Song type extraction is working correctly.')
  } else {
    console.log('⚠️ Some enhanced tests failed. Please review the song type extraction logic.')
  }
}

/**
 * 🎯 Main execution
 */
function main() {
  try {
    testUrlParsing()
    testEnhancedUrlParsing()
  } catch (error) {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
