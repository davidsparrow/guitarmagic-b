// scripts/migrate-chord-data.js
import { supabase } from '../lib/supabase.js'

/**
 * Migration script to create chord_variations and chord_positions records
 * based on existing chord_captions data for a specific video
 */

// Sample data from your console logs (replace with actual data)
const chordCaptionData = [
  { chord_name: 'D#', fret_position: 'Pos2', start_time: '0:09', end_time: '0:19' },
  { chord_name: 'D#', fret_position: 'Open', start_time: '0:09', end_time: '0:19' },
  { chord_name: 'C', fret_position: 'Open', start_time: '0:21', end_time: '1:19' },
  { chord_name: 'F7sus4', fret_position: 'Pos6', start_time: '0:29', end_time: '1:19' },
  { chord_name: 'D', fret_position: 'Open', start_time: '1:09', end_time: '2:19' },
  { chord_name: 'F7sus4', fret_position: 'Pos6', start_time: '3:09', end_time: '3:19' },
  { chord_name: 'D', fret_position: 'Open', start_time: '3:09', end_time: '3:19' },
  { chord_name: 'A', fret_position: 'Pos1', start_time: '4:22', end_time: '4:32' },
  { chord_name: 'A#', fret_position: 'Pos3v2', start_time: '4:24', end_time: '4:34' }
]

async function migrateChordData() {
  try {
    console.log('🚀 Starting chord data migration...')
    
    // Step 1: Get unique chord names (variations)
    const uniqueChordNames = [...new Set(chordCaptionData.map(item => item.chord_name))]
    console.log('�� Unique chord names:', uniqueChordNames)
    
    // Step 2: Create or find chord_variations
    const chordVariations = {}
    
    for (const chordName of uniqueChordNames) {
      console.log(`🔍 Processing chord variation: ${chordName}`)
      
      // Check if chord_variation already exists
      const { data: existingVariation, error: checkError } = await supabase
        .from('chord_variations')
        .select('id')
        .eq('chord_name', chordName)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }
      
      let variationId
      if (existingVariation) {
        console.log(`✅ Found existing chord_variation: ${chordName}`)
        variationId = existingVariation.id
      } else {
        // Create new chord_variation
        const { data: newVariation, error: createError } = await supabase
          .from('chord_variations')
          .insert([{ chord_name: chordName }])
          .select()
          .single()
        
        if (createError) throw createError
        
        console.log(`✅ Created new chord_variation: ${chordName}`)
        variationId = newVariation.id
      }
      
      chordVariations[chordName] = variationId
    }
    
    // Step 3: Create chord_positions for each unique chord_name + fret_position combination
    const uniqueChordPositions = [...new Set(chordCaptionData.map(item => 
      `${item.chord_name}-${item.fret_position}`
    ))]
    
    console.log('📝 Unique chord positions:', uniqueChordPositions)
    
    for (const chordPosition of uniqueChordPositions) {
      const [chordName, fretPosition] = chordPosition.split('-')
      const variationId = chordVariations[chordName]
      
      console.log(`🔍 Processing chord position: ${chordName} - ${fretPosition}`)
      
      // Check if chord_position already exists
      const { data: existingPosition, error: checkError } = await supabase
        .from('chord_positions')
        .select('id')
        .eq('chord_name', chordName)
        .eq('fret_position', fretPosition)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }
      
      if (existingPosition) {
        console.log(`✅ Found existing chord_position: ${chordName} - ${fretPosition}`)
      } else {
        // Create new chord_position
        const chordPositionFullName = `${chordName}-${fretPosition}`
        
        const { data: newPosition, error: createError } = await supabase
          .from('chord_positions')
          .insert([{
            chord_variation_id: variationId,
            chord_name: chordName,
            fret_position: fretPosition,
            chord_position_full_name: chordPositionFullName,
            // Add placeholder URLs (you can update these later)
            aws_svg_url_light: `https://example.com/svg/${chordPositionFullName}-light.svg`,
            aws_svg_url_dark: `https://example.com/svg/${chordPositionFullName}-dark.svg`
          }])
          .select()
          .single()
        
        if (createError) throw createError
        
        console.log(`✅ Created new chord_position: ${chordPositionFullName}`)
      }
    }
    
    console.log('🎉 Migration completed successfully!')
    
    // Step 4: Verify the results
    const { data: variations } = await supabase
      .from('chord_variations')
      .select('*')
      .order('chord_name')
    
    const { data: positions } = await supabase
      .from('chord_positions')
      .select('*')
      .order('chord_name, fret_position')
    
    console.log('📊 Final Results:')
    console.log(`- Chord Variations: ${variations.length}`)
    console.log(`- Chord Positions: ${positions.length}`)
    
    console.log('🎸 Chord Variations:')
    variations.forEach(v => console.log(`  - ${v.chord_name}`))
    
    console.log('🎸 Chord Positions:')
    positions.forEach(p => console.log(`  - ${p.chord_position_full_name}`))
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run the migration
migrateChordData()