import { useEffect, useRef, useState } from 'react'
import type { Vibe } from '../vibes'

interface VibeSwitcherProps {
  vibes: Vibe[]
  activeVibeId: string
  onSelectVibe: (vibeId: string) => void
}

export default function VibeSwitcher({ vibes, activeVibeId, onSelectVibe }: VibeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const activeVibe = vibes.find((vibe) => vibe.id === activeVibeId) ?? vibes[0]

  return (
    <div ref={wrapperRef} className={`vibe-switcher ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="vibe-switcher__toggle"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        {activeVibe.label}
      </button>

      {isOpen ? (
        <div className="vibe-switcher__menu" role="menu" aria-label="Select a vibe">
          {vibes.map((vibe) => (
            <button
              key={vibe.id}
              type="button"
              className={vibe.id === activeVibeId ? 'vibe-switcher__button active' : 'vibe-switcher__button'}
              onClick={() => {
                onSelectVibe(vibe.id)
                setIsOpen(false)
              }}
            >
              {vibe.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
