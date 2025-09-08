# 🚀 Supabase Backend Setup Guide

## 📋 Overview

This guide walks you through setting up the complete Supabase backend for your YouTube Video SaaS platform, including authentication, database schema, Row Level Security, and API configuration.

## 🛠️ Prerequisites

- Supabase account (free tier is fine for development)
- Node.js 16+ installed
- Basic familiarity with SQL and PostgreSQL

## 📦 Installation Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Wait for the project to initialize (2-3 minutes)

### 2. Install Supabase CLI (Optional but Recommended)

```bash
npm install -g @supabase/cli
```

### 3. Get Your Project Credentials

From your Supabase dashboard, go to **Settings → API** and copy:
- Project URL
- Anon/Public Key  
- Service Role Key (keep this secret!)

## 🗄️ Database Setup

### 1. Run the Schema Migration

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**  
3. Create a new query
4. Copy and paste the entire SQL schema from the previous artifact
5. Click **Run** to execute

### 2. Verify Tables Were Created

Check the **Table Editor** to confirm these tables exist:
- `user_profiles`
- `subscriptions` 
- `user_usage`
- `saved_searches`
- `custom_loops`
- `billing_history`
- `feature_gates`

## 🔐 Authentication Configuration

### 1. Configure Auth Settings

In **Authentication → Settings**:

- **Site URL**: `http://localhost:3000` (development)
- **Redirect URLs**: Add your production domains later
- **JWT Expiry**: 3600 (1 hour)
- **Refresh Token Rotation**: Enabled
- **Double Confirm Email Changes**: Enabled

### 2. Enable Auth Providers (Optional)

In **Authentication → Providers**, enable:
- Google OAuth (recommended)
- GitHub OAuth
- Keep Email auth enabled

### 3. Email Templates

Customize the email templates in **Authentication → Email Templates**:
- Welcome email
- Password reset
- Email confirmation

## 🏗️ Environment Variables

Create these environment files:

### `.env.local` (Frontend)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# YouTube API
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `.env` (Backend/Server)
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# External APIs
YOUTUBE_API_KEY=your_youtube_api_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (if using custom SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🔒 Row Level Security (RLS) Verification

Your RLS policies are automatically created by the schema. Test them:

### 1. Test User Access
```sql
-- This should only return the authenticated user's data
SELECT * FROM user_profiles WHERE id = auth.uid();
```

### 2. Test Feature Gates
```sql
-- This should work for any authenticated user
SELECT * FROM feature_gates WHERE is_enabled = true;
```

### 3. Test Premium Features
```sql
-- This should only work for premium users
SELECT has_feature_access(auth.uid(), 'custom_loops');
```

## 🎯 API Usage Examples

### Frontend Integration with Supabase Client

```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types (optional but recommended)
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          subscription_tier: 'free' | 'premium'
          subscription_status: string
          daily_searches_used: number
          // ... other fields
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          // ... other fields
        }
        Update: {
          full_name?: string | null
          subscription_tier?: 'free' | 'premium'
          // ... other fields
        }
      }
      // ... other tables
    }
  }
}
```

### Common Database Operations

```javascript
// Get user profile
const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

// Check feature access
const checkFeatureAccess = async (userId, featureKey) => {
  const { data, error } = await supabase
    .rpc('has_feature_access', {
      user_id_param: userId,
      feature_key_param: featureKey
    })
  
  return data // boolean
}

// Increment search usage
const incrementSearchUsage = async (userId) => {
  const { data, error } = await supabase
    .rpc('increment_search_usage', {
      user_id_param: userId
    })
  
  return data // boolean (true if under limit)
}

// Save a search
const saveSearch = async (userId, searchQuery, resultsCount) => {
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: userId,
      search_query: searchQuery,
      results_count: resultsCount
    })
  
  return { data, error }
}

// Create custom loop (premium feature)
const createCustomLoop = async (userId, loopData) => {
  const { data, error } = await supabase
    .from('custom_loops')
    .insert({
      user_id: userId,
      ...loopData
    })
  
  return { data, error }
}

// Get user's saved loops
const getUserLoops = async (userId) => {
  const { data, error } = await supabase
    .from('custom_loops')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}
```

## 🔄 Real-time Subscriptions

Enable real-time updates for dynamic features:

```javascript
// Listen for profile changes
const subscribeToProfile = (userId, callback) => {
  return supabase
    .channel('profile-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_profiles',
        filter: `id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

// Listen for new loops (for premium users)
const subscribeToLoops = (userId, callback) => {
  return supabase
    .channel('loop-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'custom_loops',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}
```

## 🚨 Security Best Practices

### 1. Environment Variables
- Never commit API keys to git
- Use different keys for development/production
- Rotate keys regularly

### 2. RLS Policies
- Always test policies with different user roles
- Use `auth.uid()` to ensure users only access their data
- Be careful with public data access

### 3. API Rate Limiting
```javascript
// Add to your API routes
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
}
```

## 📊 Monitoring & Analytics

### 1. Enable Supabase Analytics
- Go to **Reports** in your dashboard
- Monitor API usage, database performance
- Set up alerts for high usage

### 2. Custom Analytics Queries
```sql
-- Daily active users
SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as active_users
FROM user_usage 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Premium conversion rate
SELECT 
  COUNT(CASE WHEN subscription_tier = 'premium' THEN 1 END)::float / COUNT(*)::float * 100 as conversion_rate
FROM user_profiles;

-- Most popular features
SELECT 
  jsonb_array_elements_text(features_used) as feature,
  COUNT(*) as usage_count
FROM user_usage
WHERE features_used IS NOT NULL
GROUP BY feature
ORDER BY usage_count DESC;
```

## 🎯 Next Steps

1. **Test the schema** by creating a test user and verifying all tables work
2. **Set up Stripe integration** for subscription management
3. **Create API routes** in your Next.js app
4. **Implement authentication flows** on the frontend
5. **Add feature gating logic** to your components

## 🐛 Common Issues & Troubleshooting

### Issue: RLS blocking queries
**Solution**: Check that policies match your auth context and user ID

### Issue: Function not found
**Solution**: Make sure you ran the complete schema migration

### Issue: Auth token expired
**Solution**: Implement automatic token refresh in your client

### Issue: CORS errors
**Solution**: Add your domain to Supabase allowed origins

---

Your Supabase backend is now ready to power your YouTube Video SaaS platform! 🎉