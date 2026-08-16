import { useEffect, useRef, useState } from 'react'
import vibes from './vibes'
import TopBar from './components/TopBar'
import SceneBackground from './components/SceneBackground'
import VibeSwitcher from './components/VibeSwitcher'
import PlayerBar from './components/PlayerBar'
import { isYoutubeUrl, getYoutubeAudioStream } from './utils/youtubeConverter'
import './App.css'

function App() {
  const [activeVibeId, setActiveVibeId] = useState(vibes[0].id)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const audienceBase: Record<string, number> = {
    'chai-sutta': 860,
    'weedy-valley': 3240,
    panwadi: 1120,
  }

  const activeVibe = vibes.find((vibe) => vibe.id === activeVibeId) ?? vibes[0]
  const currentTrack = activeVibe.tracks[currentTrackIndex % activeVibe.tracks.length]
  const [audienceCount, setAudienceCount] = useState<number>(audienceBase[activeVibeId] ?? 1000)

  useEffect(() => {
    setCurrentTrackIndex(0)
  }, [activeVibeId])

  useEffect(() => {
    setAudienceCount(audienceBase[activeVibeId] ?? 1000)
  }, [activeVibeId])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setAudienceCount((count) => {
        const delta = Math.floor(Math.random() * 15) - 7
        return Math.max(45, count + delta)
      })
    }, 4000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = isMuted
  }, [isMuted])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const loadTrack = async () => {
      try {
        let audioSrc = currentTrack.src
        console.log('Loading track:', currentTrack.title, 'URL:', audioSrc)

        // If it's a YouTube URL, convert it to an audio stream
        if (isYoutubeUrl(audioSrc)) {
          console.log('Detected YouTube URL, converting...')
          audioSrc = await getYoutubeAudioStream(audioSrc)
          console.log('Converted URL:', audioSrc)
        }

        audio.src = audioSrc
        audio.currentTime = 0
        setProgress(0)
        audio.play().catch((err) => {
          console.error('Playback error:', err)
          // autoplay may be blocked; keep audio ready for user interactions
        })
      } catch (error) {
        console.error('Error loading track:', error)
      }
    }

    loadTrack()
  }, [currentTrack.src])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) return
      setProgress((audio.currentTime / audio.duration) * 100)
    }

    const handleEnded = () => {
      setCurrentTrackIndex((index) => (index + 1) % activeVibe.tracks.length)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [activeVibe.tracks.length])

  return (
    <div className="app-shell">
      <TopBar />
      <SceneBackground
        label={activeVibe.label}
        backgroundColor={activeVibe.backgroundColor}
        backgroundImage={activeVibe.backgroundImage}
        backgroundVideo={activeVibe.backgroundVideo}
      >
        <div className="scene__bottom">
          <PlayerBar
            title={currentTrack.title}
            artist={currentTrack.artist}
            isMuted={isMuted}
            progress={progress}
            onToggleMute={() => setIsMuted((value) => !value)}
          />
        </div>
        <VibeSwitcher
          vibes={vibes}
          activeVibeId={activeVibeId}
          onSelectVibe={setActiveVibeId}
        />
        <div className="audience-bubble" aria-label="Live audience count">
          <div className="audience-bubble__dot" />
          <div className="audience-bubble__count">{audienceCount.toLocaleString()}</div>
        </div>
      </SceneBackground>
      <audio ref={audioRef} preload="auto" />
    </div>
  )
}

export default App
