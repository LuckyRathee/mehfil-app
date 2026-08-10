interface PlayerBarProps {
  title: string
  artist: string
  isMuted: boolean
  progress: number
  onToggleMute: () => void
}

export default function PlayerBar({ title, artist, isMuted, progress, onToggleMute }: PlayerBarProps) {
  return (
    <footer className="player-bar">
      <div className="player-bar__disc" aria-hidden="true">
        <div className="player-bar__disc-core" />
      </div>
      <div className="player-bar__track-info">
        <div className="player-bar__title">{title}</div>
        <div className="player-bar__artist">{artist}</div>
        <div className="player-bar__progress-track">
          <div className="player-bar__progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button type="button" className="player-bar__mute-button" onClick={onToggleMute}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </footer>
  )
}
