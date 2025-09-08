// components/YouTubePlayer.js - Clean YouTube Player Component
import { useEffect, useRef, useState } from 'react'

const YouTubePlayer = ({ 
  videoId, 
  onReady, 
  onStateChange, 
  onTimeUpdate,
  isFlippedH = false,
  isFlippedV = false,
  className = ""
}) => {
  const playerRef = useRef(null)
  const [player, setPlayer] = useState(null)
  const [isApiReady, setIsApiReady] = useState(false)

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true)
      return
    }

    // Load YouTube API script
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

    // Set up global callback
    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true)
    }

    return () => {
      // Cleanup
      delete window.onYouTubeIframeAPIReady
    }
  }, [])

  // Initialize player when API is ready
  useEffect(() => {
    if (!isApiReady || !videoId || player) return

    const newPlayer = new window.YT.Player(playerRef.current, {
      width: '100%',
      height: '100%',
      videoId: videoId,
      playerVars: {
        // Clean player options
        controls: 0,        // Hide YouTube controls
        modestbranding: 1,  // Minimal YouTube branding
        rel: 0,            // Don't show related videos
        fs: 1,             // Allow fullscreen
        cc_load_policy: 0, // Don't show captions by default
        iv_load_policy: 3, // Hide annotations
        autohide: 1,       // Auto-hide controls
        playsinline: 1,    // Play inline on mobile
        origin: window.location.origin
      },
      events: {
        onReady: (event) => {
          console.log('YouTube player ready')
          if (onReady) onReady(event)
        },
        onStateChange: (event) => {
          console.log('YouTube player state changed:', event.data)
          if (onStateChange) onStateChange(event)
        }
      }
    })

    setPlayer(newPlayer)

    // Set up time update interval
    const timeUpdateInterval = setInterval(() => {
      if (newPlayer && newPlayer.getCurrentTime) {
        const currentTime = newPlayer.getCurrentTime()
        if (onTimeUpdate) onTimeUpdate(currentTime)
      }
    }, 1000)

    return () => {
      clearInterval(timeUpdateInterval)
      if (newPlayer && newPlayer.destroy) {
        newPlayer.destroy()
      }
    }
  }, [isApiReady, videoId])

  // Clean up player when component unmounts
  useEffect(() => {
    return () => {
      if (player && player.destroy) {
        player.destroy()
      }
    }
  }, [player])

  return (
    <div 
      className={`relative w-full h-full ${className}`}
      style={{
        transform: `scale${isFlippedH ? 'X' : ''}(-1) scale${isFlippedV ? 'Y' : ''}(-1)`,
      }}
    >
      {!isApiReady ? (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading player...</p>
          </div>
        </div>
      ) : (
        <div 
          ref={playerRef}
          className="w-full h-full"
          style={{ minHeight: '200px' }}
        />
      )}
    </div>
  )
}

// Helper functions to control the player
export const playerControls = {
  play: (player) => player?.playVideo(),
  pause: (player) => player?.pauseVideo(),
  seekTo: (player, seconds) => player?.seekTo(seconds),
  setVolume: (player, volume) => player?.setVolume(volume * 100),
  mute: (player) => player?.mute(),
  unMute: (player) => player?.unMute(),
  getCurrentTime: (player) => player?.getCurrentTime() || 0,
  getDuration: (player) => player?.getDuration() || 0,
  getPlayerState: (player) => player?.getPlayerState()
}

// YouTube player states
export const PlayerStates = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
}

export default YouTubePlayer