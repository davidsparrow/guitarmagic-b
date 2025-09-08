-- Comprehensive Database Enhancement for Ultimate Guitar Integration
-- This script enhances existing tables and creates missing ones to capture ALL UG data
-- Enabling the "never scan twice" strategy with comprehensive data capture

-- ============================================================================
-- PHASE 1: ENHANCE EXISTING TABLES WITH MISSING UG DATA FIELDS
-- ============================================================================

-- 1.1 Enhance songs table with comprehensive UG data fields
ALTER TABLE songs ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS last_scanned TIMESTAMP WITH TIME ZONE;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS ug_rating NUMERIC(3,2) CHECK (ug_rating >= 0 AND ug_rating <= 5);
ALTER TABLE songs ADD COLUMN IF NOT EXISTS ug_votes INTEGER DEFAULT 0;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS ug_views INTEGER DEFAULT 0;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS capo_position INTEGER CHECK (capo_position >= 0 AND capo_position <= 12);
ALTER TABLE songs ADD COLUMN IF NOT EXISTS alternative_tunings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS complexity_score NUMERIC(3,2) CHECK (complexity_score >= 0 AND complexity_score <= 10);
ALTER TABLE songs ADD COLUMN IF NOT EXISTS popularity_rank INTEGER;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS ug_last_updated TIMESTAMP WITH TIME ZONE;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS tab_count INTEGER DEFAULT 0;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS official_tab BOOLEAN DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS verified_tab BOOLEAN DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS tab_contributor TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS tab_contribution_date DATE;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS tab_quality_score NUMERIC(3,2) CHECK (tab_quality_score >= 0 AND tab_quality_score <= 10);

-- Add comments for documentation
COMMENT ON COLUMN songs.scan_count IS 'Number of times this song has been scanned from UG (0 = never scanned)';
COMMENT ON COLUMN songs.last_scanned IS 'Timestamp of last UG scan (NULL = never scanned)';
COMMENT ON COLUMN songs.ug_rating IS 'UG user rating (0.0 to 5.0)';
COMMENT ON COLUMN songs.ug_votes IS 'Number of UG user votes';
COMMENT ON COLUMN songs.ug_views IS 'Number of UG page views';
COMMENT ON COLUMN songs.capo_position IS 'Capo position (0-12, 0 = no capo)';
COMMENT ON COLUMN songs.alternative_tunings IS 'JSON array of alternative tuning variations';
COMMENT ON COLUMN songs.complexity_score IS 'Song complexity score (0.0 to 10.0)';
COMMENT ON COLUMN songs.popularity_rank IS 'Popularity ranking among UG songs';

-- 1.2 Enhance song_sections table with precise timing and chord data
ALTER TABLE song_sections ADD COLUMN IF NOT EXISTS start_time_ms INTEGER;
ALTER TABLE song_sections ADD COLUMN IF NOT EXISTS end_time_ms INTEGER;
ALTER TABLE song_sections ADD COLUMN IF NOT EXISTS chord_sequence JSONB DEFAULT '[]'::jsonb;
ALTER TABLE song_sections ADD COLUMN IF NOT EXISTS bar_count INTEGER;
ALTER TABLE song_sections ADD COLUMN IF NOT EXISTS measure_count INTEGER;
ALTER TABLE song_sections ADD COLUMN IF NOT EXISTS chord_changes_per_bar JSONB DEFAULT '[]'::jsonb;
ALTER TABLE song_sections ADD COLUMN IF NOT EXISTS strumming_pattern TEXT;
ALTER TABLE song_sections ADD COLUMN IF NOT EXISTS picking_pattern TEXT;
ALTER TABLE song_sections ADD COLUMN IF NOT EXISTS dynamics TEXT;
ALTER TABLE song_sections ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Add comments for documentation
COMMENT ON COLUMN song_sections.start_time_ms IS 'Start time in milliseconds for precise timing';
COMMENT ON COLUMN song_sections.end_time_ms IS 'End time in milliseconds for precise timing';
COMMENT ON COLUMN song_sections.chord_sequence IS 'JSON array of chords in this section with timing';
COMMENT ON COLUMN song_sections.bar_count IS 'Number of bars in this section';
COMMENT ON COLUMN song_sections.measure_count IS 'Number of measures in this section';

