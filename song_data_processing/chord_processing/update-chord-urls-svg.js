// scripts/update-chord-urls-svg.js
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Script to update existing chord_positions records with correct AWS S3 URLs using .svg extension
 */

async function updateChordUrlsToSvg() {
  try {
    console.log('🚀 Updating chord position URLs to use .svg extension...')
    
    // Get all chord_positions records
    const { data: positions, error: fetchError } = await supabase
      .from('chord_positions')
      .select('id, chord_position_full_name, aws_svg_url_light, aws_svg_url_dark')
    
    if (fetchError) throw fetchError
    
    console.log(`📝 Found ${positions.length} chord positions to update`)
    
    let updatedCount = 0
    
    for (const position of positions) {
      if (!position.chord_position_full_name) {
        console.log(`⚠️ Skipping position ${position.id} - no chord_position_full_name`)
        continue
      }
      
      // URL encode the chord position name to handle special characters like #, b, etc.
      const encodedChordName = encodeURIComponent(position.chord_position_full_name)
      const newLightUrl = `https://guitarmagic-chord-library.s3.us-west-2.amazonaws.com/${encodedChordName}_light.svg`
      const newDarkUrl = `https://guitarmagic-chord-library.s3.us-west-2.amazonaws.com/${encodedChordName}_dark.svg`
      
      // Update the record
      const { error: updateError } = await supabase
        .from('chord_positions')
        .update({
          aws_svg_url_light: newLightUrl,
          aws_svg_url_dark: newDarkUrl
        })
        .eq('id', position.id)
      
      if (updateError) {
        console.error(`❌ Failed to update ${position.chord_position_full_name}:`, updateError)
      } else {
        console.log(`✅ Updated ${position.chord_position_full_name}`)
        console.log(`   Original: ${position.chord_position_full_name}`)
        console.log(`   Encoded: ${encodedChordName}`)
        console.log(`   Light: ${newLightUrl}`)
        console.log(`   Dark: ${newDarkUrl}`)
        updatedCount++
      }
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} chord positions to use .svg extension!`)
    
  } catch (error) {
    console.error('❌ Update failed:', error)
  }
}

// Run the update
updateChordUrlsToSvg()
