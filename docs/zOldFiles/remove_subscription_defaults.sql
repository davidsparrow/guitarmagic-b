-- Remove subscription defaults from user_profiles table
-- This fixes the issue where new users automatically get 'free' plan and can search

-- Remove the default value for subscription_tier (was 'free')
ALTER TABLE public.user_profiles 
ALTER COLUMN subscription_tier DROP DEFAULT;

-- Remove the default value for subscription_status (was 'active')  
ALTER TABLE public.user_profiles 
ALTER COLUMN subscription_status DROP DEFAULT;

-- Verify the changes
SELECT 
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('subscription_tier', 'subscription_status');

-- Expected result after running:
-- subscription_tier: column_default = NULL, is_nullable = YES
-- subscription_status: column_default = NULL, is_nullable = YES
