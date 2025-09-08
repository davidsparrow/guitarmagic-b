-- 🎸 ENHANCED Song Database Schema for Ultimate Guitar Integration
-- This enhanced schema properly supports all the rich song data we're getting
-- Copy and paste this entire script into your Supabase SQL editor

-- =====================================================
-- TABLE 1: songs (Enhanced parent table)
-- =====================================================

CREATE TABLE IF NOT EXISTS songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic song information
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    
    -- Ultimate Guitar integration
    ug_tab_id BIGINT UNIQUE, -- Ultimate Guitar tab ID for lookups
    ug_url TEXT, -- Full UG URL for reference
    
    -- Musical metadata
    key_signature VARCHAR(10), -- e.g., 'C', 'Am', 'F#m'
    tempo INTEGER, -- BPM
    time_signature VARCHAR(10), -- e.g., '4/4', '3/4'
    difficulty VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced
    
    -- Content metadata
    genre VARCHAR(100),
    year INTEGER,
    album VARCHAR(255),
    
    -- Tab-specific metadata
    instrument_type VARCHAR(50) DEFAULT 'guitar', -- guitar, bass, ukulele, etc.
    tuning VARCHAR(100) DEFAULT 'E A D G B E', -- Standard guitar tuning
    tabbed_by VARCHAR(255), -- Who created the tab
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT unique_song_artist UNIQUE(title, artist),
    CONSTRAINT valid_tempo CHECK (tempo > 0 AND tempo < 1000),
    CONSTRAINT valid_year CHECK (year > 1900 AND year < 2100)
);

-- =====================================================
-- TABLE 2: song_attributes (Enhanced child table)
-- =====================================================

CREATE TABLE IF NOT EXISTS song_attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationship to songs table
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    
    -- Enhanced attribute type and ordering
    type VARCHAR(50) NOT NULL, -- chord_progression, lyrics, tab_data, song_structure, metadata
    sequence_order INTEGER DEFAULT 0, -- For ordering attributes of same type
    
    -- Enhanced section information
    section_label VARCHAR(100), -- e.g., "Guitar Solo", "Verse 1", "fig. a", "Chorus"
    section_type VARCHAR(50), -- verse, chorus, bridge, solo, intro, outro, instrumental
    
    -- Enhanced timing information (for video synchronization)
    start_time VARCHAR(10), -- MM:SS format (e.g., "1:34")
    end_time VARCHAR(10), -- MM:SS format (e.g., "2:42")
    
    -- Enhanced tab-specific fields
    instrument_type VARCHAR(50), -- Override song-level instrument type if different
    tuning VARCHAR(100), -- Override song-level tuning if different
    repeat_count INTEGER, -- e.g., 2x, 6x, etc.
    difficulty_marker VARCHAR(50), -- "beginner", "intermediate", "advanced" for this section
    
    -- Enhanced data storage
    data JSONB NOT NULL, -- Store any structured data
    tab_data JSONB, -- Specific tab notation data
    chord_data JSONB, -- Extracted chord information
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_format CHECK (
        start_time IS NULL OR start_time ~ '^[0-9]+:[0-5][0-9]$'
    ),
    CONSTRAINT valid_time_format_end CHECK (
        end_time IS NULL OR end_time ~ '^[0-9]+:[0-5][0-9]$'
    ),
    CONSTRAINT valid_repeat_count CHECK (repeat_count > 0 AND repeat_count < 1000),
    CONSTRAINT valid_section_type CHECK (
        section_type IN ('verse', 'chorus', 'bridge', 'solo', 'intro', 'outro', 'instrumental', 'fill', 'break')
    )
);

-- =====================================================
-- TABLE 3: song_sections (NEW - for detailed song structure)
-- =====================================================

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

-- =====================================================
-- TABLE 4: song_chord_progressions (NEW - for chord analysis)
-- =====================================================

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
-- ENHANCED INDEXES for performance
-- =====================================================

-- Songs table indexes
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_ug_tab_id ON songs(ug_tab_id);
CREATE INDEX IF NOT EXISTS idx_songs_difficulty ON songs(difficulty);
CREATE INDEX IF NOT EXISTS idx_songs_instrument ON songs(instrument_type);
CREATE INDEX IF NOT EXISTS idx_songs_created_by ON songs(created_by);
CREATE INDEX IF NOT EXISTS idx_songs_genre_year ON songs(genre, year);

