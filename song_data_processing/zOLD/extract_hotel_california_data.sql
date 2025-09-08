-- 🎸 Extract Hotel California Data from Supabase
-- This will show you exactly what data is being stored

-- Get the main song record
SELECT 
    id,
    title,
    artist,
    ug_tab_id,
    data_completeness_score,
    has_lyric_captions,
    has_chord_captions,
    has_tab_captions,
    lyrics_need_timing,
    chords_need_timing,
    tabs_need_timing,
    created_at
FROM songs 
WHERE ug_tab_id = 46190;

-- Get all song sections
SELECT 
    section_name,
    section_type,
    section_label,
    start_time,
    end_time,
    repeat_count,
    performance_notes,
    tab_content,
    chord_progression
FROM song_sections 
WHERE song_id = (
    SELECT id FROM songs WHERE ug_tab_id = 46190
)
ORDER BY sequence_order;

-- Get song attributes
SELECT 
    type,
    sequence_order,
    data
FROM song_attributes 
WHERE song_id = (
    SELECT id FROM songs WHERE ug_tab_id = 46190
)
ORDER BY sequence_order;
