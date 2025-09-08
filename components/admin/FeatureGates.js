// components/admin/FeatureGates.js - Feature Gates Management Component
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase/client'

export default function FeatureGates() {
  const [featureGates, setFeatureGates] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingFeature, setEditingFeature] = useState(null)



  // Load feature gates from admin settings
  useEffect(() => {
    loadFeatureGates()
  }, [])

  const loadFeatureGates = async () => {
    try {
      setLoading(true)
      
      // Load feature gates
      const { data: featureGatesData, error: featureGatesError } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', 'feature_gates')
        .single()

      if (featureGatesError) throw featureGatesError

      // Load error messages
      const { data: errorMessagesData, error: errorMessagesError } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', 'error_messages')
        .single()

      if (errorMessagesError && errorMessagesError.code !== 'PGRST116') {
        console.error('Error loading error messages:', errorMessagesError)
      }

      // Combine both configurations
      const combinedConfig = {
        ...(featureGatesData?.setting_value || {}),
        error_messages: errorMessagesData?.setting_value || {}
      }

      setFeatureGates(combinedConfig)
    } catch (error) {
      console.error('FeatureGates: ERROR in loadFeatureGates:', error)
      console.error('FeatureGates: Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      })
      setMessage('Error loading feature gates')
    } finally {
      setLoading(false)
    }
  }

  const saveFeatureGates = async () => {
    try {
      setSaving(true)
      
      // Save feature gates
      const { error: featureGatesError } = await supabase
        .from('admin_settings')
        .update({ 
          setting_value: {
            feature_gates: featureGates.feature_gates,
            global_settings: featureGates.global_settings,
            daily_limits: featureGates.daily_limits
          },
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'feature_gates')

      if (featureGatesError) throw featureGatesError

      // Save error messages if they exist
      if (featureGates.error_messages) {
        const { error: errorMessagesError } = await supabase
          .from('admin_settings')
          .upsert({
            setting_key: 'error_messages',
            setting_name: 'Error Messages',
            description: 'Application-wide error messages that can be customized by administrators',
            setting_value: featureGates.error_messages,
            is_active: true,
            updated_at: new Date().toISOString()
          })

        if (errorMessagesError) throw errorMessagesError
      }

      setMessage('Feature gates and error messages saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const updateFeature = (featureKey, updates) => {
    setFeatureGates(prev => ({
      ...prev,
      feature_gates: {
        ...prev.feature_gates,
        [featureKey]: {
          ...prev.feature_gates[featureKey],
          ...updates
        }
      }
    }))
  }

  const updateGlobalSetting = (key, value) => {
    setFeatureGates(prev => ({
      ...prev,
      global_settings: {
        ...prev.global_settings,
        [key]: value
      }
    }))
  }

  const updateErrorMessage = (key, value) => {
    setFeatureGates(prev => ({
      ...prev,
      error_messages: {
        ...prev.error_messages,
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  if (!featureGates) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Gates</h2>
        <p className="text-gray-600">No feature gates configuration found.</p>
      </div>
    )
  }

  const features = featureGates.feature_gates || {}
  const globalSettings = featureGates.global_settings || {}

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Feature Gates</h2>
        <button
          onClick={saveFeatureGates}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Global Settings */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Playing Restriction Message
            </label>
            <input
              type="text"
              value={globalSettings.video_playing_message || ''}
              onChange={(e) => updateGlobalSetting('video_playing_message', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please pause video before using this feature"
            />
            <p className="text-xs text-gray-500 mt-1">Message shown when users try to use features while video is playing</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Upgrade Message
            </label>
            <input
              type="text"
              value={globalSettings.plan_upgrade_message || ''}
              onChange={(e) => updateGlobalSetting('plan_upgrade_message', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="🔒 This feature requires a paid plan. Please upgrade to access this feature."
            />
            <p className="text-xs text-gray-500 mt-1">Message shown when free users try to access paid features</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Save to Favorites Message
            </label>
            <input
              type="text"
              value={globalSettings.save_to_favorites_message || ''}
              onChange={(e) => updateGlobalSetting('save_to_favorites_message', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="⭐ Please save this video to favorites before using this feature."
            />
            <p className="text-xs text-gray-500 mt-1">Message shown when users try to use features without saving video to favorites</p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      <div className="mb-8 p-4 bg-red-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Messages</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption Trim Error Intro
            </label>
            <input
              type="text"
              value={featureGates?.error_messages?.caption_trim_error || ''}
              onChange={(e) => updateErrorMessage('caption_trim_error', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="An internal error has occurred: "
            />
            <p className="text-xs text-gray-500 mt-1">Intro text shown before caption trimming error details</p>
          </div>
        </div>
      </div>

      {/* Feature List */}
      <div className="space-y-6">
        {Object.entries(features).map(([featureKey, feature]) => (
          <div key={featureKey} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{feature.display_name}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={feature.is_enabled}
                    onChange={(e) => updateFeature(featureKey, { is_enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enabled</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tier Requirement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Tier
                </label>
                <select
                  value={feature.min_tier}
                  onChange={(e) => updateFeature(featureKey, { min_tier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">FREE</option>
                  <option value="roadie">ROADIE</option>
                  <option value="hero">HERO</option>
                </select>
              </div>

              {/* Video Restriction */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={feature.video_restricted}
                    onChange={(e) => updateFeature(featureKey, { video_restricted: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Restricted while video playing</span>
                </label>
              </div>
            </div>

            {/* Messages Section */}
            {feature.messages && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Custom Messages</h5>
                <div className="space-y-2">
                  {feature.messages.tier_restriction && (
                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        Tier Restriction Message
                      </label>
                      <input
                        type="text"
                        value={feature.messages.tier_restriction}
                        onChange={(e) => updateFeature(featureKey, {
                          messages: {
                            ...feature.messages,
                            tier_restriction: e.target.value
                          }
                        })}
                        className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  {feature.messages.video_playing && (
                    <div>
                      <label className="block text-xs font-medium text-blue-700 mb-1">
                        Video Playing Message
                      </label>
                      <input
                        type="text"
                        value={feature.messages.video_playing}
                        onChange={(e) => updateFeature(featureKey, {
                          messages: {
                            ...feature.messages,
                            video_playing: e.target.value
                          }
                        })}
                        className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upgrade Button Settings */}
            {feature.upgrade_button && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <h5 className="text-sm font-medium text-green-900 mb-2">Upgrade Button</h5>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={feature.upgrade_button.enabled}
                      onChange={(e) => updateFeature(featureKey, {
                        upgrade_button: {
                          ...feature.upgrade_button,
                          enabled: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-xs text-green-700">Show upgrade button</span>
                  </div>
                  {feature.upgrade_button.enabled && (
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">
                        Button Text
                      </label>
                      <input
                        type="text"
                        value={feature.upgrade_button.text}
                        onChange={(e) => updateFeature(featureKey, {
                          upgrade_button: {
                            ...feature.upgrade_button,
                            text: e.target.value
                          }
                        })}
                        className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={saveFeatureGates}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving Changes...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  )
}
