import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import YouTube, { type YouTubeProps } from 'react-youtube'
import TopBar from './components/TopBar'
import SceneBackground from './components/SceneBackground'
import VibeSwitcher from './components/VibeSwitcher'
import RadioPlayer from './components/RadioPlayer'
import DonationButton from './components/DonationButton'
import vibes, { type Vibe } from './vibes'
import trackDurations from './data/trackDurations.json'
import { RADIO_EPOCH } from './data/radioConfig'
import { getCurrentPlaybackPosition, type TrackInfo } from './utils/liveSync'
import './App.css'

const RESYNC_INTERVAL_MS = 30000 // recheck drift every 30s
const DRIFT_TOLERANCE_SECONDS = 3 // reseek if off by more than this

export default function App() {
  const [currentVibe, setCurrentVibe] = useState<Vibe>(vibes[0])
  const [isMuted, setIsMuted] = useState(false)
  
  const [progress, setProgress] = useState(0)
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
  const [audienceCount, setAudienceCount] = useState<number>(
    audienceBase[currentVibe.id] ?? 1000
  )

  useEffect(() => {
    setAudienceCount(audienceBase[currentVibe.id] ?? 1000)
  }, [currentVibe.id])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAudienceCount((count) => {
        const delta = Math.floor(Math.random() * 15) - 7
        return Math.max(45, count + delta)
      })
    }, 4000)
    return () => window.clearInterval(interval)
  }, [])

  const getTracksForVibe = useCallback((vibeId: string): TrackInfo[] =>
    (trackDurations as Record<string, TrackInfo[]>)[vibeId] ?? [], [trackDurations])

  // Load whatever should currently be playing for a vibe, live-synced
  const tuneIntoVibe = useCallback((vibe: Vibe, player: any) => {
    const tracks = getTracksForVibe(vibe.id)
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
    tuneIntoVibe(currentVibe, event.target)
  }, [isMuted, currentVibe, tuneIntoVibe])

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
        setTrackArtist(videoData.author || currentVibe.label)
      }
    }

    if (event.data === 0) {
      // ended -> resync from epoch rather than blindly advancing,
      // this self-corrects any drift from load delays etc.
      tuneIntoVibe(currentVibe, event.target)
    }
  }, [currentVibe.label, currentVibe, tuneIntoVibe])

  const onPlayerError: YouTubeProps['onError'] = useCallback(() => {
    setLoadError('Audio playback error')
    // try to recover by resyncing rather than getting stuck
    if (playerTarget) {
      tuneIntoVibe(currentVibe, playerTarget)
    }
  }, [currentVibe, playerTarget, tuneIntoVibe])

  // progress bar reflects position WITHIN the current track
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

  // periodic drift correction — keeps everyone truly "live"
  useEffect(() => {
    if (!playerTarget) return
    const interval = setInterval(() => {
      const tracks = getTracksForVibe(currentVibe.id)
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

  const handleSelectVibe = useCallback((vibeId: string) => {
    const found = vibes.find((v) => v.id === vibeId)
    if (found) {
      setCurrentVibe(found)
      setProgress(0)
      if (playerTarget) {
        // Try live-synced playback first
        tuneIntoVibe(found, playerTarget)
      }
    }
  }, [playerTarget, tuneIntoVibe])

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

  return (
    <div className="app-shell">
      <TopBar />
      <SceneBackground
        label={currentVibe.label}
        backgroundColor={currentVibe.backgroundColor}
        backgroundImage={currentVibe.backgroundImage}
        backgroundVideo={currentVibe.backgroundVideo}
      >
        <div className="scene__bottom">
          <RadioPlayer
            logo={currentVibe.logo}
            accentColor={currentVibe.colorTheme}
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