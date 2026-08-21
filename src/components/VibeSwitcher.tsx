import { useCallback, useEffect, useRef, useState } from 'react'
import type { Vibe } from '../vibes/types'

interface VibeSwitcherProps {
  vibes: Vibe[]
  activeVibeId: string
  onSelectVibe: (vibeId: string) => void
  onVibeHover?: (vibeId: string) => void
}

export default function VibeSwitcher({ vibes, activeVibeId, onSelectVibe, onVibeHover }: VibeSwitcherProps) {
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

  const handleSelect = useCallback((id: string) => {
    onSelectVibe(id)
    setIsOpen(false)
  }, [onSelectVibe])

  return (
    <div ref={wrapperRef} className={`vibe-switcher ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="vibe-switcher__toggle"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label="Switch vibe"
      >
        <div className="vibe-switcher__icon">
          <span className="vibe-switcher__icon-bar" />
          <span className="vibe-switcher__icon-bar" />
          <span className="vibe-switcher__icon-bar" />
        </div>
      </button>

      {isOpen ? (
        <div className="vibe-switcher__menu" role="menu" aria-label="Select a vibe">
          {vibes.map((vibe) => (
            <button
              key={vibe.id}
              type="button"
              className={vibe.id === activeVibeId ? 'vibe-switcher__button active' : 'vibe-switcher__button'}
              onClick={() => handleSelect(vibe.id)}
              onMouseEnter={() => onVibeHover?.(vibe.id)}
            >
              {vibe.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
