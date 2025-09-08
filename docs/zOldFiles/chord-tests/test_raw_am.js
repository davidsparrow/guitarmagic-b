/**
 * 🧪 Raw Test: What does generateChordData('Am') actually return?
 */

const { generateChordData } = require('../utils/chordData.js')

console.log('🎸 Raw Test: generateChordData("Am") output\n')

const amData = generateChordData('Am')

if (amData) {
  console.log('✅ SUCCESS - Am data generated:')
  console.log('Name:', amData.name)
  console.log('Type:', amData.type)
  console.log('Root:', amData.root)
  console.log('Strings:', JSON.stringify(amData.strings))
  console.log('Frets:', JSON.stringify(amData.frets))
  console.log('Fingering:', JSON.stringify(amData.fingering))
  console.log('Metadata:', amData.metadata)
} else {
  console.log('❌ FAILED - No Am data generated')
}

console.log('\n🎯 Expected Am chord:')
console.log('Strings: ["E","A","D","G","B","E"] (Low E → High E)')
console.log('Frets: ["X","0","2","2","1","0"]')
console.log('Fingering: ["X","X","2","3","1","X"]')