-- 1.3 Enhance song_chord_progressions table with difficulty and variation data
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert'));
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS variation_id UUID;
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS finger_positions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS alternative_voicings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS barre_technique BOOLEAN DEFAULT false;
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS stretch_required BOOLEAN DEFAULT false;
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS thumb_position TEXT;
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS muting_technique TEXT;
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS hammer_on_pull_off BOOLEAN DEFAULT false;
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS slide_technique BOOLEAN DEFAULT false;
ALTER TABLE song_chord_progressions ADD COLUMN IF NOT EXISTS chord_difficulty_score NUMERIC(3,2) CHECK (chord_difficulty_score >= 0 AND chord_difficulty_score <= 10);

-- Add comments for documentation
COMMENT ON COLUMN song_chord_progressions.difficulty_level IS 'Difficulty level for this chord progression';
COMMENT ON COLUMN song_chord_progressions.variation_id IS 'UUID linking to chord variation details';
COMMENT ON COLUMN song_chord_progressions.finger_positions IS 'JSON object with finger placement instructions';
COMMENT ON COLUMN song_chord_progressions.alternative_voicings IS 'JSON array of alternative chord voicings';

-- 1.4 Enhance song_attributes table with additional UG metadata
ALTER TABLE song_attributes ADD COLUMN IF NOT EXISTS ug_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE song_attributes ADD COLUMN IF NOT EXISTS tab_format TEXT CHECK (tab_format IN ('guitar_pro', 'power_tab', 'text_tab', 'chord_only'));
ALTER TABLE song_attributes ADD COLUMN IF NOT EXISTS tab_accuracy_score NUMERIC(3,2) CHECK (tab_accuracy_score >= 0 AND tab_accuracy_score <= 10);
ALTER TABLE song_attributes ADD COLUMN IF NOT EXISTS tab_completeness_score NUMERIC(3,2) CHECK (tab_completeness_score >= 0 AND tab_completeness_score <= 10);
ALTER TABLE song_attributes ADD COLUMN IF NOT EXISTS user_notes TEXT;
ALTER TABLE song_attributes ADD COLUMN IF NOT EXISTS practice_tips TEXT;
ALTER TABLE song_attributes ADD COLUMN IF NOT EXISTS common_mistakes TEXT;
ALTER TABLE song_attributes ADD COLUMN IF NOT EXISTS learning_progression TEXT;

-- Add comments for documentation
COMMENT ON COLUMN song_attributes.ug_metadata IS 'Additional metadata from Ultimate Guitar';
COMMENT ON COLUMN song_attributes.tab_format IS 'Format of the original tab';
COMMENT ON COLUMN song_attributes.tab_accuracy_score IS 'Accuracy score of the tab (0.0 to 10.0)';

-- 1.5 Enhance video_song_mappings table with additional mapping data
ALTER TABLE video_song_mappings ADD COLUMN IF NOT EXISTS video_id TEXT;
ALTER TABLE video_song_mappings ADD COLUMN IF NOT EXISTS mapping_confidence_reason TEXT;
ALTER TABLE video_song_mappings ADD COLUMN IF NOT EXISTS mapping_verified BOOLEAN DEFAULT false;
ALTER TABLE video_song_mappings ADD COLUMN IF NOT EXISTS mapping_verified_by UUID;
ALTER TABLE video_song_mappings ADD COLUMN IF NOT EXISTS mapping_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE video_song_mappings ADD COLUMN IF NOT EXISTS mapping_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN video_song_mappings.video_id IS 'YouTube video ID for this mapping';
COMMENT ON COLUMN video_song_mappings.mapping_confidence_reason IS 'Reason for the confidence score';

-- ============================================================================
-- PHASE 2: CREATE MISSING TABLES FOR COMPLETE FUNCTIONALITY
-- ============================================================================

-- 2.1 Create chord_sync_chords table for video-specific chord timing
CREATE TABLE IF NOT EXISTS chord_sync_chords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_group_id UUID NOT NULL REFERENCES chord_sync_groups(id) ON DELETE CASCADE,
    chord_name TEXT NOT NULL,
    timing_ms INTEGER NOT NULL CHECK (timing_ms >= 0),
    position_data JSONB DEFAULT '{}'::jsonb,
    chord_variation_id UUID REFERENCES chord_variations(id),
    display_settings JSONB DEFAULT '{}'::jsonb,
    user_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE chord_sync_chords IS 'Individual chord instances with precise timing for video synchronization';
