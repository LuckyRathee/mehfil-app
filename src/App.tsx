import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import YouTube, { type YouTubeProps } from 'react-youtube'
import TopBar from './components/TopBar'
import SceneBackground from './components/SceneBackground'
import VibeSwitcher from './components/VibeSwitcher'
import RadioPlayer from './components/RadioPlayer'
import DonationButton from './components/DonationButton'
import { getAllVibes, preloadVibe } from './vibes'
import { getTrackDurations, preloadTrackDurations } from './data/trackDurations'
import { RADIO_EPOCH } from './data/radioConfig'
import { getCurrentPlaybackPosition } from './utils/liveSync'
import type { Vibe, TrackInfo } from './vibes/types'
import './App.css'

const RESYNC_INTERVAL_MS = 30000 // recheck drift every 30s
const DRIFT_TOLERANCE_SECONDS = 3 // reseek if off by more than this

export default function App() {
  const [currentVibe, setCurrentVibe] = useState<Vibe | null>(null)
  const [vibes, setVibes] = useState<Vibe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [trackTitle, setTrackTitle] = useState('Tuning in...')
  const [trackArtist, setTrackArtist] = useState('Mehfil Radio')
  const [loadError, setLoadError] = useState<string | null>(null)

  const [playerTarget, setPlayerTarget] = useState<any>(null)
  const currentTrackIndexRef = useRef<number>(0)

  const audienceBase: Record<string, number> = {
    'chai-sutta': 860,
    'weedy-valley': 3240,
    panwadi: 1120,
    'bus-driver': 1580,
    saloon: 920,
    'old-night-drives': 2340,
  }
  const [audienceCount, setAudienceCount] = useState<number>(1000)

  // Load all vibes on mount
  useEffect(() => {
    let mounted = true
    getAllVibes().then((loadedVibes: Vibe[]) => {
      if (mounted) {
        setVibes(loadedVibes)
        if (loadedVibes.length > 0) {
          setCurrentVibe(loadedVibes[0])
        }
        setIsLoading(false)
      }
    })
    return () => { mounted = false }
  }, [])

  // Update audience count when vibe changes
  useEffect(() => {
    if (currentVibe) {
      setAudienceCount(audienceBase[currentVibe.id] ?? 1000)
    }
  }, [currentVibe?.id])

  // Simulate audience fluctuation
  useEffect(() => {
    const interval = window.setInterval(() => {
      setAudienceCount((count) => {
        const delta = Math.floor(Math.random() * 15) - 7
        return Math.max(45, count + delta)
      })
    }, 4000)
    return () => window.clearInterval(interval)
  }, [])

  // Load track durations for a vibe on demand
  const getTracksForVibe = useCallback(async (vibeId: string): Promise<TrackInfo[]> => {
    return getTrackDurations(vibeId)
  }, [])

  // Load whatever should currently be playing for a vibe, live-synced
  const tuneIntoVibe = useCallback(async (vibe: Vibe, player: any) => {
    const tracks = await getTracksForVibe(vibe.id)
    const position = getCurrentPlaybackPosition(tracks, RADIO_EPOCH)

    if (!position || !tracks.length) {
      setLoadError('No live tracks available for this vibe')
      return
    }

    setLoadError(null)
    currentTrackIndexRef.current = position.trackIndex
    const track = tracks[position.trackIndex]

    player.loadVideoById({
      videoId: track.videoId,
      startSeconds: Math.floor(position.offsetSeconds),
    })
  }, [getTracksForVibe])

  const onPlayerReady: YouTubeProps['onReady'] = useCallback((event) => {
    setPlayerTarget(event.target)
    if (isMuted) {
      event.target.mute()
    } else {
      event.target.unMute()
    }
    if (currentVibe && currentVibe.playlistId) {
      // Use playlist for initial load - more reliable for YouTube
      event.target.loadPlaylist({
        list: currentVibe.playlistId,
        listType: 'playlist',
        index: 0,
        startSeconds: 0,
      })
    }
  }, [isMuted, currentVibe])

  const onStateChange: YouTubeProps['onStateChange'] = useCallback((event) => {
    if (event.data === 1) {
      // playing
      setLoadError(null)
      const videoData = event.target.getVideoData()
      if (videoData && videoData.title) {
        const cleanTitle = videoData.title
          .replace(/\|.*$/, '')
          .replace(/\(Official.*?\)/gi, '')
          .trim()
        setTrackTitle(cleanTitle)
        setTrackArtist(videoData.author || currentVibe?.label || 'Mehfil Radio')
      }
    }

    // Don't call tuneIntoVibe on video end - playlist handles next video automatically
    // if (event.data === 0) { ... }
  }, [currentVibe?.label, currentVibe])

  const onPlayerError: YouTubeProps['onError'] = useCallback(() => {
    setLoadError('Audio playback error')
    // try to recover by resyncing rather than getting stuck
    if (playerTarget && currentVibe && currentVibe.playlistId) {
      playerTarget.loadPlaylist({
        list: currentVibe.playlistId,
        listType: 'playlist',
        index: 0,
        startSeconds: 0,
      })
    }
  }, [currentVibe, playerTarget])

  // periodic drift correction — keeps everyone truly "live"
  useEffect(() => {
    if (!playerTarget || !currentVibe) return
    const interval = setInterval(async () => {
      const tracks = await getTracksForVibe(currentVibe.id)
      const expected = getCurrentPlaybackPosition(tracks, RADIO_EPOCH)
      if (!expected) return

      try {
        const actualTrackIndex = currentTrackIndexRef.current
        const actualTime = playerTarget.getCurrentTime() || 0

        const sameTrack = expected.trackIndex === actualTrackIndex
        const drift = Math.abs(expected.offsetSeconds - actualTime)

        if (!sameTrack || drift > DRIFT_TOLERANCE_SECONDS) {
          tuneIntoVibe(currentVibe, playerTarget)
        }
      } catch (e) {}
    }, RESYNC_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [playerTarget, currentVibe, getTracksForVibe, tuneIntoVibe])

  const handleSelectVibe = useCallback(async (vibeId: string) => {
    // Prevent reloading if already on this vibe
    if (currentVibe?.id === vibeId) {
      return
    }
    
    const found = vibes.find((v) => v.id === vibeId)
    if (found) {
      setCurrentVibe(found)
      if (playerTarget && found.playlistId) {
        // Use playlist as primary method - more reliable for YouTube
        playerTarget.loadPlaylist({
          list: found.playlistId,
          listType: 'playlist',
          index: 0,
          startSeconds: 0,
        })
      }
    }
  }, [vibes, playerTarget, currentVibe?.id])

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

  // Preload vibe on hover for faster switching
  const handleVibeHover = useCallback((vibeId: string) => {
    preloadVibe(vibeId)
    preloadTrackDurations(vibeId)
  }, [])

  const opts: YouTubeProps['opts'] = useMemo(() => ({
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      playsinline: 1,
    },
  }), [])

  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="loading-screen" role="status" aria-label="Loading Mehfil Radio">
          <div className="loading-spinner" />
          <p>Loading vibes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <TopBar />
      <SceneBackground
        label={currentVibe?.label || ''}
        backgroundColor={currentVibe?.backgroundColor || '#000'}
        backgroundImage={currentVibe?.backgroundImage}
        backgroundVideo={currentVibe?.backgroundVideo}
      >
        <div className="scene__bottom">
          <RadioPlayer
            logo={currentVibe?.logo || '/images/vibe-placeholder.svg'}
            accentColor={currentVibe?.colorTheme || '#fff'}
            title={trackTitle}
            artist={trackArtist}
            isMuted={isMuted}
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
          activeVibeId={currentVibe?.id || ''}
          onSelectVibe={handleSelectVibe}
          onVibeHover={handleVibeHover}
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