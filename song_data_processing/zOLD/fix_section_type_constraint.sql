-- 🔧 Fix Section Type Constraint
-- Add missing section types that are found in actual UG data

-- First, drop the existing constraint
ALTER TABLE song_sections DROP CONSTRAINT IF EXISTS valid_section_type;

-- Recreate the constraint with additional section types
ALTER TABLE song_sections ADD CONSTRAINT valid_section_type CHECK (
    section_type IN (
        'verse', 'chorus', 'bridge', 'solo', 'intro', 'outro', 
        'instrumental', 'fill', 'break', 'transition', 'harmonies',
        'section', 'pre-chorus', 'post-chorus', 'interlude', 'coda'
    )
);

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'valid_section_type';
