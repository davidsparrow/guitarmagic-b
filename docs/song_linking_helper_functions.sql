-- 🎸 SONG LINKING - PART 2: Core Helper Functions
-- This script contains all the SQL helper functions for sync group management,
-- song linking, and video-to-song operations
-- 
-- IMPORTANT: Run this AFTER running song_linking_database_updates.sql
-- Run in Supabase SQL Editor

-- =====================================================
-- PART 1: Sync Group Management Functions
-- =====================================================

-- Function to create a new chord sync group
-- This groups related chord captions together for synchronized display
CREATE OR REPLACE FUNCTION create_chord_sync_group(
    p_favorite_id UUID,
    p_user_id UUID,
    p_group_color TEXT DEFAULT '#3B82F6' -- Default blue color
)
RETURNS UUID AS $$
DECLARE
    v_group_id UUID;
BEGIN
    -- Validate inputs
    IF p_favorite_id IS NULL THEN
        RAISE EXCEPTION 'favorite_id cannot be null';
    END IF;
    
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'user_id cannot be null';
    END IF;
    
    -- Validate that the favorite exists and belongs to the user
    IF NOT EXISTS (
        SELECT 1 FROM favorites 
        WHERE id = p_favorite_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Favorite not found or access denied';
    END IF;
    
    -- Create the sync group
    INSERT INTO chord_sync_groups (
        favorite_id,
        user_id,
        group_color
    ) VALUES (
        p_favorite_id,
        p_user_id,
        p_group_color
    ) RETURNING id INTO v_group_id;
    
    RETURN v_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a chord caption to a sync group
-- This links individual chord captions to their sync group
CREATE OR REPLACE FUNCTION add_chord_to_sync_group(
    p_chord_caption_id UUID,
    p_sync_group_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_favorite_id UUID;
    v_group_favorite_id UUID;
BEGIN
    -- Validate inputs
    IF p_chord_caption_id IS NULL OR p_sync_group_id IS NULL OR p_user_id IS NULL THEN
        RAISE EXCEPTION 'All parameters must be provided';
    END IF;
    
    -- Get the favorite_id for the chord caption
    SELECT favorite_id INTO v_favorite_id
    FROM chord_captions
    WHERE id = p_chord_caption_id AND user_id = p_user_id;
    
    IF v_favorite_id IS NULL THEN
        RAISE EXCEPTION 'Chord caption not found or access denied';
    END IF;
    
    -- Get the favorite_id for the sync group
    SELECT favorite_id INTO v_group_favorite_id
    FROM chord_sync_groups
    WHERE id = p_sync_group_id AND user_id = p_user_id;
    
    IF v_group_favorite_id IS NULL THEN
        RAISE EXCEPTION 'Sync group not found or access denied';
    END IF;
    
    -- Ensure both belong to the same favorite
    IF v_favorite_id != v_group_favorite_id THEN
        RAISE EXCEPTION 'Chord caption and sync group must belong to the same favorite';
    END IF;
    
    -- Update the chord caption to link it to the sync group
    UPDATE chord_captions
    SET sync_group_id = p_sync_group_id,
        updated_at = NOW()
    WHERE id = p_chord_caption_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get chord captions with their sync group information
-- This provides a complete view of chords and their grouping
CREATE OR REPLACE FUNCTION get_chord_captions_with_groups(
    p_favorite_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    chord_id UUID,
    chord_name TEXT,
    start_time TEXT,
    end_time TEXT,
    chord_data JSONB,
    display_order INTEGER,
    serial_number INTEGER,
    sync_group_id UUID,
    group_color TEXT,
    is_master BOOLEAN
) AS $$
BEGIN
    -- Validate inputs
    IF p_favorite_id IS NULL OR p_user_id IS NULL THEN
        RAISE EXCEPTION 'Both favorite_id and user_id must be provided';
    END IF;
    
    -- Validate access to the favorite
    IF NOT EXISTS (
        SELECT 1 FROM favorites 
        WHERE id = p_favorite_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Favorite not found or access denied';
    END IF;
    
    -- Return chord captions with sync group information
    RETURN QUERY
    SELECT 
        cc.id as chord_id,
        cc.chord_name,
        cc.start_time,
        cc.end_time,
        cc.chord_data,
        cc.display_order,
        cc.serial_number,
        cc.sync_group_id,
        csg.group_color,
        cc.is_master
    FROM chord_captions cc
    LEFT JOIN chord_sync_groups csg ON cc.sync_group_id = csg.id
    WHERE cc.favorite_id = p_favorite_id
    ORDER BY cc.display_order, cc.serial_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 2: Song Linking Functions
-- =====================================================

-- Function to link a favorite video to a UG song
-- This creates the connection between user videos and song data
CREATE OR REPLACE FUNCTION link_video_to_song(
    p_favorite_id UUID,
    p_song_id UUID,
    p_user_id UUID,
    p_expected_duration_seconds INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_favorite_exists BOOLEAN;
    v_song_exists BOOLEAN;
    v_video_duration INTEGER;
    v_song_duration INTEGER;
    v_duration_diff INTEGER;
BEGIN
    -- Validate inputs
    IF p_favorite_id IS NULL OR p_song_id IS NULL OR p_user_id IS NULL THEN
        RAISE EXCEPTION 'All parameters must be provided';
    END IF;
    
    -- Check if favorite exists and belongs to user
    SELECT EXISTS(
        SELECT 1 FROM favorites 
        WHERE id = p_favorite_id AND user_id = p_user_id
    ) INTO v_favorite_exists;
    
    IF NOT v_favorite_exists THEN
        RAISE EXCEPTION 'Favorite not found or access denied';
    END IF;
    
    -- Check if song exists
    SELECT EXISTS(
        SELECT 1 FROM songs WHERE id = p_song_id
    ) INTO v_song_exists;
    
    IF NOT v_song_exists THEN
        RAISE EXCEPTION 'Song not found';
    END IF;
    
    -- Get video duration from favorites
    SELECT video_duration_seconds INTO v_video_duration
    FROM favorites WHERE id = p_favorite_id;
    
    -- Get song duration from song_sections (if available)
    SELECT COALESCE(
        MAX(CAST(duration_seconds AS INTEGER)), 
        p_expected_duration_seconds
    ) INTO v_song_duration
    FROM song_sections 
    WHERE song_id = p_song_id;
    
    -- Calculate duration difference for validation
    IF v_video_duration IS NOT NULL AND v_song_duration IS NOT NULL THEN
        v_duration_diff := ABS(v_video_duration - v_song_duration);
        
        -- Warn if duration difference is significant (>30 seconds)
        IF v_duration_diff > 30 THEN
            RAISE WARNING 'Video duration (% seconds) differs significantly from song duration (% seconds). Difference: % seconds', 
                v_video_duration, v_song_duration, v_duration_diff;
        END IF;
    END IF;
    
    -- Update the favorite to link it to the song
    UPDATE favorites
    SET uuid_song = p_song_id,
        updated_at = NOW()
    WHERE id = p_favorite_id;
    
    -- Create a mapping entry for easy discovery
    INSERT INTO video_song_mappings (
        song_id,
        song_name_variation,
        artist_name_variation,
        expected_video_duration_seconds,
        mapping_type,
        created_by
    ) VALUES (
        p_song_id,
        (SELECT title FROM songs WHERE id = p_song_id),
        (SELECT artist FROM songs WHERE id = p_song_id),
        v_song_duration,
        'user_created',
        p_user_id
    )
    ON CONFLICT (song_id, song_name_variation, artist_name_variation) 
    DO NOTHING; -- Don't duplicate existing mappings
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find songs by multiple name variations
-- This helps users discover songs even with partial or different names
CREATE OR REPLACE FUNCTION find_song_variations(
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    song_id UUID,
    song_title CHARACTER VARYING,
    artist_name CHARACTER VARYING,
    ug_tab_id BIGINT,
    instrument_type CHARACTER VARYING,
    tuning CHARACTER VARYING,
    difficulty CHARACTER VARYING,
    genre CHARACTER VARYING,
    year INTEGER,
    match_score DECIMAL(3,2),
    match_type TEXT
) AS $$
DECLARE
    v_search_pattern TEXT;
BEGIN
    -- Validate inputs
    IF p_search_term IS NULL OR LENGTH(TRIM(p_search_term)) < 2 THEN
        RAISE EXCEPTION 'Search term must be at least 2 characters';
    END IF;
    
    IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
        p_limit := 10;
    END IF;
    
    -- Create search pattern for partial matching
    v_search_pattern := '%' || LOWER(TRIM(p_search_term)) || '%';
    
    -- Return songs matching the search term
    RETURN QUERY
    SELECT 
        s.id as song_id,
        s.title as song_title,
        s.artist as artist_name,
        s.ug_tab_id,
        s.instrument_type,
        s.tuning,
        s.difficulty,
        s.genre,
        s.year,
        -- Calculate match score based on how well the search term matches
        CASE 
            WHEN LOWER(s.title) = LOWER(p_search_term) THEN 1.00
            WHEN LOWER(s.title) LIKE LOWER(p_search_term) || '%' THEN 0.95
            WHEN LOWER(s.title) LIKE '%' || LOWER(p_search_term) || '%' THEN 0.90
            WHEN LOWER(s.artist) = LOWER(p_search_term) THEN 0.85
            WHEN LOWER(s.artist) LIKE LOWER(p_search_term) || '%' THEN 0.80
            WHEN LOWER(s.artist) LIKE '%' || LOWER(p_search_term) || '%' THEN 0.75
            ELSE 0.50
        END as match_score,
        -- Indicate what matched
        CASE 
            WHEN LOWER(s.title) = LOWER(p_search_term) THEN 'exact_title'
            WHEN LOWER(s.title) LIKE LOWER(p_search_term) || '%' THEN 'title_starts_with'
            WHEN LOWER(s.title) LIKE '%' || LOWER(p_search_term) || '%' THEN 'title_contains'
            WHEN LOWER(s.artist) = LOWER(p_search_term) THEN 'exact_artist'
            WHEN LOWER(s.artist) LIKE LOWER(p_search_term) || '%' THEN 'artist_starts_with'
            WHEN LOWER(s.artist) LIKE '%' || LOWER(p_search_term) || '%' THEN 'artist_contains'
            ELSE 'partial_match'
        END as match_type
    FROM songs s
    WHERE 
        LOWER(s.title) LIKE v_search_pattern OR
        LOWER(s.artist) LIKE v_search_pattern OR
        LOWER(s.album) LIKE v_search_pattern OR
        LOWER(s.genre) LIKE v_search_pattern
    ORDER BY match_score DESC, s.title, s.artist
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 3: Advanced Helper Functions
-- =====================================================

-- Function to validate if video length matches song metadata
-- This helps ensure tab captions will be in sync with the video
CREATE OR REPLACE FUNCTION validate_video_song_sync(
    p_favorite_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    is_synced BOOLEAN,
    video_duration INTEGER,
    song_duration INTEGER,
    duration_difference INTEGER,
    sync_quality TEXT,
    recommendations TEXT[]
) AS $$
DECLARE
    v_song_id UUID;
    v_video_duration INTEGER;
    v_song_duration INTEGER;
    v_duration_diff INTEGER;
    v_sync_quality TEXT;
    v_recommendations TEXT[];
BEGIN
    -- Validate inputs
    IF p_favorite_id IS NULL OR p_user_id IS NULL THEN
        RAISE EXCEPTION 'Both favorite_id and user_id must be provided';
    END IF;
    
    -- Get the linked song ID
    SELECT uuid_song INTO v_song_id
    FROM favorites 
    WHERE id = p_favorite_id AND user_id = p_user_id;
    
    IF v_song_id IS NULL THEN
        RETURN QUERY SELECT 
            FALSE as is_synced,
            NULL as video_duration,
            NULL as song_duration,
            NULL as duration_difference,
            'no_song_linked' as sync_quality,
            ARRAY['Link this video to a song first'] as recommendations;
        RETURN;
    END IF;
    
    -- Get video duration
    SELECT video_duration_seconds INTO v_video_duration
    FROM favorites WHERE id = p_favorite_id;
    
    -- Get song duration from song sections
    SELECT COALESCE(MAX(CAST(duration_seconds AS INTEGER)), 0) INTO v_song_duration
    FROM song_sections 
    WHERE song_id = v_song_id;
    
    -- Calculate duration difference
    IF v_video_duration IS NOT NULL AND v_song_duration > 0 THEN
        v_duration_diff := ABS(v_video_duration - v_song_duration);
        
        -- Determine sync quality
        IF v_duration_diff <= 5 THEN
            v_sync_quality := 'excellent';
            v_recommendations := ARRAY['Perfect sync! Tab captions will align perfectly with video'];
        ELSIF v_duration_diff <= 15 THEN
            v_sync_quality := 'good';
            v_recommendations := ARRAY['Good sync', 'Minor timing adjustments may be needed'];
        ELSIF v_duration_diff <= 30 THEN
            v_sync_quality := 'fair';
            v_recommendations := ARRAY['Fair sync', 'Consider manual timing adjustments', 'Check if this is a cover version'];
        ELSE
            v_sync_quality := 'poor';
            v_recommendations := ARRAY['Poor sync detected', 'This may be a cover or remix', 'Manual timing required', 'Consider finding a different version'];
        END IF;
        
        RETURN QUERY SELECT 
            v_duration_diff <= 30 as is_synced,
            v_video_duration as video_duration,
            v_song_duration as song_duration,
            v_duration_diff as duration_difference,
            v_sync_quality as sync_quality,
            v_recommendations as recommendations;
    ELSE
        RETURN QUERY SELECT 
            FALSE as is_synced,
            v_video_duration as video_duration,
            v_song_duration as song_duration,
            NULL as duration_difference,
            'insufficient_data' as sync_quality,
            ARRAY['Video or song duration not available', 'Cannot determine sync quality'] as recommendations;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get complete song data for a video
-- This provides all the information needed for tab caption generation
CREATE OR REPLACE FUNCTION get_song_data_for_video(
    p_favorite_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    song_id UUID,
    song_title TEXT,
    artist_name TEXT,
    ug_tab_id BIGINT,
    instrument_type TEXT,
    tuning TEXT,
    key_signature TEXT,
    tempo INTEGER,
    time_signature TEXT,
    difficulty TEXT,
    genre TEXT,
    year INTEGER,
    album TEXT,
    tabbed_by TEXT,
    sections_count INTEGER,
    chord_progressions_count INTEGER,
    total_duration_seconds INTEGER,
    has_timing_data BOOLEAN
) AS $$
DECLARE
    v_song_id UUID;
BEGIN
    -- Validate inputs
    IF p_favorite_id IS NULL OR p_user_id IS NULL THEN
        RAISE EXCEPTION 'Both favorite_id and user_id must be provided';
    END IF;
    
    -- Get the linked song ID
    SELECT uuid_song INTO v_song_id
    FROM favorites 
    WHERE id = p_favorite_id AND user_id = p_user_id;
    
    IF v_song_id IS NULL THEN
        RAISE EXCEPTION 'No song linked to this video';
    END IF;
    
    -- Return comprehensive song data
    RETURN QUERY
    SELECT 
        s.id as song_id,
        s.title as song_title,
        s.artist as artist_name,
        s.ug_tab_id,
        s.instrument_type,
        s.tuning,
        s.key_signature,
        s.tempo,
        s.time_signature,
        s.difficulty,
        s.genre,
        s.year,
        s.album,
        s.tabbed_by,
        -- Count sections
        (SELECT COUNT(*) FROM song_sections WHERE song_id = s.id) as sections_count,
        -- Count chord progressions
        (SELECT COUNT(*) FROM song_chord_progressions WHERE song_id = s.id) as chord_progressions_count,
        -- Calculate total duration
        (SELECT COALESCE(MAX(CAST(duration_seconds AS INTEGER)), 0) FROM song_sections WHERE song_id = s.id) as total_duration_seconds,
        -- Check if timing data exists
        (SELECT EXISTS(
            SELECT 1 FROM song_sections 
            WHERE song_id = s.id AND start_time IS NOT NULL
        )) as has_timing_data
    FROM songs s
    WHERE s.id = v_song_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 4: Utility Functions
-- =====================================================

-- Function to create a tab caption request
-- This handles user requests for new song tabs
CREATE OR REPLACE FUNCTION create_tab_caption_request(
    p_user_id UUID,
    p_song_title TEXT,
    p_artist_name TEXT,
    p_video_url TEXT,
    p_video_duration_seconds INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
BEGIN
    -- Validate inputs
    IF p_user_id IS NULL OR p_song_title IS NULL OR p_artist_name IS NULL OR p_video_url IS NULL THEN
        RAISE EXCEPTION 'All required parameters must be provided';
    END IF;
    
    -- Check if song already exists
    IF EXISTS (
        SELECT 1 FROM songs 
        WHERE LOWER(title) = LOWER(p_song_title) 
        AND LOWER(artist) = LOWER(p_artist_name)
    ) THEN
        RAISE EXCEPTION 'Song already exists in database';
    END IF;
    
    -- For now, we'll create a placeholder in song_attributes
    -- In a full implementation, this would go to a dedicated requests table
    INSERT INTO song_attributes (
        song_id,
        type,
        data,
        section_label,
        section_type
    ) VALUES (
        gen_random_uuid(), -- Temporary song ID
        'metadata',
        jsonb_build_object(
            'request_type', 'tab_caption',
            'user_id', p_user_id,
            'song_title', p_song_title,
            'artist_name', p_artist_name,
            'video_url', p_video_url,
            'video_duration_seconds', p_video_duration_seconds,
            'notes', p_notes,
            'status', 'pending',
            'created_at', NOW()
        ),
        'Tab Caption Request',
        'request'
    ) RETURNING id INTO v_request_id;
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 5: Testing and Verification
-- =====================================================

-- Function to test all helper functions
-- This helps verify everything is working correctly
CREATE OR REPLACE FUNCTION test_song_linking_functions()
RETURNS TABLE (
    function_name TEXT,
    test_result TEXT,
    error_message TEXT
) AS $$
DECLARE
    v_test_favorite_id UUID;
    v_test_song_id UUID;
    v_test_user_id UUID;
    v_result TEXT;
    v_error TEXT;
BEGIN
    -- Get a test user (first user in the system)
    SELECT id INTO v_test_user_id FROM auth.users LIMIT 1;
    
    IF v_test_user_id IS NULL THEN
        RETURN QUERY SELECT 
            'setup' as function_name,
            'skipped' as test_result,
            'No users found in system' as error_message;
        RETURN;
    END IF;
    
    -- Get a test favorite (first favorite for the test user)
    SELECT id INTO v_test_favorite_id 
    FROM favorites 
    WHERE user_id = v_test_user_id 
    LIMIT 1;
    
    -- Get a test song (first song in the system)
    SELECT id INTO v_test_song_id FROM songs LIMIT 1;
    
    -- Test find_song_variations
    BEGIN
        PERFORM find_song_variations('test', 5);
        v_result := 'passed';
        v_error := NULL;
    EXCEPTION WHEN OTHERS THEN
        v_result := 'failed';
        v_error := SQLERRM;
    END;
    
    RETURN QUERY SELECT 
        'find_song_variations' as function_name,
        v_result as test_result,
        v_error as error_message;
    
    -- Test other functions if we have test data
    IF v_test_favorite_id IS NOT NULL AND v_test_song_id IS NOT NULL THEN
        -- Test link_video_to_song
        BEGIN
            PERFORM link_video_to_song(v_test_favorite_id, v_test_song_id, v_test_user_id);
            v_result := 'passed';
            v_error := NULL;
        EXCEPTION WHEN OTHERS THEN
            v_result := 'failed';
            v_error := SQLERRM;
        END;
        
        RETURN QUERY SELECT 
            'link_video_to_song' as function_name,
            v_result as test_result,
            v_error as error_message;
        
        -- Test validate_video_song_sync
        BEGIN
            PERFORM validate_video_song_sync(v_test_favorite_id, v_test_user_id);
            v_result := 'passed';
            v_error := NULL;
        EXCEPTION WHEN OTHERS THEN
            v_result := 'failed';
            v_error := SQLERRM;
        END;
        
        RETURN QUERY SELECT 
            'validate_video_song_sync' as function_name,
            v_result as test_result,
            v_error as error_message;
    ELSE
        RETURN QUERY SELECT 
            'data_dependent_tests' as function_name,
            'skipped' as test_result,
            'No test data available' as error_message;
    END IF;
    
    RETURN QUERY SELECT 
        'overall' as function_name,
        'completed' as test_result,
        'All available tests completed' as error_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- IMPLEMENTATION NOTES
-- =====================================================

-- This script provides:
-- 1. Complete sync group management (create, add, retrieve)
-- 2. Song linking capabilities (link videos to UG songs)
-- 3. Advanced song discovery (variation search)
-- 4. Video-song sync validation
-- 5. Comprehensive song data retrieval
-- 6. Tab caption request handling
-- 7. Testing and verification functions

-- Next steps:
-- 1. Run this script in Supabase
-- 2. Test the functions with sample data
-- 3. Proceed to Part 3: Implementation Guide
-- 4. Integrate with the frontend application

-- Usage examples:
-- SELECT * FROM create_chord_sync_group('favorite-uuid', 'user-uuid', '#FF0000');
-- SELECT * FROM find_song_variations('prophet', 5);
-- SELECT * FROM link_video_to_song('favorite-uuid', 'song-uuid', 'user-uuid');
-- SELECT * FROM test_song_linking_functions();
