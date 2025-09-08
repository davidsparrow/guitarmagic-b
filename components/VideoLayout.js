// components/VideoLayout.js - Minimal layout for video pages
import { useAuth } from '../contexts/AuthContext'

const VideoLayout = ({ children, showHeader = false }) => {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Optional minimal header - hidden by default for video pages */}
      {showHeader && (
        <header className="absolute top-0 left-0 right-0 z-40 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">YV</span>
              </div>
              <span className="text-sm font-medium">VideoFlip</span>
            </div>
          </div>
        </header>
      )}

      {/* Main Content - Full screen for videos */}
      <main className="relative w-full h-screen">
        {children}
      </main>
    </div>
  )
}

export default VideoLayout