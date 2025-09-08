// pages/admin/settings.js - Admin Settings Page
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import BannerSettings from '../../components/admin/BannerSettings'
import FeatureGates from '../../components/admin/FeatureGates'
import { supabase } from '../../lib/supabase/client'

export default function AdminSettings() {
  const { isAuthenticated, user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [activeTab, setActiveTab] = useState('banner')
  const router = useRouter()

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!loading && isAuthenticated && user) {
        try {
          console.log('🔍 Admin Check: User ID:', user.id)
          console.log('🔍 Admin Check: User object:', user)
          console.log('🔍 Admin Check: User app_metadata:', user.app_metadata)
          console.log('🔍 Admin Check: User user_metadata:', user.user_metadata)
          
          // Check if user has admin role in their metadata (where you stored it)
          const adminStatus = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin'
          
          console.log('🔍 Admin Check: Admin status:', adminStatus)
          console.log('🔍 Admin Check: Role found:', user?.app_metadata?.role || user?.user_metadata?.role)
          
          setIsAdmin(adminStatus)
          
          if (!adminStatus) {
            console.log('🔍 Admin Check: Redirecting non-admin user')
            router.push('/') // Redirect non-admin users
          } else {
            console.log('🔍 Admin Check: User is admin, allowing access')
          }
        } catch (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
          router.push('/')
        }
      } else if (!loading && !isAuthenticated) {
        router.push('/') // Redirect non-authenticated users
      }
      setCheckingAdmin(false)
    }

    checkAdminStatus()
  }, [isAuthenticated, user, loading, router])

  if (loading || checkingAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null // Will redirect
  }

  const tabs = [
    { id: 'banner', name: 'Banner Settings', icon: '📢' },
    { id: 'feature-gates', name: 'Feature Gates', icon: '🚪' },
    { id: 'general', name: 'General Settings', icon: '⚙️' },
    { id: 'users', name: 'User Management', icon: '👥' }
  ]

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Settings
          </h1>
          <p className="text-gray-600">
            Manage your VideoFlip application settings and configurations.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'banner' && <BannerSettings />}
          
          {activeTab === 'feature-gates' && <FeatureGates />}
          
          {activeTab === 'general' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">General Settings</h2>
              <p className="text-gray-600">General application settings coming soon...</p>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
              <p className="text-gray-600">User management features coming soon...</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-sm">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-sm">💎</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Premium Users</p>
                <p className="text-2xl font-semibold text-gray-900">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-sm">🔍</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Searches Today</p>
                <p className="text-2xl font-semibold text-gray-900">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">🔄</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Loops Created</p>
                <p className="text-2xl font-semibold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}