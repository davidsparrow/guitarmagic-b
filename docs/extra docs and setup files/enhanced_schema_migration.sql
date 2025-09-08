-- 🎸 ENHANCED Song Database Schema - MIGRATION SCRIPT
-- This script safely migrates from the existing schema to the enhanced schema
-- Run this AFTER the existing schema is already in place

-- =====================================================
-- PHASE 1: ENHANCE EXISTING TABLES (Safe additions)
-- =====================================================

-- Add new columns to existing songs table (if they don't exist)
DO $$ 
BEGIN
    -- Add instrument_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'songs' AND column_name = 'instrument_type') THEN
        ALTER TABLE songs ADD COLUMN instrument_type VARCHAR(50) DEFAULT 'guitar';
    END IF;
    
    -- Add tuning column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'songs' AND column_name = 'tuning') THEN
        ALTER TABLE songs ADD COLUMN tuning VARCHAR(100) DEFAULT 'E A D G B E';
    END IF;
    
    -- Add tabbed_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'songs' AND column_name = 'tabbed_by') THEN
        ALTER TABLE songs ADD COLUMN tabbed_by VARCHAR(255);
    END IF;
END $$;

-- Add new columns to existing song_attributes table (if they don't exist)
DO $$ 
BEGIN
    -- Add section_label column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'song_attributes' AND column_name = 'section_label') THEN
        ALTER TABLE song_attributes ADD COLUMN section_label VARCHAR(100);
    END IF;
    
    -- Add section_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'song_attributes' AND column_name = 'section_type') THEN
        ALTER TABLE song_attributes ADD COLUMN section_type VARCHAR(50);
    END IF;
    
    -- Add instrument_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'song_attributes' AND column_name = 'instrument_type') THEN
        ALTER TABLE song_attributes ADD COLUMN instrument_type VARCHAR(50);
    END IF;
    
    -- Add tuning column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'song_attributes' AND column_name = 'tuning') THEN
        ALTER TABLE song_attributes ADD COLUMN tuning VARCHAR(100);
    END IF;
    
    -- Add repeat_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'song_attributes' AND column_name = 'repeat_count') THEN
        ALTER TABLE song_attributes ADD COLUMN repeat_count INTEGER;
    END IF;
    
    -- Add difficulty_marker column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'song_attributes' AND column_name = 'difficulty_marker') THEN
        ALTER TABLE song_attributes ADD COLUMN difficulty_marker VARCHAR(50);
    END IF;
    
    -- Add tab_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'song_attributes' AND column_name = 'tab_data') THEN
        ALTER TABLE song_attributes ADD COLUMN tab_data JSONB;
    END IF;
    
    -- Add chord_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'song_attributes' AND column_name = 'chord_data') THEN
        ALTER TABLE song_attributes ADD COLUMN chord_data JSONB;
    END IF;
END $$;

-- =====================================================
-- PHASE 2: CREATE NEW TABLES
-- =====================================================

-- Create song_sections table
CREATE TABLE IF NOT EXISTS song_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationship to songs table
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    
    -- Section identification
    section_name VARCHAR(100) NOT NULL, -- e.g., "Verse 1", "Chorus", "Guitar Solo"
    section_type VARCHAR(50) NOT NULL, -- verse, chorus, bridge, solo, intro, outro
    section_label VARCHAR(100), -- e.g., "fig. a", "Guitar Enters", "Drums"
    
    -- Timing and structure
    start_time VARCHAR(10) NOT NULL, -- MM:SS format
    end_time VARCHAR(10), -- MM:SS format (NULL for ongoing sections)
    duration_seconds INTEGER, -- Calculated duration in seconds
    
    -- Musical characteristics
    key_change VARCHAR(10), -- If key changes in this section
    tempo_change INTEGER, -- If tempo changes in this section
    time_signature_change VARCHAR(10), -- If time signature changes
    
    -- Performance instructions
    repeat_count INTEGER DEFAULT 1, -- How many times to repeat (2x, 6x, etc.)
    performance_notes TEXT, -- e.g., "play like this:", ">=play a couple of times"
    
    -- Tab data for this section
    tab_content JSONB, -- The actual tab notation for this section
    chord_progression JSONB, -- Extracted chords with timing
    
    -- Ordering and relationships
    sequence_order INTEGER DEFAULT 0, -- Order within the song
    parent_section_id UUID REFERENCES song_sections(id), -- For nested sections
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_section_time CHECK (
        start_time ~ '^[0-9]+:[0-5][0-9]$' AND
        (end_time IS NULL OR end_time ~ '^[0-9]+:[0-5][0-9]$')
    ),
    CONSTRAINT valid_section_type CHECK (
        section_type IN ('verse', 'chorus', 'bridge', 'solo', 'intro', 'outro', 'instrumental', 'fill', 'break', 'transition')
    ),
    CONSTRAINT valid_repeat_count_section CHECK (repeat_count > 0 AND repeat_count < 1000)
);

