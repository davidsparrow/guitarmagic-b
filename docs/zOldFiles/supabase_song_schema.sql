-- 🎸 Song Database Schema for Ultimate Guitar Integration
-- Copy and paste this entire script into your Supabase SQL editor

-- =====================================================
-- TABLE 1: songs (Parent table for song metadata)
-- =====================================================

CREATE TABLE IF NOT EXISTS songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic song information
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    
    -- Ultimate Guitar integration
    ug_tab_id BIGINT, -- Ultimate Guitar tab ID for future lookups
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
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT unique_song_artist UNIQUE(title, artist)
);

-- =====================================================
-- TABLE 2: song_attributes (Child table for flexible data)
-- =====================================================

CREATE TABLE IF NOT EXISTS song_attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Relationship to songs table
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    
    -- Attribute type and ordering
    type VARCHAR(50) NOT NULL, -- chord_progression, lyrics, tab_data, timing, metadata
    sequence_order INTEGER DEFAULT 0, -- For ordering attributes of same type
    
    -- Flexible data storage
    data JSONB NOT NULL, -- Store any structured data
    
    -- Timing information (for video synchronization)
    start_time VARCHAR(10), -- MM:SS format (e.g., "0:15")
    end_time VARCHAR(10), -- MM:SS format (e.g., "0:19")
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_format CHECK (
        start_time IS NULL OR start_time ~ '^[0-9]+:[0-5][0-9]$'
    ),
    CONSTRAINT valid_time_format_end CHECK (
        end_time IS NULL OR end_time ~ '^[0-9]+:[0-5][0-9]$'
    )
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

-- Songs table indexes
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_ug_tab_id ON songs(ug_tab_id);
CREATE INDEX IF NOT EXISTS idx_songs_difficulty ON songs(difficulty);
CREATE INDEX IF NOT EXISTS idx_songs_created_by ON songs(created_by);

-- Song attributes indexes
CREATE INDEX IF NOT EXISTS idx_song_attributes_song_id ON song_attributes(song_id);
CREATE INDEX IF NOT EXISTS idx_song_attributes_type ON song_attributes(type);
CREATE INDEX IF NOT EXISTS idx_song_attributes_timing ON song_attributes(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_song_attributes_data ON song_attributes USING GIN(data);

-- =====================================================
-- ENUM for attribute types (PostgreSQL enum)
-- =====================================================

DO $$ BEGIN
    CREATE TYPE attribute_type AS ENUM (
        'chord_progression',    -- Chord changes with timing
        'lyrics',               -- Song lyrics with timing
        'tab_data',             -- Guitar tab notation
        'song_structure',       -- Verse, chorus, bridge sections
        'chord_diagrams',       -- Individual chord fingerings
        'practice_markers',     -- Loop points, difficulty sections
        'metadata'              -- Additional song information
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the song_attributes table to use the enum
ALTER TABLE song_attributes 
ALTER COLUMN type TYPE attribute_type USING type::attribute_type;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_attributes ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_songs_updated_at 
    BEFORE UPDATE ON songs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_song_attributes_updated_at 
    BEFORE UPDATE ON song_attributes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES (uncomment to run)
-- =====================================================

-- Check if tables were created successfully
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('songs', 'song_attributes');

-- Check table structure
-- \d songs
-- \d song_attributes

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('songs', 'song_attributes');
