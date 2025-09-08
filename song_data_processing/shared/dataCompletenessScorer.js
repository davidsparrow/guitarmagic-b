/**
 * 🎯 Data Completeness Scorer - Shared Module
 * 
 * Calculates data completeness score (0-1 scale) and boolean flags based on extracted song data
 * Extracted from url_tab_id_processor.js for reuse across different processing workflows
 * 
 * @param {Object} songData - Extracted song data from UG
 * @returns {Object} Completeness score and boolean flags
 */
export function calculateDataCompletenessScore(songData) {
  let score = 0;
  
  // Basic info (20% of total score)
  if (songData.title && songData.artist) {
    score += 0.2;
  }
  
  // Song sections (30% of total score)
  if (songData.sections && songData.sections.length > 0) {
    const sectionScore = Math.min(0.3, (songData.sections.length / 10) * 0.3);
    score += sectionScore;
  }
  
  // Chord progressions (30% of total score)
  if (songData.chordProgressions && songData.chordProgressions.length > 0) {
    const chordScore = Math.min(0.3, (songData.chordProgressions.length / 50) * 0.3);
    score += chordScore;
  }
  
  // Timing data (20% of total score) - only count real timing data, not '0:00'
  if (songData.sections && songData.sections.some(section => 
    section.startTime && section.startTime.match(/^\d{1,2}:\d{2}$/) && section.startTime !== '0:00'
  )) {
    score += 0.2;
  }
  
  // Round to 2 decimal places for database storage
  const finalScore = Math.round(score * 100) / 100;
  
  // Calculate data availability flags (what we HAVE)
  const hasLyrics = songData.sections && songData.sections.some(section => 
    section.lyrics && section.lyrics.trim().length > 0
  ) || songData.chordProgressions && songData.chordProgressions.some(chord => 
    chord.lyrics && chord.lyrics.trim().length > 0
  );
  
  const hasChords = songData.chordProgressions && songData.chordProgressions.length > 0;
  
  const hasTabs = songData.sections && songData.sections.some(section => 
    section.tabContent && Object.keys(section.tabContent).length > 0
  );
  
  // Check for absolute timing data (MM:SS format)
  const hasAbsoluteTiming = songData.sections && songData.sections.some(section => 
    section.startTime && section.startTime.match(/^\d{1,2}:\d{2}$/) && section.startTime !== '0:00'
  );
  
  // 🎯 CRITICAL BOOLEAN FIELDS FOR UI READINESS
  
  // Data availability fields (what we HAVE)
  const hasTabCaptions = (songData.sections && songData.sections.length > 0) || 
                        (songData.chordProgressions && songData.chordProgressions.length > 0);
  
  // Timing need fields (what needs USER ASSISTANCE)
  const lyricsNeedTiming = hasLyrics && !hasAbsoluteTiming;
  const chordsNeedTiming = hasChords && !hasAbsoluteTiming;
  const tabsNeedTiming = hasTabs && !hasAbsoluteTiming;
  
  // Overall user assistance needed if ANY content needs timing
  const calculatedNeedsUserAssistance = lyricsNeedTiming || chordsNeedTiming || tabsNeedTiming;
  
  // 🎯 ADMIN-CONTROLLED CASCADE LOGIC FOR needs_user_assistance
  // admin_need_user_assistance defaults to true for new songs
  // Only use calculated logic when admin sets it to false
  const adminNeedUserAssistance = songData.admin_need_user_assistance !== false; // Default to true if not explicitly set to false
  
  // Final needs_user_assistance: admin-controlled if true, calculated if admin set to false
  const needsUserAssistance = adminNeedUserAssistance ? true : calculatedNeedsUserAssistance;
  
  // UI ready only if no user assistance is needed
  const isUiReady = hasTabCaptions && !needsUserAssistance;
  
  return {
    data_completeness_score: finalScore,
    has_lyric_captions: hasLyrics,
    has_chord_captions: hasChords,
    has_tab_captions: hasTabs,
    lyrics_need_timing: lyricsNeedTiming,
    chords_need_timing: chordsNeedTiming,
    tabs_need_timing: tabsNeedTiming,
    
    // 🎯 CRITICAL UI READINESS FIELDS
    needs_user_assistance: needsUserAssistance,
    admin_need_user_assistance: adminNeedUserAssistance,
    has_tab_captions: hasTabCaptions,
    is_ui_ready: isUiReady
  };
}
