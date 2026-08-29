import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import YouTube, { type YouTubeProps, type YouTubePlayer } from 'react-youtube'
import TopBar from './components/TopBar'
import SceneBackground from './components/SceneBackground'
import VibeSwitcher from './components/VibeSwitcher'
import RadioPlayer from './components/RadioPlayer'
import DonationButton from './components/DonationButton'
import LandingPage from './components/LandingPage'
import { getAllVibes, preloadVibe } from './vibes'
import { getTrackDurations, preloadTrackDurations, preloadAllTrackDurations } from './data/trackDurations'
import { RADIO_EPOCH } from './data/radioConfig'
import { getCurrentPlaybackPosition } from './utils/liveSync'
import type { Vibe, TrackInfo } from './vibes/types'
import './App.css'


const DRIFT_TOLERANCE_SECONDS = 3 // reseek if off by more than this

const audienceBase: Record<string, number> = {
  'chai-sutta': 860,
  'weedy-valley': 3240,
  panwadi: 1120,
  'bus-driver': 1580,
  saloon: 920,
  'old-night-drives': 2340,
}

export default function App() {
  const [currentVibe, setCurrentVibe] = useState<Vibe | null>(null)
  const [vibes, setVibes] = useState<Vibe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLandingPage, setIsLandingPage] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [isStaticWindow, setIsStaticWindow] = useState(false)
  const [trackTitle, setTrackTitle] = useState('Tuning in...')
  const [trackArtist, setTrackArtist] = useState('Mehfil Radio')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDonationOpen, setIsDonationOpen] = useState(false)

  const [playerTarget, setPlayerTarget] = useState<YouTubePlayer | null>(null)
  const currentTrackIndexRef = useRef<number>(0)
  const nextTrackQueuedRef = useRef<boolean>(false)
  const activeVibeIdRef = useRef<string | null>(null)
  const hasEnteredRadioRef = useRef(false)
  const isMutedRef = useRef<boolean>(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  const staticNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const staticGainRef = useRef<GainNode | null>(null)

  const [audienceCount, setAudienceCount] = useState<number>(1000)

  // Mirror mute intent into a ref so the periodic sync loop can converge the
  // player's real mute state onto it without being re-created on every toggle.
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])


  // Load all vibes on mount
  useEffect(() => {
    let mounted = true
    getAllVibes().then(async (loadedVibes: Vibe[]) => {
      if (mounted) {
        setVibes(loadedVibes)
        if (loadedVibes.length > 0) {
          setCurrentVibe(loadedVibes[0])
          activeVibeIdRef.current = loadedVibes[0].id
          // Preload all track durations during initial load
          await preloadAllTrackDurations()
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
  }, [currentVibe])

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
  const tuneIntoVibe = useCallback(async (vibe: Vibe, player: YouTubePlayer) => {
    const tracks = await getTracksForVibe(vibe.id)
    
    // Guard against race conditions if user has switched vibes during async load
    if (activeVibeIdRef.current !== vibe.id) {
      return
    }

    const position = getCurrentPlaybackPosition(tracks, RADIO_EPOCH)

    if (!position || !tracks.length) {
      setLoadError('No live tracks available for this vibe')
      return
    }

    setLoadError(null)
    currentTrackIndexRef.current = position.trackIndex

    try {
      // Check if playlistId is a valid string (single playlist vibes)
      if (vibe.playlistId && typeof vibe.playlistId === 'string') {
        try {
          player.stopVideo()
        } catch {}
        player.loadPlaylist({
          list: vibe.playlistId,
          listType: 'playlist',
          index: position.trackIndex,
          startSeconds: Math.floor(position.offsetSeconds),
        })
      } else {
        // For multi-playlist vibes or vibes without playlistId, load individual videos
        try {
          player.stopVideo()
        } catch {}
        const track = tracks[position.trackIndex]
        if (!track) {
          throw new Error('Track not found at index: ' + position.trackIndex)
        }
        player.loadVideoById({
          videoId: track.videoId,
          startSeconds: Math.floor(position.offsetSeconds),
        })
      }

      // Keep the player's mute state aligned with the UI intent after every
      // (re)load. loadPlaylist/loadVideoById preserve the prior mute flag, so
      // this is what actually unmutes once the player becomes controllable.
      if (isMutedRef.current) {
        player.mute()
      } else {
        player.unMute()
      }
      player.playVideo()
    } catch {
      // The YouTube player rejects method calls until its postMessage channel
      // is fully live. Swallow it — the 1s sync loop retries tuneIntoVibe.
    }
  }, [getTracksForVibe])

  const onPlayerReady: YouTubeProps['onReady'] = useCallback((event) => {
    setPlayerTarget(event.target)

    try {
      // Always mute initially to satisfy browser autoplay policy on startup
      event.target.mute()

      if (currentVibe) {
        if (hasEnteredRadioRef.current) {
          // A selection can happen before the iframe is ready on a cold
          // deployed load. Tune it here instead of waiting for drift sync.
          void tuneIntoVibe(currentVibe, event.target)
        } else if (currentVibe.playlistId) {
          // Load the initial playlist muted in the background to warm up the
          // player connection before the first user selection.
          event.target.loadPlaylist({
            list: currentVibe.playlistId,
            listType: 'playlist',
            index: 0,
            startSeconds: 0,
          })
        }
      }
    } catch {
      // Player not fully controllable yet; the 1s sync loop takes over.
    }
  }, [currentVibe, tuneIntoVibe])

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
    } else if (event.data === 0) {
      // Video ended - for vibes without playlistId, we need to manually advance
      // The sync loop will handle it by detecting the state change and loading the next track
    }
  }, [currentVibe])

  const onPlayerError: YouTubeProps['onError'] = useCallback(async (event) => {
    setLoadError('Playback error. Retrying with fallback stream...')
    
    // Prefer the player delivered by this error event. It is available even
    // when React state has not yet received the onReady target.
    const player = event.target || playerTarget
    if (player && currentVibe) {
      try {
        const tracks = await getTracksForVibe(currentVibe.id)
        const position = getCurrentPlaybackPosition(tracks, RADIO_EPOCH)
        if (position && tracks.length) {
          const track = tracks[position.trackIndex]
          player.loadVideoById({
            videoId: track.videoId,
            startSeconds: Math.floor(position.offsetSeconds)
          })
          setLoadError(null) // clear error on success
        }
      } catch {
        setLoadError('Failed to load playback. Please switch vibes.')
      }
    }
  }, [currentVibe, playerTarget, getTracksForVibe])

  // Helper to set the volume of procedural white noise
  const setStaticNoiseVolume = useCallback((volume: number) => {
    try {
      if (volume > 0) {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          const ctx = new AudioContextClass()
          audioContextRef.current = ctx

          // Create a 2-second loop of white noise
          const bufferSize = 2 * ctx.sampleRate
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
          const output = noiseBuffer.getChannelData(0)
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 0.08 - 0.04 // gentle noise
          }

          const source = ctx.createBufferSource()
          source.buffer = noiseBuffer
          source.loop = true

          const gain = ctx.createGain()
          gain.gain.setValueAtTime(0, ctx.currentTime)

          source.connect(gain)
          gain.connect(ctx.destination)
          source.start()

          staticNodeRef.current = source
          staticGainRef.current = gain
        }

        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume()
        }

        if (staticGainRef.current) {
          staticGainRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.1)
        }
      } else {
        if (staticGainRef.current && audioContextRef.current) {
          staticGainRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.1)
        }
      }
    } catch {
      console.warn('AudioContext not supported or blocked')
    }
  }, [])

  // Control static noise volume based on states
  useEffect(() => {
    if (isStaticWindow && !isMuted) {
      setStaticNoiseVolume(0.45)
    } else {
      setStaticNoiseVolume(0)
    }
  }, [isStaticWindow, isMuted, setStaticNoiseVolume])

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (staticNodeRef.current) {
        try { staticNodeRef.current.stop() } catch {}
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close() } catch {}
      }
    }
  }, [])

  // periodic drift correction & sync gap check — runs every 1s for seamless transitions
  useEffect(() => {
    if (!playerTarget || !currentVibe) return
    const interval = setInterval(async () => {
      const vibeId = currentVibe.id
      const tracks = await getTracksForVibe(vibeId)
      
      // Guard against race conditions if user changed vibe during load
      if (activeVibeIdRef.current !== vibeId) return

      const expected = getCurrentPlaybackPosition(tracks, RADIO_EPOCH)
      if (!expected) return

      try {
        // Converge the player's real mute state onto the UI intent. The
        // unMute() fired on vibe selection can be dropped before the player
        // is controllable, so this is the safety net that actually unmutes.
        if (isMutedRef.current) {
          if (!playerTarget.isMuted()) playerTarget.mute()
        } else if (playerTarget.isMuted()) {
          playerTarget.unMute()
        }

        const isStatic = expected.isStaticWindow
        setIsStaticWindow(isStatic)

        if (isStatic) {
          playerTarget.pauseVideo()
          setTrackTitle('Tuning station...')
          setTrackArtist('Analog Static')
          
          // CROSSFADE: Pre-queue next track during static window (last 2.5s)
          // This ensures zero delay when transition happens
          if (!nextTrackQueuedRef.current && tracks.length > 0) {
            const nextIndex = (expected.trackIndex + 1) % tracks.length
            try {
              const nextTrack = tracks[nextIndex]
              playerTarget.cueVideoById({
                videoId: nextTrack.videoId,
              })
              nextTrackQueuedRef.current = true
            } catch {}
          }
        } else {
          const playerState = playerTarget.getPlayerState()
          const actualTrackIndex = currentTrackIndexRef.current
          const sameTrack = expected.trackIndex === actualTrackIndex

          // If track index changed or video is paused/unstarted/ended, reload/tune it
          if (!sameTrack || playerState === 2 || playerState === -1 || playerState === 0) {
            nextTrackQueuedRef.current = false
            tuneIntoVibe(currentVibe, playerTarget)
            currentTrackIndexRef.current = expected.trackIndex
          } else if (playerState === 1) {
            // Check drift if playing the same track
            const actualTime = playerTarget.getCurrentTime() || 0
            const drift = Math.abs(expected.offsetSeconds - actualTime)
            if (drift > DRIFT_TOLERANCE_SECONDS) {
              playerTarget.seekTo(Math.floor(expected.offsetSeconds), true)
            }
          }
        }
      } catch {}
    }, 1000)
    return () => clearInterval(interval)
  }, [playerTarget, currentVibe, getTracksForVibe, tuneIntoVibe])

  const handleSelectFromLanding = useCallback((vibeId: string) => {
    const found = vibes.find((v) => v.id === vibeId)
    if (found) {
      hasEnteredRadioRef.current = true
      activeVibeIdRef.current = vibeId
      setCurrentVibe(found)
      // Commit the intent to UI state first so entering the vibe and the
      // unmuted visualizer never hinge on the YouTube player being ready.
      setIsMuted(false)
      if (playerTarget) {
        try {
          playerTarget.unMute()
        } catch {}
        tuneIntoVibe(found, playerTarget)
      }
    }
    setIsLandingPage(false)
  }, [vibes, playerTarget, tuneIntoVibe])

  const handleBackToLanding = useCallback(() => {
    if (playerTarget) {
      try {
        playerTarget.pauseVideo()
      } catch {}
    }
    setIsLandingPage(true)
  }, [playerTarget])

  const handleSelectVibe = useCallback(async (vibeId: string) => {
    // Prevent reloading if already on this vibe
    if (currentVibe?.id === vibeId) {
      return
    }
    
    const found = vibes.find((v) => v.id === vibeId)
    if (found) {
      activeVibeIdRef.current = vibeId
      setCurrentVibe(found)
      if (playerTarget) {
        tuneIntoVibe(found, playerTarget)
      }
    }
  }, [vibes, playerTarget, currentVibe?.id, tuneIntoVibe])

  const handleToggleMute = useCallback(() => {
    if (playerTarget) {
      try {
        if (isMuted) {
          playerTarget.unMute()
        } else {
          playerTarget.mute()
        }
      } catch {}
    }
    setIsMuted((muted) => !muted)
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
      autoplay: 0, // Disable autoplay - we control it manually after mute
      controls: 0,
      disablekb: 1,
      playsinline: 1,
      mute: 1, // Start muted to satisfy browser autoplay policy
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
      {isLandingPage ? (
        <LandingPage
          vibes={vibes}
          onSelectVibe={handleSelectFromLanding}
          onHoverVibe={handleVibeHover}
          onOpenDonation={() => setIsDonationOpen(true)}
        />
      ) : (
        <>
          <TopBar onBackToLanding={handleBackToLanding} onOpenDonation={() => setIsDonationOpen(true)} />
          <SceneBackground
            label={currentVibe?.label || ''}
            backgroundColor={currentVibe?.backgroundColor || '#000'}
            backgroundImage={currentVibe?.backgroundImage}
          >
            <div className="scene__bottom">
              <RadioPlayer
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
        </>
      )}

      <div className="youtube-player-host" aria-hidden="true">
        <YouTube
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onStateChange}
          onError={onPlayerError}
        />
      </div>
      <DonationButton
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
      />
    </div>
  )
}