-- Create song_chord_progressions table
CREATE TABLE IF NOT EXISTS song_chord_progressions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationship to songs table
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    section_id UUID REFERENCES song_sections(id), -- Optional link to specific section
    
    -- Chord information
    chord_name VARCHAR(50) NOT NULL, -- e.g., "Am", "C", "Fmaj7"
    chord_type VARCHAR(50), -- major, minor, 7th, etc.
    root_note VARCHAR(10), -- e.g., "A", "C", "F"
    
    -- Timing information
    start_time VARCHAR(10) NOT NULL, -- MM:SS format
    end_time VARCHAR(10), -- MM:SS format
    duration_seconds INTEGER, -- How long this chord is held
    
    -- Position in progression
    sequence_order INTEGER DEFAULT 0, -- Order within the progression
    bar_position INTEGER, -- Which bar this chord appears in
    
    -- Chord data
    chord_data JSONB, -- Full chord information (fingering, positions, etc.)
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_chord_time CHECK (
        start_time ~ '^[0-9]+:[0-5][0-9]$' AND
        (end_time IS NULL OR end_time ~ '^[0-9]+:[0-5][0-9]$')
    )
);

-- =====================================================
-- PHASE 3: ADD CONSTRAINTS (Safe additions)
-- =====================================================

-- Add constraints to songs table if they don't exist
DO $$ 
BEGIN
    -- Add tempo constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'songs' AND constraint_name = 'valid_tempo') THEN
        ALTER TABLE songs ADD CONSTRAINT valid_tempo CHECK (tempo > 0 AND tempo < 1000);
    END IF;
    
    -- Add year constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'songs' AND constraint_name = 'valid_year') THEN
        ALTER TABLE songs ADD CONSTRAINT valid_year CHECK (year > 1900 AND year < 2100);
    END IF;
END $$;

-- Add constraints to song_attributes table if they don't exist
DO $$ 
BEGIN
    -- Add repeat_count constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'song_attributes' AND constraint_name = 'valid_repeat_count') THEN
        ALTER TABLE song_attributes ADD CONSTRAINT valid_repeat_count CHECK (repeat_count > 0 AND repeat_count < 1000);
    END IF;
    
    -- Add section_type constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'song_attributes' AND constraint_name = 'valid_section_type') THEN
        ALTER TABLE song_attributes ADD CONSTRAINT valid_section_type CHECK (
            section_type IN ('verse', 'chorus', 'bridge', 'solo', 'intro', 'outro', 'instrumental', 'fill', 'break')
        );
    END IF;
END $$;

-- =====================================================
-- PHASE 4: CREATE ENHANCED INDEXES
-- =====================================================

-- Enhanced indexes for songs table
CREATE INDEX IF NOT EXISTS idx_songs_instrument ON songs(instrument_type);
CREATE INDEX IF NOT EXISTS idx_songs_genre_year ON songs(genre, year);

-- Enhanced indexes for song_attributes table
CREATE INDEX IF NOT EXISTS idx_song_attributes_section ON song_attributes(section_type, section_label);
CREATE INDEX IF NOT EXISTS idx_song_attributes_tab_data ON song_attributes USING GIN(tab_data);

