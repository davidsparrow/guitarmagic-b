// lib/adminSupabase.js - Server-side Supabase client with service role
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase server environment variables')
}

// This client bypasses RLS and has full access
export const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Get admin setting by key
 * @param {string} settingKey - The setting key to fetch
 * @returns {Promise<Object>} The setting value or empty object
 */
export const getAdminSetting = async (settingKey) => {
  try {
    const { data, error } = await adminSupabase
      .rpc('get_admin_setting', { setting_key_param: settingKey })

    if (error) throw error
    return data || {}
  } catch (error) {
    console.error(`Error fetching admin setting ${settingKey}:`, error)
    return {}
  }
}

/**
 * Update admin setting
 * @param {string} settingKey - The setting key to update
 * @param {Object} settingValue - The setting value object
 * @param {boolean} isActive - Whether the setting should be active
 * @returns {Promise<boolean>} Success status
 */
export const updateAdminSetting = async (settingKey, settingValue, isActive = true) => {
  try {
    const { error } = await adminSupabase
      .rpc('update_admin_setting', {
        setting_key_param: settingKey,
        setting_value_param: settingValue,
        is_active_param: isActive
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error(`Error updating admin setting ${settingKey}:`, error)
    return false
  }
}

/**
 * Get all admin settings
 * @returns {Promise<Array>} Array of all admin settings
 */
export const getAllAdminSettings = async () => {
  try {
    const { data, error } = await adminSupabase
      .from('admin_settings')
      .select('*')
      .order('setting_name')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all admin settings:', error)
    return []
  }
}

/**
 * Create new admin setting
 * @param {string} settingKey - Unique setting key
 * @param {string} settingName - Display name
 * @param {Object} settingValue - Setting value object
 * @param {string} description - Setting description
 * @param {boolean} isActive - Whether setting is active
 * @returns {Promise<boolean>} Success status
 */
export const createAdminSetting = async (settingKey, settingName, settingValue, description = '', isActive = false) => {
  try {
    const { error } = await adminSupabase
      .from('admin_settings')
      .insert({
        setting_key: settingKey,
        setting_name: settingName,
        setting_value: settingValue,
        description,
        is_active: isActive
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error creating admin setting:', error)
    return false
  }
}

/**
 * Delete admin setting
 * @param {string} settingKey - The setting key to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteAdminSetting = async (settingKey) => {
  try {
    const { error } = await adminSupabase
      .from('admin_settings')
      .delete()
      .eq('setting_key', settingKey)

    if (error) throw error
    return true
  } catch (error) {
    console.error(`Error deleting admin setting ${settingKey}:`, error)
    return false
  }
}

/**
 * Check if user has admin privileges
 * @returns {Promise<boolean>} Whether user is admin
 */
export const isUserAdmin = async () => {
  try {
    const { data: { user } } = await adminSupabase.auth.getUser()
    
    if (!user) return false
    
    // Check if user has admin role in JWT or user metadata
    const userRole = user.app_metadata?.role || user.user_metadata?.role
    return userRole === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}