-- Song attributes indexes
CREATE INDEX IF NOT EXISTS idx_song_attributes_song_id ON song_attributes(song_id);
CREATE INDEX IF NOT EXISTS idx_song_attributes_type ON song_attributes(type);
CREATE INDEX IF NOT EXISTS idx_song_attributes_timing ON song_attributes(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_song_attributes_section ON song_attributes(section_type, section_label);
CREATE INDEX IF NOT EXISTS idx_song_attributes_data ON song_attributes USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_song_attributes_tab_data ON song_attributes USING GIN(tab_data);

-- Song sections indexes
CREATE INDEX IF NOT EXISTS idx_song_sections_song_id ON song_sections(song_id);
CREATE INDEX IF NOT EXISTS idx_song_sections_type ON song_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_song_sections_timing ON song_sections(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_song_sections_sequence ON song_sections(song_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_song_sections_parent ON song_sections(parent_section_id);

-- Chord progression indexes
CREATE INDEX IF NOT EXISTS idx_chord_progressions_song_id ON song_chord_progressions(song_id);
CREATE INDEX IF NOT EXISTS idx_chord_progressions_section ON song_chord_progressions(section_id);
CREATE INDEX IF NOT EXISTS idx_chord_progressions_timing ON song_chord_progressions(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_chord_progressions_chord ON song_chord_progressions(chord_name);
CREATE INDEX IF NOT EXISTS idx_chord_progressions_sequence ON song_chord_progressions(song_id, sequence_order);

-- =====================================================
-- ENHANCED ENUM for attribute types
-- =====================================================

DO $$ BEGIN
    CREATE TYPE enhanced_attribute_type AS ENUM (
        'chord_progression',    -- Chord changes with timing
        'lyrics',               -- Song lyrics with timing
        'tab_data',             -- Guitar tab notation
        'song_structure',       -- Verse, chorus, bridge sections
        'chord_diagrams',       -- Individual chord fingerings
        'practice_markers',     -- Loop points, difficulty sections
        'metadata',             -- Additional song information
        'performance_notes',    -- How to play sections
        'timing_markers',       -- Time signatures, tempo changes
        'instrument_specific'   -- Instrument-specific instructions
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the song_attributes table to use the enhanced enum
ALTER TABLE song_attributes 
ALTER COLUMN type TYPE enhanced_attribute_type USING type::enhanced_attribute_type;

-- =====================================================
-- ENHANCED HELPER FUNCTIONS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
-- TRIGGERS to automatically update updated_at
-- =====================================================

CREATE TRIGGER update_songs_updated_at 
    BEFORE UPDATE ON songs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_song_attributes_updated_at 
    BEFORE UPDATE ON song_attributes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_song_sections_updated_at 
    BEFORE UPDATE ON song_sections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chord_progressions_updated_at 
    BEFORE UPDATE ON song_chord_progressions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_chord_progressions ENABLE ROW LEVEL SECURITY;

-- Songs table policies
CREATE POLICY "Users can view all songs" ON songs
    FOR SELECT USING (true);

CREATE POLICY "Users can create songs" ON songs
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own songs" ON songs
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own songs" ON songs
    FOR DELETE USING (auth.uid() = created_by);

-- Song attributes policies
CREATE POLICY "Users can view all song attributes" ON song_attributes
    FOR SELECT USING (true);

CREATE POLICY "Users can create song attributes for their songs" ON song_attributes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM songs 
            WHERE songs.id = song_attributes.song_id 
            AND songs.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update attributes for their songs" ON song_attributes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM songs 
            WHERE songs.id = song_attributes.song_id 
            AND songs.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete attributes for their songs" ON song_attributes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM songs 
            WHERE songs.id = song_attributes.song_id 
            AND songs.created_by = auth.uid()
        )
    );

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
-- VERIFICATION QUERIES (uncomment to run)
-- =====================================================

-- Check if tables were created successfully
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('songs', 'song_attributes', 'song_sections', 'song_chord_progressions');

-- Check table structure
-- \d songs
-- \d song_attributes
-- \d song_sections
-- \d song_chord_progressions

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('songs', 'song_attributes', 'song_sections', 'song_chord_progressions');

-- =====================================================
-- MIGRATION NOTES
-- =====================================================

-- If you're upgrading from the previous schema:
-- 1. Run this enhanced schema first
-- 2. The new tables will be created alongside existing ones
-- 3. You can gradually migrate data from song_attributes to song_sections
-- 4. The enhanced song_attributes table is backward compatible

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example: Find all guitar songs with timing markers
-- SELECT s.title, s.artist, sa.start_time, sa.end_time, sa.section_label
-- FROM songs s
-- JOIN song_attributes sa ON s.id = sa.song_id
-- WHERE s.instrument_type = 'guitar' 
-- AND sa.start_time IS NOT NULL
-- ORDER BY s.title, sa.start_time;

-- Example: Get complete song structure with sections
-- SELECT s.title, s.artist, ss.section_name, ss.section_type, 
--        ss.start_time, ss.end_time, ss.repeat_count
-- FROM songs s
-- JOIN song_sections ss ON s.id = ss.song_id
-- WHERE s.id = 'your-song-id'
-- ORDER BY ss.sequence_order;

-- Example: Extract chord progression with timing
-- SELECT cp.chord_name, cp.start_time, cp.end_time, cp.duration_seconds
-- FROM song_chord_progressions cp
-- WHERE cp.song_id = 'your-song-id'
-- ORDER BY cp.sequence_order;
