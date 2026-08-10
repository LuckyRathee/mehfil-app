import type { Vibe } from '../vibes'

interface VibeSwitcherProps {
  vibes: Vibe[]
  activeVibeId: string
  onSelectVibe: (vibeId: string) => void
}

export default function VibeSwitcher({ vibes, activeVibeId, onSelectVibe }: VibeSwitcherProps) {
  return (
    <div className="vibe-switcher">
      {vibes.map((vibe) => (
        <button
          key={vibe.id}
          type="button"
          className={vibe.id === activeVibeId ? 'vibe-switcher__button active' : 'vibe-switcher__button'}
          onClick={() => onSelectVibe(vibe.id)}
        >
          {vibe.label}
        </button>
      ))}
    </div>
  )
}