COMMENT ON COLUMN chord_sync_chords.sync_group_id IS 'Reference to the chord sync group';
COMMENT ON COLUMN chord_sync_chords.chord_name IS 'Name of the chord (e.g., Am, C, F)';
COMMENT ON COLUMN chord_sync_chords.timing_ms IS 'Exact timing in milliseconds for this chord change';
COMMENT ON COLUMN chord_sync_chords.position_data IS 'JSON object with section, bar, beat, and other position info';

-- 2.2 Create tab_caption_requests table for tracking UG scanning needs
CREATE TABLE IF NOT EXISTS tab_caption_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    requested_by UUID REFERENCES user_profiles(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_notes TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    ug_tab_id BIGINT,
    ug_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE tab_caption_requests IS 'Tracks songs that need UG scanning for caption generation';
COMMENT ON COLUMN tab_caption_requests.song_id IS 'Reference to the song needing scanning';
COMMENT ON COLUMN tab_caption_requests.priority IS 'Priority level for processing';
COMMENT ON COLUMN tab_caption_requests.status IS 'Current status of the request';
COMMENT ON COLUMN tab_caption_requests.ug_tab_id IS 'Ultimate Guitar tab ID if known';

-- 2.3 Create song_metadata table for comprehensive UG metadata
CREATE TABLE IF NOT EXISTS song_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    metadata_type TEXT NOT NULL CHECK (metadata_type IN ('technical', 'performance', 'learning', 'community', 'commercial')),
    metadata_key TEXT NOT NULL,
    metadata_value JSONB NOT NULL,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    source TEXT DEFAULT 'ultimate_guitar',
    source_url TEXT,
    last_verified TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(song_id, metadata_type, metadata_key)
);

-- Add comments for documentation
COMMENT ON TABLE song_metadata IS 'Comprehensive metadata storage for songs from various sources';
COMMENT ON COLUMN song_metadata.metadata_type IS 'Category of metadata';
COMMENT ON COLUMN song_metadata.metadata_key IS 'Specific metadata field name';
COMMENT ON COLUMN song_metadata.metadata_value IS 'JSON value for the metadata field';

-- ============================================================================
-- PHASE 3: ADD PERFORMANCE INDEXES FOR "NEVER SCAN TWICE" STRATEGY
-- ============================================================================

-- 3.1 Indexes for songs table
CREATE INDEX IF NOT EXISTS idx_songs_ug_tab_id ON songs(ug_tab_id);
CREATE INDEX IF NOT EXISTS idx_songs_scan_count ON songs(scan_count);
CREATE INDEX IF NOT EXISTS idx_songs_last_scanned ON songs(last_scanned);
CREATE INDEX IF NOT EXISTS idx_songs_title_artist ON songs(LOWER(title), LOWER(artist));
CREATE INDEX IF NOT EXISTS idx_songs_popularity ON songs(popularity_rank) WHERE popularity_rank IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_difficulty ON songs(difficulty);
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);

-- 3.2 Indexes for song_sections table
CREATE INDEX IF NOT EXISTS idx_song_sections_song_id ON song_sections(song_id);
CREATE INDEX IF NOT EXISTS idx_song_sections_start_time_ms ON song_sections(start_time_ms);
CREATE INDEX IF NOT EXISTS idx_song_sections_section_name ON song_sections(section_name);

-- 3.3 Indexes for song_chord_progressions table
CREATE INDEX IF NOT EXISTS idx_song_chord_progressions_song_id ON song_chord_progressions(song_id);
CREATE INDEX IF NOT EXISTS idx_song_chord_progressions_chord_name ON song_chord_progressions(chord_name);
CREATE INDEX IF NOT EXISTS idx_song_chord_progressions_difficulty ON song_chord_progressions(difficulty_level);

-- 3.4 Indexes for chord_sync_chords table
CREATE INDEX IF NOT EXISTS idx_chord_sync_chords_sync_group_id ON chord_sync_chords(sync_group_id);
CREATE INDEX IF NOT EXISTS idx_chord_sync_chords_timing_ms ON chord_sync_chords(timing_ms);
CREATE INDEX IF NOT EXISTS idx_chord_sync_chords_chord_name ON chord_sync_chords(chord_name);