-- New indexes for song_sections table
CREATE INDEX IF NOT EXISTS idx_song_sections_song_id ON song_sections(song_id);
CREATE INDEX IF NOT EXISTS idx_song_sections_type ON song_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_song_sections_timing ON song_sections(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_song_sections_sequence ON song_sections(song_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_song_sections_parent ON song_sections(parent_section_id);

-- New indexes for song_chord_progressions table
CREATE INDEX IF NOT EXISTS idx_chord_progressions_song_id ON song_chord_progressions(song_id);
CREATE INDEX IF NOT EXISTS idx_chord_progressions_section ON song_chord_progressions(section_id);
CREATE INDEX IF NOT EXISTS idx_chord_progressions_timing ON song_chord_progressions(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_chord_progressions_chord ON song_chord_progressions(chord_name);
CREATE INDEX IF NOT EXISTS idx_chord_progressions_sequence ON song_chord_progressions(song_id, sequence_order);

-- =====================================================
-- PHASE 5: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to calculate duration between two time strings
CREATE OR REPLACE FUNCTION calculate_duration_seconds(start_time_str TEXT, end_time_str TEXT)
RETURNS INTEGER AS $$
DECLARE
    start_seconds INTEGER;
    end_seconds INTEGER;
BEGIN
    -- Parse start time (MM:SS)
    start_seconds := (SPLIT_PART(start_time_str, ':', 1)::INTEGER * 60) + 
                     SPLIT_PART(start_time_str, ':', 2)::INTEGER;
    
    -- Parse end time (MM:SS)
    end_seconds := (SPLIT_PART(end_time_str, ':', 1)::INTEGER * 60) + 
                   SPLIT_PART(end_time_str, ':', 2)::INTEGER;
    
    RETURN end_seconds - start_seconds;
END;
$$ LANGUAGE plpgsql;

-- Function to extract timing markers from text
CREATE OR REPLACE FUNCTION extract_timing_markers(text_content TEXT)
RETURNS TEXT[] AS $$
DECLARE
    timing_pattern TEXT := '(\d+:\d+)';
    matches TEXT[];
BEGIN
    SELECT array_agg(match) INTO matches
    FROM regexp_matches(text_content, timing_pattern, 'g') AS match;
    
    RETURN matches;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 6: CREATE TRIGGERS
-- =====================================================

-- Create trigger for song_sections updated_at
CREATE TRIGGER update_song_sections_updated_at 
    BEFORE UPDATE ON song_sections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for song_chord_progressions updated_at
CREATE TRIGGER update_chord_progressions_updated_at 
    BEFORE UPDATE ON song_chord_progressions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 7: ENABLE RLS AND CREATE POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE song_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_chord_progressions ENABLE ROW LEVEL SECURITY;

-- Song sections policies
CREATE POLICY "Users can view all song sections" ON song_sections
    FOR SELECT USING (true);

CREATE POLICY "Users can create song sections for their songs" ON song_sections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM songs 
            WHERE songs.id = song_sections.song_id 
            AND songs.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update sections for their songs" ON song_sections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM songs 
            WHERE songs.id = song_sections.song_id 
            AND songs.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete sections for their songs" ON song_sections
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM songs 
            WHERE songs.id = song_sections.song_id 
            AND songs.created_by = auth.uid()
        )
    );

-- Chord progressions policies
CREATE POLICY "Users can view all chord progressions" ON song_chord_progressions
    FOR SELECT USING (true);

CREATE POLICY "Users can create chord progressions for their songs" ON song_chord_progressions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM songs 
            WHERE songs.id = song_chord_progressions.song_id 
            AND songs.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update chord progressions for their songs" ON song_chord_progressions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM songs 
            WHERE songs.id = song_chord_progressions.song_id 
            AND songs.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete chord progressions for their songs" ON song_chord_progressions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM songs 
            WHERE songs.id = song_chord_progressions.song_id 
            AND songs.created_by = auth.uid()
        )
    );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if new tables were created successfully
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('song_sections', 'song_chord_progressions');

-- Check if new columns were added to existing tables
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'songs' 
AND column_name IN ('instrument_type', 'tuning', 'tabbed_by')
ORDER BY column_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'song_attributes' 
AND column_name IN ('section_label', 'section_type', 'instrument_type', 'tuning', 'repeat_count', 'difficulty_marker', 'tab_data', 'chord_data')
ORDER BY column_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('song_sections', 'song_chord_progressions');
