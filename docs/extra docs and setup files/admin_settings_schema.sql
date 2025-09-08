-- =====================================================
-- ADMIN SETTINGS TABLE - Add to your existing schema
-- =====================================================

-- Admin settings for banner and other admin features
CREATE TABLE public.admin_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_name TEXT NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only allow admin users to manage settings (you'll need to define admin role)
CREATE POLICY "Admin users can manage settings" ON public.admin_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Allow all authenticated users to read active settings
CREATE POLICY "Users can view active settings" ON public.admin_settings
    FOR SELECT USING (is_active = TRUE);

-- Index for performance
CREATE INDEX idx_admin_settings_key ON public.admin_settings(setting_key);
CREATE INDEX idx_admin_settings_active ON public.admin_settings(is_active) WHERE is_active = TRUE;

-- Update trigger
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial banner settings
INSERT INTO public.admin_settings (setting_key, setting_name, setting_value, description, is_active) VALUES
('top_banner', 'Top Announcement Banner', '{
    "enabled": false,
    "text": "🎉 Welcome to VideoFlip! Transform your YouTube experience today!",
    "backgroundColor": "#3b82f6",
    "textColor": "#ffffff",
    "fontSize": "14px",
    "fontWeight": "500",
    "scrollSpeed": 50,
    "clickable": true,
    "clickUrl": "/",
    "showButton": false,
    "buttonText": "Learn More",
    "buttonBackgroundColor": "#ffffff",
    "buttonTextColor": "#3b82f6",
    "buttonBorderColor": "#ffffff",
    "buttonHoverBackgroundColor": "#f3f4f6",
    "buttonHoverTextColor": "#1e40af",
    "buttonUrl": "/search",
    "dismissible": true,
    "boldWords": ["VideoFlip", "YouTube"]
}', 'Top banner configuration with scrolling text and optional CTA button', false);

-- Function to get admin setting
CREATE OR REPLACE FUNCTION public.get_admin_setting(setting_key_param TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT setting_value INTO result
    FROM public.admin_settings
    WHERE setting_key = setting_key_param AND is_active = TRUE;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update admin setting
CREATE OR REPLACE FUNCTION public.update_admin_setting(
    setting_key_param TEXT,
    setting_value_param JSONB,
    is_active_param BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.admin_settings
    SET 
        setting_value = setting_value_param,
        is_active = COALESCE(is_active_param, is_active),
        updated_at = NOW()
    WHERE setting_key = setting_key_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;