-- 3.5 Indexes for tab_caption_requests table
CREATE INDEX IF NOT EXISTS idx_tab_caption_requests_song_id ON tab_caption_requests(song_id);
CREATE INDEX IF NOT EXISTS idx_tab_caption_requests_status ON tab_caption_requests(status);
CREATE INDEX IF NOT EXISTS idx_tab_caption_requests_priority ON tab_caption_requests(priority);
CREATE INDEX IF NOT EXISTS idx_tab_caption_requests_requested_at ON tab_caption_requests(requested_at);

-- 3.6 Indexes for song_metadata table
CREATE INDEX IF NOT EXISTS idx_song_metadata_song_id ON song_metadata(song_id);
CREATE INDEX IF NOT EXISTS idx_song_metadata_type_key ON song_metadata(metadata_type, metadata_key);
CREATE INDEX IF NOT EXISTS idx_song_metadata_source ON song_metadata(source);

-- 3.7 Indexes for video_song_mappings table
CREATE INDEX IF NOT EXISTS idx_video_song_mappings_video_id ON video_song_mappings(video_id);
CREATE INDEX IF NOT EXISTS idx_video_song_mappings_song_id ON video_song_mappings(song_id);
CREATE INDEX IF NOT EXISTS idx_video_song_mappings_confidence ON video_song_mappings(confidence_score);

-- ============================================================================
-- PHASE 4: ADD DATA INTEGRITY CONSTRAINTS AND TRIGGERS
-- ============================================================================

