-- RLS Performance Optimization
-- Fixes Supabase warnings about auth.uid() re-evaluation
-- Run this in your Supabase SQL editor

-- =====================================================
-- DROP EXISTING INEFFICIENT POLICIES
-- =====================================================

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;

-- Billing history policies
DROP POLICY IF EXISTS "Users can view own billing history" ON public.billing_history;

-- Captions policies
DROP POLICY IF EXISTS "Users can manage own captions" ON public.captions;

-- Channel watch time policies
DROP POLICY IF EXISTS "Users can manage own watch time" ON public.channel_watch_time;

-- Custom loops policies
DROP POLICY IF EXISTS "Users can manage own loops" ON public.custom_loops;

-- Favorites policies
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;

-- Saved searches policies
DROP POLICY IF EXISTS "Users can manage own searches" ON public.saved_searches;

-- Sharing links policies
DROP POLICY IF EXISTS "Users can manage own sharing links" ON public.sharing_links;

-- Usage tracking policies
DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users can insert own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON public.user_usage;

-- =====================================================
-- CREATE OPTIMIZED POLICIES
-- =====================================================

-- User profiles policies (OPTIMIZED)
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

-- Subscriptions policies (OPTIMIZED)
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Billing history policies (OPTIMIZED)
CREATE POLICY "Users can view own billing history" ON public.billing_history
    FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Captions policies (OPTIMIZED)
CREATE POLICY "Users can manage own captions" ON public.captions
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- Channel watch time policies (OPTIMIZED)
CREATE POLICY "Users can manage own watch time" ON public.channel_watch_time
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- Custom loops policies (OPTIMIZED)
CREATE POLICY "Users can manage own loops" ON public.custom_loops
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- Favorites policies (OPTIMIZED)
CREATE POLICY "Users can manage own favorites" ON public.favorites
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- Saved searches policies (OPTIMIZED)
CREATE POLICY "Users can manage own searches" ON public.saved_searches
    FOR ALL USING (user_id = (SELECT auth.uid()));

-- Sharing links policies (OPTIMIZED)
CREATE POLICY "Users can manage own sharing links" ON public.sharing_links
    FOR ALL USING (created_by_user_id = (SELECT auth.uid()));

-- Usage tracking policies (OPTIMIZED)
CREATE POLICY "Users can view own usage" ON public.user_usage
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own usage" ON public.user_usage
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own usage" ON public.user_usage
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Check that all policies are now optimized
-- This should show no more performance warnings
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
