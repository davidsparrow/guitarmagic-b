-- =====================================================
-- YOUTUBE VIDEO SAAS PLATFORM - SUPABASE SCHEMA
-- =====================================================
-- Updated to match current Supabase database exactly

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ADMIN SETTINGS TABLE
-- =====================================================
-- Store admin-configurable settings and feature gates
CREATE TABLE public.admin_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key TEXT NOT NULL,
    setting_name TEXT NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. USER PROFILES TABLE
-- =====================================================
-- Extends Supabase auth.users with additional profile info
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'roadie', 'hero')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
    stripe_customer_id TEXT UNIQUE,
    trial_ends_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    daily_searches_used INTEGER DEFAULT 0,
    last_search_reset DATE DEFAULT CURRENT_DATE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. SUBSCRIPTIONS TABLE
-- =====================================================
-- Track subscription history and details
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
    tier TEXT NOT NULL CHECK (tier IN ('free', 'roadie', 'hero')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. BILLING HISTORY TABLE
-- =====================================================
-- Track all billing events and transactions
CREATE TABLE public.billing_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    amount_paid INTEGER, -- in cents
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
    billing_reason TEXT, -- subscription_create, subscription_cycle, etc.
    invoice_pdf TEXT, -- URL to Stripe invoice PDF
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. CAPTIONS TABLE
-- =====================================================
-- Store user-created video captions
CREATE TABLE public.captions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    favorite_id UUID REFERENCES public.favorites(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    row_type INTEGER NOT NULL, -- 1=Text, 2=Chords, 3=Auto-Gen
    start_time TEXT NOT NULL, -- Format: "MM:SS"
    end_time TEXT NOT NULL, -- Format: "MM:SS"
    line1 TEXT, -- First line of caption
    line2 TEXT, -- Second line of caption
    serial_number INTEGER, -- Sequential number based on start_time sorting
    is_shared BOOLEAN DEFAULT false,
    original_caption_id UUID REFERENCES public.captions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. CHANNEL WATCH TIME TABLE
-- =====================================================
-- Track user watch time for videos and channels
CREATE TABLE public.channel_watch_time (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL, -- YouTube video ID
    video_title TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    channel_id TEXT,
    watch_time_seconds INTEGER NOT NULL,
    watch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    watch_timestamp_start TIMESTAMPTZ, -- Session start time
    watch_timestamp_stop TIMESTAMPTZ, -- Session end time
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. CREATOR PAYOUTS TABLE
-- =====================================================
-- Track revenue sharing with content creators
CREATE TABLE public.creator_payouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_name TEXT NOT NULL,
    channel_id TEXT,
    payout_month DATE NOT NULL,
    total_watch_time_minutes INTEGER NOT NULL,
    total_users INTEGER NOT NULL,
    revenue_share_amount NUMERIC NOT NULL,
    payout_status TEXT DEFAULT 'pending',
    stripe_payout_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. CUSTOM LOOPS TABLE
-- =====================================================
-- Store premium users' custom video loops
CREATE TABLE public.custom_loops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL, -- YouTube video ID
    video_title TEXT,
    video_thumbnail TEXT,
    loop_name TEXT NOT NULL,
    start_time_seconds DECIMAL(10,3) NOT NULL, -- Precise timing
    end_time_seconds DECIMAL(10,3) NOT NULL,
    loop_settings JSONB DEFAULT '{}', -- flip settings, speed, etc.
    is_public BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. FAVORITES TABLE
-- =====================================================
-- Store user's favorite videos
CREATE TABLE public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL, -- YouTube video ID
    video_title TEXT NOT NULL,
    video_thumbnail TEXT,
    video_channel TEXT,
    video_duration_seconds INTEGER,
    video_channel_id TEXT,
    is_public BOOLEAN DEFAULT false,
    share_token UUID DEFAULT uuid_generate_v4(),
    share_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. FEATURE GATES TABLE
-- =====================================================
-- Dynamic feature flag system
CREATE TABLE public.feature_gates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    feature_key TEXT UNIQUE NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT,
    required_tier TEXT[] DEFAULT ARRAY['premium'], -- Which tiers can access
    is_enabled BOOLEAN DEFAULT TRUE,
    rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. PUBLIC LEADERBOARD TABLE
-- =====================================================
-- Monthly leaderboard for content creators
CREATE TABLE public.public_leaderboard (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_name TEXT NOT NULL,
    channel_id TEXT,
    total_watch_time_minutes INTEGER NOT NULL,
    total_users INTEGER NOT NULL,
    rank_position INTEGER NOT NULL,
    revenue_share_amount NUMERIC NOT NULL,
    leaderboard_month DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. SAVED SEARCHES TABLE
-- =====================================================
-- Store user's search history
CREATE TABLE public.saved_searches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    search_metadata JSONB DEFAULT '{}', -- API response metadata
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 13. SHARING LINKS TABLE
-- =====================================================
-- Manage shared content links
CREATE TABLE public.sharing_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    favorite_id UUID REFERENCES public.favorites(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    share_token UUID DEFAULT uuid_generate_v4(),
    share_type TEXT DEFAULT 'captions',
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 14. USER USAGE TABLE
-- =====================================================
-- Track daily/monthly usage limits and analytics
CREATE TABLE public.user_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    searches_count INTEGER DEFAULT 0,
    videos_played INTEGER DEFAULT 0,
    loops_created INTEGER DEFAULT 0,
    total_watch_time_minutes INTEGER DEFAULT 0,
    features_used JSONB DEFAULT '[]', -- ['flip_vertical', 'flip_horizontal', 'custom_loop']
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Admin settings indexes
CREATE INDEX idx_admin_settings_key ON public.admin_settings(setting_key);
CREATE INDEX idx_admin_settings_active ON public.admin_settings(is_active);

-- User profiles indexes
CREATE INDEX idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_subscription_status ON public.user_profiles(subscription_status);
CREATE INDEX idx_user_profiles_stripe_customer ON public.user_profiles(stripe_customer_id);

-- Subscriptions indexes  
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Billing history indexes
CREATE INDEX idx_billing_history_user_id ON public.billing_history(user_id);
CREATE INDEX idx_billing_history_created_at ON public.billing_history(created_at DESC);

-- Captions indexes
CREATE INDEX idx_captions_favorite_id ON public.captions(favorite_id);
CREATE INDEX idx_captions_user_id ON public.captions(user_id);
CREATE INDEX idx_captions_row_type ON public.captions(row_type);

-- Channel watch time indexes
CREATE INDEX idx_channel_watch_time_user_id ON public.channel_watch_time(user_id);
CREATE INDEX idx_channel_watch_time_video_id ON public.channel_watch_time(video_id);
CREATE INDEX idx_channel_watch_time_date ON public.channel_watch_time(watch_date);
CREATE INDEX idx_channel_watch_time_channel ON public.channel_watch_time(channel_name);

-- Creator payouts indexes
CREATE INDEX idx_creator_payouts_channel ON public.creator_payouts(channel_name);
CREATE INDEX idx_creator_payouts_month ON public.creator_payouts(payout_month);

-- Custom loops indexes
CREATE INDEX idx_custom_loops_user_id ON public.custom_loops(user_id);
CREATE INDEX idx_custom_loops_video_id ON public.custom_loops(video_id);
CREATE INDEX idx_custom_loops_public ON public.custom_loops(is_public) WHERE is_public = TRUE;

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_video_id ON public.favorites(video_id);
CREATE INDEX idx_favorites_public ON public.favorites(is_public) WHERE is_public = TRUE;

-- Feature gates indexes
CREATE INDEX idx_feature_gates_key ON public.feature_gates(feature_key);
CREATE INDEX idx_feature_gates_enabled ON public.feature_gates(is_enabled);

-- Public leaderboard indexes
CREATE INDEX idx_public_leaderboard_month ON public.public_leaderboard(leaderboard_month);
CREATE INDEX idx_public_leaderboard_rank ON public.public_leaderboard(rank_position);

-- Saved searches indexes
CREATE INDEX idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX idx_saved_searches_created_at ON public.saved_searches(created_at DESC);
CREATE INDEX idx_saved_searches_favorites ON public.saved_searches(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Sharing links indexes
CREATE INDEX idx_sharing_links_token ON public.sharing_links(share_token);
CREATE INDEX idx_sharing_links_favorite ON public.sharing_links(favorite_id);
CREATE INDEX idx_sharing_links_active ON public.sharing_links(is_active) WHERE is_active = TRUE;

-- Usage tracking indexes
CREATE INDEX idx_user_usage_user_date ON public.user_usage(user_id, date);
CREATE INDEX idx_user_usage_date ON public.user_usage(date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_watch_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharing_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Admin settings policies (admin only)
CREATE POLICY "Only admins can manage admin settings" ON public.admin_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User profiles policies (OPTIMIZED for performance)
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

-- Subscriptions policies (OPTIMIZED for performance)
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Billing history policies (OPTIMIZED for performance)
CREATE POLICY "Users can view own billing history" ON public.billing_history
    FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Captions policies (OPTIMIZED for performance)
CREATE POLICY "Users can manage own captions" ON public.captions
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- Channel watch time policies (OPTIMIZED for performance)
CREATE POLICY "Users can manage own watch time" ON public.channel_watch_time
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- Creator payouts policies (read-only for all)
CREATE POLICY "Anyone can view creator payouts" ON public.creator_payouts
    FOR SELECT USING (true);

-- Custom loops policies (OPTIMIZED for performance)
CREATE POLICY "Users can manage own loops" ON public.custom_loops
    FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Anyone can view public loops" ON public.custom_loops
    FOR SELECT USING (is_public = TRUE);

-- Favorites policies (OPTIMIZED for performance)
CREATE POLICY "Users can manage own favorites" ON public.favorites
    FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Anyone can view public favorites" ON public.favorites
    FOR SELECT USING (is_public = TRUE);

-- Feature gates policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view feature gates" ON public.feature_gates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Public leaderboard policies (read-only for all)
CREATE POLICY "Anyone can view public leaderboard" ON public.public_leaderboard
    FOR SELECT USING (true);

-- Saved searches policies (OPTIMIZED for performance)
CREATE POLICY "Users can manage own searches" ON public.saved_searches
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- Sharing links policies (OPTIMIZED for performance)
CREATE POLICY "Users can manage own sharing links" ON public.sharing_links
    FOR ALL USING (created_by_user_id = (SELECT auth.uid()));

CREATE POLICY "Anyone can view active sharing links" ON public.sharing_links
    FOR SELECT USING (is_active = TRUE);

-- Usage tracking policies (OPTIMIZED for performance)
CREATE POLICY "Users can view own usage" ON public.user_usage
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own usage" ON public.user_usage
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own usage" ON public.user_usage
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION public.has_feature_access(
    user_id_param UUID,
    feature_key_param TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    feature_required_tiers TEXT[];
    feature_enabled BOOLEAN;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM public.user_profiles
    WHERE id = user_id_param;
    
    -- Get feature requirements
    SELECT required_tier, is_enabled INTO feature_required_tiers, feature_enabled
    FROM public.feature_gates
    WHERE feature_key = feature_key_param;
    
    -- Check if feature is enabled and user has required tier
    RETURN feature_enabled AND (user_tier = ANY(feature_required_tiers));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset daily search counts
CREATE OR REPLACE FUNCTION public.reset_daily_searches()
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles
    SET daily_searches_used = 0,
        last_search_reset = CURRENT_DATE
    WHERE last_search_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment search usage
CREATE OR REPLACE FUNCTION public.increment_search_usage(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_searches INTEGER;
    user_tier TEXT;
    max_searches INTEGER;
BEGIN
    -- Get current usage and tier
    SELECT daily_searches_used, subscription_tier 
    INTO current_searches, user_tier
    FROM public.user_profiles
    WHERE id = user_id_param;
    
    -- Set limits based on tier
    max_searches := CASE 
        WHEN user_tier = 'hero' THEN 999999 -- Unlimited
        WHEN user_tier = 'roadie' THEN 100 -- Roadie tier limit
        ELSE 20 -- Free tier limit
    END;
    
    -- Check if user has reached limit
    IF current_searches >= max_searches THEN
        RETURN FALSE;
    END IF;
    
    -- Increment usage
    UPDATE public.user_profiles
    SET daily_searches_used = daily_searches_used + 1
    WHERE id = user_id_param;
    
    -- Track in usage table
    INSERT INTO public.user_usage (user_id, searches_count)
    VALUES (user_id_param, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET searches_count = user_usage.searches_count + 1;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_captions_updated_at
    BEFORE UPDATE ON public.captions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channel_watch_time_updated_at
    BEFORE UPDATE ON public.channel_watch_time
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_payouts_updated_at
    BEFORE UPDATE ON public.creator_payouts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_loops_updated_at
    BEFORE UPDATE ON public.custom_loops
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_favorites_updated_at
    BEFORE UPDATE ON public.favorites
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_gates_updated_at
    BEFORE UPDATE ON public.feature_gates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_public_leaderboard_updated_at
    BEFORE UPDATE ON public.public_leaderboard
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sharing_links_updated_at
    BEFORE UPDATE ON public.sharing_links
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INITIAL FEATURE GATES DATA
-- =====================================================

INSERT INTO public.feature_gates (feature_key, feature_name, description, required_tier) VALUES
('custom_loops', 'Custom Loop Timeline', 'Ability to create custom start/stop loop points', ARRAY['roadie', 'hero']),
('save_loops', 'Save Custom Loops', 'Save and manage custom loop configurations', ARRAY['roadie', 'hero']),
('unlimited_searches', 'Unlimited Searches', 'Remove daily search limitations', ARRAY['hero']),
('search_history', 'Extended Search History', 'Access to full search history', ARRAY['roadie', 'hero']),
('advanced_controls', 'Advanced Video Controls', 'Additional video manipulation features', ARRAY['roadie', 'hero']),
('flip_controls', 'Video Flip Controls', 'Basic vertical and horizontal video flipping', ARRAY['free', 'roadie', 'hero']),
('basic_playback', 'Basic Video Playback', 'Standard video search and playback', ARRAY['free', 'roadie', 'hero']);

-- =====================================================
-- INITIAL ADMIN SETTINGS DATA
-- =====================================================

INSERT INTO public.admin_settings (setting_key, setting_name, setting_value, description, is_active) VALUES
('feature_gates', 'Feature Access Control', '{"feature_gates": {"custom_loops": {"is_enabled": true, "min_tier": "roadie", "messages": {"tier_restriction": "Requires ROADIE Plan or higher", "video_restricted": true}}, "save_loops": {"is_enabled": true, "min_tier": "roadie", "messages": {"tier_restriction": "Requires ROADIE Plan or higher", "video_restricted": true}}, "unlimited_searches": {"is_enabled": true, "min_tier": "hero", "messages": {"tier_restriction": "Requires HERO Plan or higher", "video_restricted": false}}, "search_history": {"is_enabled": true, "min_tier": "roadie", "messages": {"tier_restriction": "Requires ROADIE Plan or higher", "video_restricted": false}}, "advanced_controls": {"is_enabled": true, "min_tier": "roadie", "messages": {"tier_restriction": "Requires ROADIE Plan or higher", "video_restricted": true}}, "flip_controls": {"is_enabled": true, "min_tier": "free", "messages": {"tier_restriction": "Available to all users", "video_restricted": true}}, "basic_playback": {"is_enabled": true, "min_tier": "free", "messages": {"tier_restriction": "Available to all users", "video_restricted": false}}}, "global_settings": {"video_playing_message": "Please pause video before using this feature", "plan_upgrade_message": "🔒 This feature requires a paid plan. Please upgrade to access this feature.", "save_to_favorites_message": "⭐ Please save this video to favorites before using this feature.", "caption_trim_error": "An internal error has occurred: "}, "daily_limits": {"free": 60, "roadie": 180, "hero": 480}}', 'Controls which features are available to which subscription tiers and when', true);

-- =====================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- =====================================================

-- Note: This would be inserted automatically when users sign up
-- Just showing structure for reference

/*
-- Sample user profile (created automatically via trigger)
INSERT INTO public.user_profiles (id, email, full_name, subscription_tier) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'john@example.com', 'John Doe', 'free');

-- Sample saved search
INSERT INTO public.saved_searches (user_id, search_query, results_count) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'funny cats', 50);

-- Sample custom loop (premium feature)
INSERT INTO public.custom_loops (user_id, video_id, video_title, loop_name, start_time_seconds, end_time_seconds) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'dQw4w9WgXcQ', 'Rick Astley - Never Gonna Give You Up', 'Best Part', 30.5, 45.2);
*/