-- 4.1 Add check constraints for data validation (only if they don't exist)
DO $$
BEGIN
    -- Add constraints to songs table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_songs_scan_count_positive' AND table_name = 'songs') THEN
        ALTER TABLE songs ADD CONSTRAINT chk_songs_scan_count_positive CHECK (scan_count >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_songs_rating_range' AND table_name = 'songs') THEN
        ALTER TABLE songs ADD CONSTRAINT chk_songs_rating_range CHECK (ug_rating >= 0 AND ug_rating <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_songs_votes_positive' AND table_name = 'songs') THEN
        ALTER TABLE songs ADD CONSTRAINT chk_songs_votes_positive CHECK (ug_votes >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_songs_views_positive' AND table_name = 'songs') THEN
        ALTER TABLE songs ADD CONSTRAINT chk_songs_views_positive CHECK (ug_views >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_songs_capo_range' AND table_name = 'songs') THEN
        ALTER TABLE songs ADD CONSTRAINT chk_songs_capo_range CHECK (capo_position >= 0 AND capo_position <= 12);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_songs_complexity_range' AND table_name = 'songs') THEN
        ALTER TABLE songs ADD CONSTRAINT chk_songs_complexity_range CHECK (complexity_score >= 0 AND complexity_score <= 10);
    END IF;
    
    -- Add constraint to song_chord_progressions table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_chord_progressions_difficulty_score' AND table_name = 'song_chord_progressions') THEN
        ALTER TABLE song_chord_progressions ADD CONSTRAINT chk_chord_progressions_difficulty_score CHECK (chord_difficulty_score >= 0 AND chord_difficulty_score <= 10);
    END IF;
END $$;

-- 4.2 Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4.3 Add updated_at triggers to all tables (only if they don't exist)
DO $$
BEGIN
    -- Add trigger to songs table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_songs_updated_at' AND event_object_table = 'songs') THEN
        CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add trigger to song_sections table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_song_sections_updated_at' AND event_object_table = 'song_sections') THEN
        CREATE TRIGGER update_song_sections_updated_at BEFORE UPDATE ON song_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add trigger to song_chord_progressions table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_song_chord_progressions_updated_at' AND event_object_table = 'song_chord_progressions') THEN
        CREATE TRIGGER update_song_chord_progressions_updated_at BEFORE UPDATE ON song_chord_progressions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add trigger to song_attributes table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_song_attributes_updated_at' AND event_object_table = 'song_attributes') THEN
        CREATE TRIGGER update_song_attributes_updated_at BEFORE UPDATE ON song_attributes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add trigger to video_song_mappings table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_video_song_mappings_updated_at' AND event_object_table = 'video_song_mappings') THEN
        CREATE TRIGGER update_video_song_mappings_updated_at BEFORE UPDATE ON video_song_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add trigger to chord_sync_chords table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_chord_sync_chords_updated_at' AND event_object_table = 'chord_sync_chords') THEN
        CREATE TRIGGER update_chord_sync_chords_updated_at BEFORE UPDATE ON chord_sync_chords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add trigger to tab_caption_requests table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_tab_caption_requests_updated_at' AND event_object_table = 'tab_caption_requests') THEN
        CREATE TRIGGER update_tab_caption_requests_updated_at BEFORE UPDATE ON tab_caption_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add trigger to song_metadata table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_song_metadata_updated_at' AND event_object_table = 'song_metadata') THEN
        CREATE TRIGGER update_song_metadata_updated_at BEFORE UPDATE ON song_metadata FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- PHASE 5: GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================================

-- 5.1 Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5.2 Grant specific permissions for new tables
GRANT ALL ON chord_sync_chords TO authenticated;
GRANT ALL ON tab_caption_requests TO authenticated;
GRANT ALL ON song_metadata TO authenticated;

-- ============================================================================
-- PHASE 6: CREATE SAMPLE DATA FOR TESTING
-- ============================================================================

-- 6.1 Insert sample song with comprehensive data
INSERT INTO songs (
    title, 
    artist, 
    album, 
    year, 
    genre, 
    difficulty, 
    tuning, 
    tempo, 
    time_signature,
    scan_count,
    last_scanned,
    ug_rating,
    ug_votes,
    ug_views,
    complexity_score
) VALUES (
    'Wonderwall',
    'Oasis',
    'What''s the Story Morning Glory?',
    1995,
    'Britpop',
    'intermediate',
    'E A D G B E',
    84,
    '4/4',
    1,
    NOW(),
    4.8,
    1250,
    50000,
    6.5
) ON CONFLICT (title, artist) DO NOTHING;

-- 6.2 Insert sample song section
INSERT INTO song_sections (
    song_id,
    section_name,
    section_type,
    start_time,
    end_time,
    start_time_ms,
    end_time_ms,
    bar_count,
    chord_sequence
) 
SELECT 
    s.id,
    'Verse',
    'verse',
    '0:00',
    '0:16',
    0,
    16000,
    4,
    '["Am", "C", "F", "G"]'::jsonb
FROM songs s 
WHERE s.title = 'Wonderwall' AND s.artist = 'Oasis'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PHASE 7: VERIFICATION AND SUMMARY
-- ============================================================================

-- 7.1 Create a summary view for database status
CREATE OR REPLACE VIEW database_enhancement_summary AS
SELECT 
    'songs' as table_name,
    COUNT(*) as record_count,
    'Enhanced with UG data fields' as status
FROM songs
UNION ALL
SELECT 
    'song_sections' as table_name,
    COUNT(*) as record_count,
    'Enhanced with precise timing' as status
FROM song_sections
UNION ALL
SELECT 
    'song_chord_progressions' as table_name,
    COUNT(*) as record_count,
    'Enhanced with difficulty data' as status
FROM song_chord_progressions
UNION ALL
SELECT 
    'chord_sync_chords' as table_name,
    COUNT(*) as record_count,
    'Created for video sync' as status
FROM chord_sync_chords
UNION ALL
SELECT 
    'tab_caption_requests' as table_name,
    COUNT(*) as record_count,
    'Created for UG scanning' as status
FROM tab_caption_requests
UNION ALL
SELECT 
    'song_metadata' as table_name,
    COUNT(*) as record_count,
    'Created for comprehensive data' as status
FROM song_metadata;

-- Add comment for the view
COMMENT ON VIEW database_enhancement_summary IS 'Summary view showing the status of all enhanced and created tables';

-- 7.2 Final success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'DATABASE ENHANCEMENT COMPLETE!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ All existing tables enhanced with UG data fields';
    RAISE NOTICE '✅ Missing tables created for complete functionality';
    RAISE NOTICE '✅ Performance indexes added for "never scan twice" strategy';
    RAISE NOTICE '✅ Data integrity constraints and triggers implemented';
    RAISE NOTICE '✅ Sample data inserted for testing';
    RAISE NOTICE '✅ Ready for comprehensive UG data capture!';
    RAISE NOTICE '==============================================';
END $$;
