-- 🎸 SONG LINKING - PART 1: Database Schema Updates
-- This script adds song linking capabilities to the existing favorites table
-- and creates a new video-to-song mapping table for song variations
-- 
-- IMPORTANT: Run this AFTER the enhanced song schema is deployed
-- Run in Supabase SQL Editor

-- =====================================================
-- PART 1: Update Favorites Table to Link with Songs
-- =====================================================

-- Add uuid_song field to favorites table to link videos to UG songs
ALTER TABLE favorites 
ADD COLUMN IF NOT EXISTS uuid_song UUID REFERENCES songs(id) ON DELETE SET NULL;

-- Add index for performance on song lookups
CREATE INDEX IF NOT EXISTS idx_favorites_uuid_song ON favorites(uuid_song);

-- Add constraint to ensure video duration validation (optional)
-- This will help verify that video length matches song metadata
-- Note: We'll make this constraint more flexible to handle existing data
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_video_duration_positive' 
        AND table_name = 'favorites'
    ) THEN
        -- First, update any existing rows with invalid duration to NULL
        UPDATE favorites 
        SET video_duration_seconds = NULL 
        WHERE video_duration_seconds <= 0 OR video_duration_seconds IS NOT NULL;
        
        -- Then add the constraint (allowing NULL values)
        ALTER TABLE favorites 
        ADD CONSTRAINT check_video_duration_positive 
        CHECK (video_duration_seconds IS NULL OR video_duration_seconds > 0);
    END IF;
END $$;

-- =====================================================
-- PART 2: Create Video-to-Song Mapping Table
-- =====================================================

-- This table stores multiple song name variations to help users
-- find and link songs even when names don't match exactly
CREATE TABLE IF NOT EXISTS video_song_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Link to the main song record
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    
    -- Song variation information
    song_name_variation VARCHAR(255) NOT NULL, -- e.g., "The Prophet", "Prophet", "Yes - The Prophet"
    artist_name_variation VARCHAR(255) NOT NULL, -- e.g., "Yes", "Yes Band", "Yes (Prog Rock)"
    
    -- Video metadata for validation
    expected_video_duration_seconds INTEGER, -- Expected video length for sync validation
    video_url_pattern TEXT, -- URL pattern to help identify similar videos
    
    -- Mapping metadata
    mapping_type VARCHAR(50) DEFAULT 'user_created', -- user_created, auto_detected, ug_import
    confidence_score DECIMAL(3,2) DEFAULT 1.00, -- 0.00 to 1.00 confidence in this mapping
    
    -- User who created this mapping
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_confidence_score CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    CONSTRAINT valid_video_duration CHECK (expected_video_duration_seconds > 0),
    CONSTRAINT unique_song_variation UNIQUE(song_id, song_name_variation, artist_name_variation)
);

-- =====================================================
-- PART 3: Indexes for Performance
-- =====================================================

-- Indexes for video_song_mappings table
CREATE INDEX IF NOT EXISTS idx_video_song_mappings_song_id ON video_song_mappings(song_id);
CREATE INDEX IF NOT EXISTS idx_video_song_mappings_name_variation ON video_song_mappings(song_name_variation);
CREATE INDEX IF NOT EXISTS idx_video_song_mappings_artist_variation ON video_song_mappings(artist_name_variation);
CREATE INDEX IF NOT EXISTS idx_video_song_mappings_combined_search ON video_song_mappings(song_name_variation, artist_name_variation);
CREATE INDEX IF NOT EXISTS idx_video_song_mappings_created_by ON video_song_mappings(created_by);

-- Composite index for fast song lookups
CREATE INDEX IF NOT EXISTS idx_video_song_mappings_lookup ON video_song_mappings(song_name_variation, artist_name_variation, song_id);

-- =====================================================
-- PART 4: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on the new table
ALTER TABLE video_song_mappings ENABLE ROW LEVEL SECURITY;

-- Users can view all mappings (for song discovery)
CREATE POLICY "Users can view all video-song mappings" ON video_song_mappings
    FOR SELECT USING (true);

-- Users can create mappings for any song
CREATE POLICY "Users can create video-song mappings" ON video_song_mappings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own mappings
CREATE POLICY "Users can update their own mappings" ON video_song_mappings
    FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own mappings
CREATE POLICY "Users can delete their own mappings" ON video_song_mappings
    FOR DELETE USING (auth.uid() = created_by);

-- =====================================================
-- PART 5: Triggers for Automatic Updates
-- =====================================================

-- Trigger to update the updated_at timestamp
CREATE TRIGGER update_video_song_mappings_updated_at 
    BEFORE UPDATE ON video_song_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PART 6: Verification Queries (uncomment to run)
-- =====================================================

-- Check if the favorites table was updated successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'favorites' 
-- AND column_name = 'uuid_song';

-- Check if the new table was created successfully
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name = 'video_song_mappings';

-- Check the structure of the new table
-- \d video_song_mappings

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'video_song_mappings';

-- =====================================================
-- PART 7: Sample Data Insertion (Optional)
-- =====================================================

-- Example: Insert a sample mapping for "The Prophet" by Yes
-- (Uncomment and modify as needed for testing)
/*
INSERT INTO video_song_mappings (
    song_id,
    song_name_variation,
    artist_name_variation,
    expected_video_duration_seconds,
    mapping_type,
    created_by
) VALUES (
    (SELECT id FROM songs WHERE title = 'The Prophet' AND artist = 'Yes' LIMIT 1),
    'The Prophet',
    'Yes',
    300, -- 5 minutes
    'ug_import',
    NULL -- System import
);
*/

-- =====================================================
-- IMPLEMENTATION NOTES
-- =====================================================

-- This update provides:
-- 1. Direct linking between favorites (videos) and songs via uuid_song
-- 2. Flexible song name variations for easier discovery
-- 3. Video duration validation for sync accuracy
-- 4. Proper indexing for performance
-- 5. RLS policies for security
-- 6. Automatic timestamp updates

-- Next steps:
-- 1. Run this script in Supabase
-- 2. Verify table structure and constraints
-- 3. Proceed to Part 2: Helper Functions
-- 4. Test the new linking capabilities
