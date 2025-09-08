-- Add missing resume-related columns to user_profiles table
-- This script adds the columns needed for the Login-Resume feature

-- Add resume feature toggle
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS resume_enabled BOOLEAN DEFAULT true;

-- Add last video session tracking columns
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS last_video_id TEXT,
ADD COLUMN IF NOT EXISTS last_video_timestamp NUMERIC,
ADD COLUMN IF NOT EXISTS last_video_title TEXT,
ADD COLUMN IF NOT EXISTS last_video_channel_id TEXT,
ADD COLUMN IF NOT EXISTS last_video_channel_name TEXT,
ADD COLUMN IF NOT EXISTS last_session_date TIMESTAMPTZ;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_resume_enabled ON public.user_profiles(resume_enabled);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_video_id ON public.user_profiles(last_video_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_session_date ON public.user_profiles(last_session_date);

-- Update existing users to have resume enabled by default
UPDATE public.user_profiles 
SET resume_enabled = true 
WHERE resume_enabled IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.resume_enabled IS 'Whether the user has access to the resume feature';
COMMENT ON COLUMN public.user_profiles.last_video_id IS 'YouTube video ID of the last watched video';
COMMENT ON COLUMN public.user_profiles.last_video_timestamp IS 'Timestamp in seconds where user left off';
COMMENT ON COLUMN public.user_profiles.last_video_title IS 'Title of the last watched video';
COMMENT ON COLUMN public.user_profiles.last_video_channel_id IS 'YouTube channel ID of the last video';
COMMENT ON COLUMN public.user_profiles.last_video_channel_name IS 'Name of the channel for the last video';
COMMENT ON COLUMN public.user_profiles.last_session_date IS 'When the last session was saved';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN (
    'resume_enabled',
    'last_video_id',
    'last_video_timestamp',
    'last_video_title',
    'last_video_channel_id',
    'last_video_channel_name',
    'last_session_date'
)
ORDER BY column_name;
