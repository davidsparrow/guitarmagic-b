import fs from 'fs'
import path from 'path'

// Email extraction function (same as in songDataServiceUG.js)
const extractEmailFromHTML = (htmlContent) => {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const emailMatch = htmlContent.match(emailRegex)
  return emailMatch ? emailMatch[0] : null
}

// Test email extraction on existing raw HTML files
const testEmailExtraction = () => {
  console.log('🧪 Testing Email Extraction from Raw HTML Files')
  console.log('===============================================')
  
  const rawHtmlDir = path.join(process.cwd(), 'song_raw_html')
  
  if (!fs.existsSync(rawHtmlDir)) {
    console.log('❌ song_raw_html directory not found')
    return
  }
  
  const files = fs.readdirSync(rawHtmlDir).filter(file => file.endsWith('.html'))
  
  console.log(`📁 Found ${files.length} HTML files to test`)
  console.log('')
  
  files.forEach((file, index) => {
    const filePath = path.join(rawHtmlDir, file)
    const htmlContent = fs.readFileSync(filePath, 'utf8')
    
    console.log(`${index + 1}. Testing: ${file}`)
    
    // Extract email
    const email = extractEmailFromHTML(htmlContent)
    
    if (email) {
      console.log(`   ✅ Found email: ${email}`)
    } else {
      console.log(`   ❌ No email found`)
    }
    
    // Also check for incomplete emails (like manu15paramo@)
    const incompleteEmailMatch = htmlContent.match(/\b[A-Za-z0-9._%+-]+@\b/)
    if (incompleteEmailMatch) {
      console.log(`   ⚠️  Found incomplete email: ${incompleteEmailMatch[0]}`)
    }
    
    console.log('')
  })
}

testEmailExtraction()
