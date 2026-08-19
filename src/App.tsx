import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import YouTube, { type YouTubeProps } from 'react-youtube'
import TopBar from './components/TopBar'
import SceneBackground from './components/SceneBackground'
import VibeSwitcher from './components/VibeSwitcher'
import PlayerBar from './components/PlayerBar'
import DonationButton from './components/DonationButton'
import vibes, { type Vibe } from './vibes'
import './App.css'

export default function App() {
  const [currentVibe, setCurrentVibe] = useState<Vibe>(vibes[0])
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [trackTitle, setTrackTitle] = useState('Shut Up and Listen')
  const [trackArtist, setTrackArtist] = useState('Mehfil Radio')
  const [loadError, setLoadError] = useState<string | null>(null)

  const [playerTarget, setPlayerTarget] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const audienceBase = useMemo<Record<string, number>>(() => ({
    'chai-sutta': 860,
    'weedy-valley': 3240,
    panwadi: 1120,
    'bus-driver': 1580,
    saloon: 920,
    'old-night-drives': 2340,
  }), [])

  const [audienceCount, setAudienceCount] = useState<number>(
    audienceBase[currentVibe.id] ?? 1000
  )

  useEffect(() => {
    setAudienceCount(audienceBase[currentVibe.id] ?? 1000)
  }, [currentVibe.id, audienceBase])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAudienceCount((count) => {
        const delta = Math.floor(Math.random() * 15) - 7
        return Math.max(45, count + delta)
      })
    }, 4000)
    return () => window.clearInterval(interval)
  }, [])

  const onPlayerReady: YouTubeProps['onReady'] = useCallback((event) => {
    setPlayerTarget(event.target)
    event.target.playVideo()
    if (isMuted) {
      event.target.mute()
    } else {
      event.target.unMute()
    }
  }, [isMuted])

  const onStateChange: YouTubeProps['onStateChange'] = useCallback((event) => {
    if (event.data === 1) {
      setLoadError(null)
      const videoData = event.target.getVideoData()
      if (videoData && videoData.title) {
        const cleanTitle = videoData.title
          .replace(/\|.*$/, '')
          .replace(/\(Official.*?\)/gi, '')
          .trim()
        setTrackTitle(cleanTitle)
        setTrackArtist(videoData.author || currentVibe.label)
      }
    }
  }, [currentVibe.label])

  const onPlayerError: YouTubeProps['onError'] = useCallback(() => {
    setLoadError('Audio playback error')
  }, [])

  useEffect(() => {
    if (!playerTarget) return
    const interval = setInterval(() => {
      try {
        if (playerTarget.getPlayerState && playerTarget.getPlayerState() === 1) {
          const currentTime = playerTarget.getCurrentTime() || 0
          const duration = playerTarget.getDuration() || 1
          if (duration > 0) {
            setProgress((currentTime / duration) * 100)
          }
        }
      } catch (e) {}
    }, 1000)
    return () => clearInterval(interval)
  }, [playerTarget])

  const handleSelectVibe = useCallback((vibeId: string) => {
    const found = vibes.find((v) => v.id === vibeId)
    if (found) {
      setCurrentVibe(found)
      setProgress(0)
      setLoadError(null)
      if (playerTarget && found.playlistId) {
        playerTarget.loadPlaylist({
          list: found.playlistId,
          listType: 'playlist',
          index: 0,
          startSeconds: 0,
        })
      }
    }
  }, [playerTarget])

  const handleToggleMute = useCallback(() => {
    if (playerTarget) {
      if (isMuted) {
        playerTarget.unMute()
      } else {
        playerTarget.mute()
      }
    }
    setIsMuted(!isMuted)
  }, [playerTarget, isMuted])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8
      videoRef.current.play().catch(() => {})
    }
  }, [currentVibe])

  const opts: YouTubeProps['opts'] = useMemo(() => ({
    height: '0',
    width: '0',
    playerVars: {
      listType: 'playlist',
      list: currentVibe.playlistId || 'PL4fGSI1pDJn4pTWyM3t61lOyZ6_4jcNOw',
      autoplay: 1,
      controls: 0,
      disablekb: 1,
    },
  }), [currentVibe.playlistId])

  return (
    <div className="app-shell">
      <TopBar />
      <SceneBackground
        backgroundColor={currentVibe.backgroundColor}
        backgroundImage={currentVibe.backgroundImage}
        backgroundVideo={currentVibe.backgroundVideo}
      >
        <div className="scene__bottom">
          <PlayerBar
            title={trackTitle}
            artist={trackArtist}
            isMuted={isMuted}
            progress={progress}
            onToggleMute={handleToggleMute}
          />
          {loadError && (
            <div className="audio-error" role="alert" aria-live="polite">
              ⚠️ {loadError}
            </div>
          )}
        </div>
        <VibeSwitcher
          vibes={vibes}
          activeVibeId={currentVibe.id}
          onSelectVibe={handleSelectVibe}
        />
        <div className="audience-bubble" aria-label="Live audience count">
          <div className="audience-bubble__dot" />
          <div className="audience-bubble__count">{audienceCount.toLocaleString()}</div>
        </div>
      </SceneBackground>

      <div style={{ display: 'none' }} aria-hidden="true">
        <YouTube
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onStateChange}
          onError={onPlayerError}
        />
      </div>
      <DonationButton />
    </div>
  )
}
