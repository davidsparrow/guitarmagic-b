/**
 * 🎯 Boolean Flag Calculator - Shared Module
 * 
 * Calculates boolean flags for UI display readiness and timing assistance requirements
 * Extracted from url_tab_id_processor.js for reuse across different processing workflows
 * 
 * @param {Object} songData - Extracted song data from UG
 * @returns {Object} Boolean flags for each content type
 */

/**
 * Calculate boolean fields for UI display readiness
 * Determines which rows can be populated with content
 * 
 * @param {Object} songData - Extracted song data from UG
 * @returns {Object} Boolean flags for each content type
 */
export function calculateContentAvailabilityFlags(songData) {
  // Check if lyrics exist (either in sections or chord progressions)
  const hasLyrics = songData.sections && songData.sections.some(section => 
    section.lyrics && section.lyrics.trim().length > 0
  ) || songData.chordProgressions && songData.chordProgressions.some(chord => 
    chord.lyrics && chord.lyrics.trim().length > 0
  );

  // Check if chord progressions exist
  const hasChords = songData.chordProgressions && songData.chordProgressions.length > 0;

  // Check if tab content exists (basic check for now)
  const hasTabs = songData.sections && songData.sections.some(section => 
    section.tabContent && Object.keys(section.tabContent).length > 0
  );

  return {
    has_lyric_captions: hasLyrics,
    has_chord_captions: hasChords,
    has_tab_captions: hasTabs
  };
}

/**
 * Calculate timing assistance requirements for each content type
 * Determines which rows need user assistance for timing
 * 
 * @param {Object} songData - Extracted song data from UG
 * @returns {Object} Boolean flags for timing assistance needs
 */
export function calculateTimingAssistanceFlags(songData) {
  // Check if lyrics need timing (exist but no absolute timing)
  const lyricsNeedTiming = songData.sections && songData.sections.some(section => 
    section.lyrics && section.lyrics.trim().length > 0
  ) && !songData.sections.some(section => 
    section.startTime && section.startTime.match(/^\d{1,2}:\d{2}$/) && section.startTime !== '0:00'
  );

  // Check if chords need timing (exist but no absolute timing)
  const chordsNeedTiming = songData.chordProgressions && songData.chordProgressions.length > 0 && 
    !songData.chordProgressions.some(chord => 
      chord.startTime && chord.startTime.match(/^\d{1,2}:\d{2}$/) && chord.startTime !== '0:00'
    );

  // Check if tabs need timing (exist but no absolute timing)
  const tabsNeedTiming = songData.sections && songData.sections.some(section => 
    section.tabContent && Object.keys(section.tabContent).length > 0
  ) && !songData.sections.some(section => 
    section.startTime && section.startTime.match(/^\d{1,2}:\d{2}$/) && section.startTime !== '0:00'
  );

  return {
    lyrics_need_timing: lyricsNeedTiming,
    chords_need_timing: chordsNeedTiming,
    tabs_need_timing: tabsNeedTiming
  };
}
