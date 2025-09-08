/**
 * Assign ergonomic fingering for open-position chords.
 * Example (Am): frets [0,0,2,2,1,0] -> ["X","X","2","3","1","X"]
 *
 * @param {string[]} frets - Array of fret positions as strings (e.g., ['X','0','2','2','1','0'])
 * @param {string[]} initialFingering - Array of current fingering placeholders (mutated or used as base)
 * @returns {string[]} - Fingering array with assigned finger numbers or 'X'
 */
export function assignErgonomicFingering(frets, initialFingering) {
  const fingering = initialFingering.slice()

  const frettedIndices = []
  for (let i = 0; i < frets.length; i++) {
    if (frets[i] !== 'X' && frets[i] !== '0') frettedIndices.push(i)
  }

  if (frettedIndices.length === 0) return fingering

  const byFret = new Map()
  for (const idx of frettedIndices) {
    const fretNum = Number(frets[idx])
    if (!byFret.has(fretNum)) byFret.set(fretNum, [])
    byFret.get(fretNum).push(idx)
  }

  const uniqueFrets = Array.from(byFret.keys()).sort((a, b) => a - b)

  // Case: one lowest-fret note and at least two notes sharing the next higher fret (Am pattern)
  if (
    uniqueFrets.length >= 2 &&
    byFret.get(uniqueFrets[0]).length === 1 &&
    byFret.get(uniqueFrets[1]).length >= 2
  ) {
    const lowestIdx = byFret.get(uniqueFrets[0])[0]
    fingering[lowestIdx] = '1'

    const pair = byFret.get(uniqueFrets[1]).slice().sort((a, b) => a - b)
    if (pair[0] !== undefined) fingering[pair[0]] = '2'
    if (pair[1] !== undefined) fingering[pair[1]] = '3'

    let nextFinger = 4
    for (const fret of uniqueFrets.slice(2)) {
      for (const idx of byFret.get(fret)) {
        if (fingering[idx] === 'X') {
          fingering[idx] = nextFinger.toString()
          nextFinger = Math.min(nextFinger + 1, 4)
        }
      }
    }
    return fingering
  }

  // Fallback: assign by increasing fret, then by string index
  const sorted = frettedIndices.slice().sort((a, b) => {
    const fa = Number(frets[a]); const fb = Number(frets[b])
    if (fa !== fb) return fa - fb
    return a - b
  })
  let finger = 1
  for (const idx of sorted) {
    fingering[idx] = finger.toString()
    finger = Math.min(finger + 1, 4)
  }
  return fingering
}


