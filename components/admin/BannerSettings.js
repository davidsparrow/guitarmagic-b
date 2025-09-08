// components/admin/BannerSettings.js - Admin only interface for banner management
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase/client'

const BannerSettings = () => {
  const [config, setConfig] = useState({
    enabled: false,
    text: "🎉 Welcome to VideoFlip! Transform your YouTube experience today!",
    backgroundColor: "#3b82f6",
    textColor: "#ffffff",
    fontSize: "14px",
    fontWeight: "500",
    scrollSpeed: 50,
    clickable: true,
    clickUrl: "/",
    showButton: false,
    buttonText: "Learn More",
    buttonBackgroundColor: "#ffffff",
    buttonTextColor: "#3b82f6",
    buttonBorderColor: "#ffffff",
    buttonHoverBackgroundColor: "#f3f4f6",
    buttonHoverTextColor: "#1e40af",
    buttonUrl: "/search",
    dismissible: true,
    boldWords: ["VideoFlip", "YouTube"],
    startTime: "",
    stopTime: ""
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_admin_setting', { setting_key_param: 'top_banner' })

        if (error) throw error

        if (data && Object.keys(data).length > 0) {
          setConfig({ ...config, ...data })
        }
      } catch (error) {
        console.error('Error loading banner settings:', error)
        setMessage('Error loading settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Save settings
  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const { data, error } = await supabase
        .rpc('update_admin_setting', {
          setting_key_param: 'top_banner',
          setting_value_param: config,
          is_active_param: true
        })

      if (error) throw error

      setMessage('Banner settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving banner settings:', error)
      setMessage('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  // Handle input changes
  const handleChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle bold words (comma-separated string to array)
  const handleBoldWordsChange = (value) => {
    const words = value.split(',').map(word => word.trim()).filter(word => word)
    handleChange('boldWords', words)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Banner Settings</h2>
        <p className="text-gray-600">Configure the top announcement banner for your site.</p>
      </div>

      {/* Preview */}
      {config.enabled && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Preview</h3>
          <div 
            className="relative w-full overflow-hidden border rounded-lg"
            style={{
              backgroundColor: config.backgroundColor,
              color: config.textColor,
              fontSize: config.fontSize,
              fontWeight: config.fontWeight
            }}
          >
            <div className="relative h-12 flex items-center px-4">
              <div className="whitespace-nowrap">
                {config.text}
                {config.boldWords.length > 0 && (
                  <span className="ml-2 text-xs opacity-75">
                    (Bold: {config.boldWords.join(', ')})
                  </span>
                )}
              </div>
              
              {config.showButton && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <button
                    className="px-4 py-1.5 text-xs font-medium rounded-md border"
                    style={{
                      backgroundColor: config.buttonBackgroundColor,
                      color: config.buttonTextColor,
                      borderColor: config.buttonBorderColor
                    }}
                  >
                    {config.buttonText}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleChange('enabled', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Enable Banner</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.dismissible}
                  onChange={(e) => handleChange('dismissible', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Allow Dismissal</span>
              </label>
            </div>
          </div>
        </div>

        {/* Timing Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Timing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={config.startTime || ''}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for immediate start</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stop Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={config.stopTime || ''}
                onChange={(e) => handleChange('stopTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for no end time</p>
            </div>
          </div>
        </div>

        {/* Content Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Content</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Text
              </label>
              <textarea
                value={config.text}
                onChange={(e) => handleChange('text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Enter your banner message..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bold Words (comma-separated)
              </label>
              <input
                type="text"
                value={config.boldWords.join(', ')}
                onChange={(e) => handleBoldWordsChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="VideoFlip, YouTube, Premium"
              />
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Appearance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <input
                type="color"
                value={config.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size
              </label>
              <select
                value={config.fontSize}
                onChange={(e) => handleChange('fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="12px">Small (12px)</option>
                <option value="14px">Medium (14px)</option>
                <option value="16px">Large (16px)</option>
                <option value="18px">Extra Large (18px)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Behavior Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Behavior</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scroll Speed (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={config.scrollSpeed}
                onChange={(e) => handleChange('scrollSpeed', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  checked={config.clickable}
                  onChange={(e) => handleChange('clickable', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Make Banner Clickable</span>
              </label>
            </div>
          </div>
          
          {config.clickable && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Click URL
              </label>
              <input
                type="text"
                value={config.clickUrl}
                onChange={(e) => handleChange('clickUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="/search"
              />
            </div>
          )}
        </div>

        {/* CTA Button Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">CTA Button</h3>
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.showButton}
                  onChange={(e) => handleChange('showButton', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium">Show CTA Button</span>
              </label>
            </div>
            
            {config.showButton && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={config.buttonText}
                      onChange={(e) => handleChange('buttonText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button URL
                    </label>
                    <input
                      type="text"
                      value={config.buttonUrl}
                      onChange={(e) => handleChange('buttonUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background
                    </label>
                    <input
                      type="color"
                      value={config.buttonBackgroundColor}
                      onChange={(e) => handleChange('buttonBackgroundColor', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={config.buttonTextColor}
                      onChange={(e) => handleChange('buttonTextColor', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Border Color
                    </label>
                    <input
                      type="color"
                      value={config.buttonBorderColor}
                      onChange={(e) => handleChange('buttonBorderColor', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hover Background
                    </label>
                    <input
                      type="color"
                      value={config.buttonHoverBackgroundColor}
                      onChange={(e) => handleChange('buttonHoverBackgroundColor', e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div>
            {message && (
              <p className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BannerSettings