-- Create Missing Database Helper Functions
-- These functions were identified as missing by the test_ug_integration.js script
-- They enable the "never scan twice" strategy for Ultimate Guitar song data

-- Function 1: Create Chord Sync Group
-- This function was specifically missing and causing test failures
CREATE OR REPLACE FUNCTION create_chord_sync_group(
  p_favorite_id TEXT,
  p_song_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sync_group_id TEXT;
  v_favorite_exists BOOLEAN;
BEGIN
  -- Validate input parameters
  IF p_favorite_id IS NULL OR p_favorite_id = '' THEN
    RAISE EXCEPTION 'favorite_id cannot be null or empty';
  END IF;
  
  -- Check if favorite exists
  SELECT EXISTS(SELECT 1 FROM favorites WHERE id = p_favorite_id) INTO v_favorite_exists;
  IF NOT v_favorite_exists THEN
    RAISE EXCEPTION 'Favorite with id % does not exist', p_favorite_id;
  END IF;
  
  -- Generate unique sync group ID
  v_sync_group_id := 'sync_' || p_favorite_id || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;
  
  -- Create sync group record
  INSERT INTO chord_sync_groups (
    id,
    favorite_id,
    song_id,
    created_at,
    updated_at,
    status
  ) VALUES (
    v_sync_group_id,
    p_favorite_id,
    p_song_id,
    NOW(),
    NOW(),
    'active'
  );
  
  -- Log the creation
  RAISE NOTICE 'Created chord sync group % for favorite %', v_sync_group_id, p_favorite_id;
  
  RETURN v_sync_group_id;
END;
$$;

-- Function 2: Add Chord to Sync Group
-- Enables adding individual chords to existing sync groups
CREATE OR REPLACE FUNCTION add_chord_to_sync_group(
  p_sync_group_id TEXT,
  p_chord_name TEXT,
  p_timing_ms INTEGER DEFAULT NULL,
  p_position_data JSONB DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chord_id TEXT;
  v_sync_group_exists BOOLEAN;
BEGIN
  -- Validate input parameters
  IF p_sync_group_id IS NULL OR p_sync_group_id = '' THEN
    RAISE EXCEPTION 'sync_group_id cannot be null or empty';
  END IF;
  
  IF p_chord_name IS NULL OR p_chord_name = '' THEN
    RAISE EXCEPTION 'chord_name cannot be null or empty';
  END IF;
  
  -- Check if sync group exists
  SELECT EXISTS(SELECT 1 FROM chord_sync_groups WHERE id = p_sync_group_id) INTO v_sync_group_exists;
  IF NOT v_sync_group_exists THEN
    RAISE EXCEPTION 'Sync group with id % does not exist', p_sync_group_id;
  END IF;
  
  -- Generate unique chord ID
  v_chord_id := 'chord_' || p_sync_group_id || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;
  
  -- Add chord to sync group
  INSERT INTO chord_sync_chords (
    id,
    sync_group_id,
    chord_name,
    timing_ms,
    position_data,
    created_at
  ) VALUES (
    v_chord_id,
    p_sync_group_id,
    p_chord_name,
    p_timing_ms,
    p_position_data,
    NOW()
  );
  
  -- Update sync group timestamp
  UPDATE chord_sync_groups 
  SET updated_at = NOW() 
  WHERE id = p_sync_group_id;
  
  RAISE NOTICE 'Added chord % to sync group %', p_chord_name, p_sync_group_id;
  
  RETURN v_chord_id;
END;
$$;

-- Function 3: Link Video to Song
-- Connects YouTube videos to Ultimate Guitar songs for the "never scan twice" strategy
CREATE OR REPLACE FUNCTION link_video_to_song(
  p_video_id TEXT,
  p_song_title TEXT,
  p_artist_name TEXT DEFAULT NULL,
  p_ug_tab_id INTEGER DEFAULT NULL,
  p_confidence_score NUMERIC DEFAULT 0.8
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mapping_id TEXT;
  v_song_id TEXT;
  v_existing_song_id TEXT;
BEGIN
  -- Validate input parameters
  IF p_video_id IS NULL OR p_video_id = '' THEN
    RAISE EXCEPTION 'video_id cannot be null or empty';
  END IF;
  
  IF p_song_title IS NULL OR p_song_title = '' THEN
    RAISE EXCEPTION 'song_title cannot be null or empty';
  END IF;
  
  -- Check if we already have this song data (never scan twice)
  IF p_ug_tab_id IS NOT NULL THEN
    SELECT id INTO v_existing_song_id 
    FROM songs 
    WHERE ug_tab_id = p_ug_tab_id;
  ELSE
    SELECT id INTO v_existing_song_id 
    FROM songs 
    WHERE LOWER(title) = LOWER(p_song_title) 
    AND (p_artist_name IS NULL OR LOWER(artist) = LOWER(p_artist_name));
  END IF;
  
  -- If song doesn't exist, create it (this will trigger the first and only UG scan)
  IF v_existing_song_id IS NULL THEN
    v_song_id := 'song_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    INSERT INTO songs (
      id,
      title,
      artist,
      ug_tab_id,
      created_at,
      updated_at,
      scan_count
    ) VALUES (
      v_song_id,
      p_song_title,
      p_artist_name,
      p_ug_tab_id,
      NOW(),
      NOW(),
      1  -- First scan
    );
    
    RAISE NOTICE 'Created new song % for % - will trigger first UG scan', v_song_id, p_song_title;
  ELSE
    v_song_id := v_existing_song_id;
    RAISE NOTICE 'Song % already exists - no need to scan UG again', v_song_id;
  END IF;
  
  -- Create video-song mapping
  v_mapping_id := 'map_' || p_video_id || '_' || v_song_id;
  
  INSERT INTO video_song_mappings (
    id,
    video_id,
    song_id,
    confidence_score,
    created_at
  ) VALUES (
    v_mapping_id,
    p_video_id,
    v_song_id,
    p_confidence_score,
    NOW()
  );
  
  RAISE NOTICE 'Linked video % to song % with confidence %', p_video_id, v_song_id, p_confidence_score;
  
  RETURN v_mapping_id;
END;
$$;

-- Function 4: Find Song Variations
-- Searches for existing song data to prevent re-scanning
CREATE OR REPLACE FUNCTION find_song_variations(
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  song_id TEXT,
  title TEXT,
  artist TEXT,
  album TEXT,
  year INTEGER,
  genre TEXT,
  ug_tab_id INTEGER,
  scan_count INTEGER,
  last_scanned TIMESTAMP,
  has_complete_data BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.artist,
    s.album,
    s.year,
    s.genre,
    s.ug_tab_id,
    s.scan_count,
    s.last_scanned,
    CASE 
      WHEN s.scan_count > 0 AND s.last_scanned IS NOT NULL THEN true
      ELSE false
    END as has_complete_data
  FROM songs s
  WHERE 
    LOWER(s.title) LIKE '%' || LOWER(p_search_term) || '%'
    OR LOWER(s.artist) LIKE '%' || LOWER(p_search_term) || '%'
    OR LOWER(s.album) LIKE '%' || LOWER(p_search_term) || '%'
  ORDER BY 
    s.scan_count DESC,  -- Prioritize songs we've already scanned
    s.last_scanned DESC NULLS LAST,
    LOWER(s.title) LIKE LOWER(p_search_term) || '%' DESC,  -- Exact title matches first
    LOWER(s.artist) LIKE LOWER(p_search_term) || '%' DESC   -- Exact artist matches first
  LIMIT p_limit;
END;
$$;

-- Function 5: Validate Video-Song Sync Quality
-- Ensures the linked video and song data are properly synchronized
CREATE OR REPLACE FUNCTION validate_video_song_sync(
  p_mapping_id TEXT
)
RETURNS TABLE(
  is_valid BOOLEAN,
  confidence_score NUMERIC,
  sync_quality TEXT,
  issues TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mapping RECORD;
  v_song RECORD;
  v_issues TEXT[] := ARRAY[]::TEXT[];
  v_sync_quality TEXT;
BEGIN
  -- Get mapping details
  SELECT * INTO v_mapping 
  FROM video_song_mappings 
  WHERE id = p_mapping_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0.0, 'invalid_mapping', ARRAY['Mapping not found'];
    RETURN;
  END IF;
  
  -- Get song details
  SELECT * INTO v_song 
  FROM songs 
  WHERE id = v_mapping.song_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, v_mapping.confidence_score, 'missing_song', ARRAY['Referenced song not found'];
    RETURN;
  END IF;
  
  -- Validate sync quality
  IF v_mapping.confidence_score >= 0.9 THEN
    v_sync_quality := 'excellent';
  ELSIF v_mapping.confidence_score >= 0.7 THEN
    v_sync_quality := 'good';
  ELSIF v_mapping.confidence_score >= 0.5 THEN
    v_sync_quality := 'fair';
  ELSE
    v_sync_quality := 'poor';
  END IF;
  
  -- Check for potential issues
  IF v_song.scan_count = 0 THEN
    v_issues := array_append(v_issues, 'Song has not been scanned from UG yet');
  END IF;
  
  IF v_song.last_scanned IS NULL THEN
    v_issues := array_append(v_issues, 'Song scan timestamp is missing');
  END IF;
  
  IF v_mapping.confidence_score < 0.7 THEN
    v_issues := array_append(v_issues, 'Low confidence score - may need manual review');
  END IF;
  
  -- Return validation results
  RETURN QUERY SELECT 
    true, 
    v_mapping.confidence_score, 
    v_sync_quality, 
    v_issues;
END;
$$;

-- Function 6: Get Song Data for Video
-- Retrieves complete song data for a video, ensuring we never scan twice
CREATE OR REPLACE FUNCTION get_song_data_for_video(
  p_video_id TEXT
)
RETURNS TABLE(
  song_id TEXT,
  title TEXT,
  artist TEXT,
  album TEXT,
  year INTEGER,
  genre TEXT,
  ug_tab_id INTEGER,
  scan_count INTEGER,
  last_scanned TIMESTAMP,
  needs_ug_scan BOOLEAN,
  chord_progressions JSONB,
  sections JSONB,
  attributes JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mapping RECORD;
  v_song RECORD;
  v_chord_progressions JSONB;
  v_sections JSONB;
  v_attributes JSONB;
BEGIN
  -- Find video-song mapping
  SELECT * INTO v_mapping 
  FROM video_song_mappings 
  WHERE video_id = p_video_id;
  
  IF NOT FOUND THEN
    RETURN; -- No mapping found
  END IF;
  
  -- Get song data
  SELECT * INTO v_song 
  FROM songs 
  WHERE id = v_mapping.song_id;
  
  IF NOT FOUND THEN
    RETURN; -- Song not found
  END IF;
  
  -- Get chord progressions
  SELECT jsonb_agg(
    jsonb_build_object(
      'section', scp.section_name,
      'chords', scp.chord_sequence,
      'timing', scp.timing_data
    )
  ) INTO v_chord_progressions
  FROM song_chord_progressions scp
  WHERE scp.song_id = v_song.id;
  
  -- Get song sections
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', ss.section_name,
      'start_time', ss.start_time_ms,
      'end_time', ss.end_time_ms,
      'chords', ss.chord_sequence
    )
  ) INTO v_sections
  FROM song_sections ss
  WHERE ss.song_id = v_song.id;
  
  -- Get song attributes
  SELECT jsonb_object_agg(sa.attribute_key, sa.attribute_value) INTO v_attributes
  FROM song_attributes sa
  WHERE sa.song_id = v_song.id;
  
  -- Return complete song data
  RETURN QUERY SELECT 
    v_song.id,
    v_song.title,
    v_song.artist,
    v_song.album,
    v_song.year,
    v_song.genre,
    v_song.ug_tab_id,
    v_song.scan_count,
    v_song.last_scanned,
    (v_song.scan_count = 0 OR v_song.last_scanned IS NULL) as needs_ug_scan,
    COALESCE(v_chord_progressions, '[]'::jsonb) as chord_progressions,
    COALESCE(v_sections, '[]'::jsonb) as sections,
    COALESCE(v_attributes, '{}'::jsonb) as attributes;
END;
$$;

-- Function 7: Create Tab Caption Request
-- Generates caption requests for songs that need UG scanning
CREATE OR REPLACE FUNCTION create_tab_caption_request(
  p_song_id TEXT,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id TEXT;
  v_song RECORD;
BEGIN
  -- Validate input
  IF p_song_id IS NULL OR p_song_id = '' THEN
    RAISE EXCEPTION 'song_id cannot be null or empty';
  END IF;
  
  -- Get song details
  SELECT * INTO v_song 
  FROM songs 
  WHERE id = p_song_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Song with id % does not exist', p_song_id;
  END IF;
  
  -- Check if song already has complete data
  IF v_song.scan_count > 0 AND v_song.last_scanned IS NOT NULL THEN
    RAISE NOTICE 'Song % already has complete data - no caption request needed', p_song_id;
    RETURN NULL;
  END IF;
  
  -- Generate request ID
  v_request_id := 'caption_req_' || p_song_id || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;
  
  -- Create caption request
  INSERT INTO tab_caption_requests (
    id,
    song_id,
    priority,
    status,
    created_at,
    requested_by
  ) VALUES (
    v_request_id,
    p_song_id,
    p_priority,
    'pending',
    NOW(),
    'system'
  );
  
  RAISE NOTICE 'Created tab caption request % for song %', v_request_id, p_song_id;
  
  RETURN v_request_id;
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_chord_sync_group(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_chord_to_sync_group(TEXT, TEXT, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION link_video_to_song(TEXT, TEXT, TEXT, INTEGER, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION find_song_variations(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_video_song_sync(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_song_data_for_video(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_tab_caption_request(TEXT, TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION create_chord_sync_group(TEXT, TEXT) IS 'Creates a new chord synchronization group for a favorite video';
COMMENT ON FUNCTION add_chord_to_sync_group(TEXT, TEXT, INTEGER, JSONB) IS 'Adds a chord to an existing sync group with timing and position data';
COMMENT ON FUNCTION link_video_to_song(TEXT, TEXT, TEXT, INTEGER, NUMERIC) IS 'Links a YouTube video to an Ultimate Guitar song, preventing duplicate scans';
COMMENT ON FUNCTION find_song_variations(TEXT, INTEGER) IS 'Searches for existing song data to prevent re-scanning from UG';
COMMENT ON FUNCTION validate_video_song_sync(TEXT, TEXT) IS 'Validates the quality of video-song synchronization';
COMMENT ON FUNCTION get_song_data_for_video(TEXT) IS 'Retrieves complete song data for a video, ensuring we never scan UG twice';
COMMENT ON FUNCTION create_tab_caption_request(TEXT, TEXT) IS 'Creates a caption request for songs that need UG scanning';
