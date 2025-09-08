-- 🧹 Clean up Hotel California duplicate records
-- Keep the newer complete record, delete the old placeholder

-- Delete the old placeholder record (Song 46190 / Unknown Artist)
DELETE FROM songs 
WHERE ug_tab_id = 46190 
AND title = 'Song 46190' 
AND artist = 'Unknown Artist';

-- Verify only one record remains
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
