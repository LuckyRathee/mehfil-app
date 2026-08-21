import { useState, useEffect } from 'react'
import type { Vibe } from '../vibes/types'

interface LandingPageProps {
  vibes: Vibe[]
  onSelectVibe: (vibeId: string) => void
  onHoverVibe?: (vibeId: string) => void
  onOpenDonation?: () => void
}

const vibeDescriptions: Record<string, string> = {
  'chai-sutta': 'Cutting chai, deep conversations, and smoky lo-fi beats under the streetlights.',
  'weedy-valley': 'Mist-laden hills, chill psych-rock jams, and slow psychedelic grooves.',
  'panwadi': 'Vintage Bollywood tunes, local paan stall chats, and pure retro nostalgia.',
  'bus-driver': 'Late-night highway routes, engine rumbles, and energetic regional rhythms.',
  'saloon': 'Barbershop scissor-clicks, mirror talk, and classic local radio hits.',
  'old-night-drives': 'Neon lights, empty wet streets, and nostalgic synthwave driving beats.',
}

export default function LandingPage({ vibes, onSelectVibe, onHoverVibe, onOpenDonation }: LandingPageProps) {
  const [hoveredVibe, setHoveredVibe] = useState<Vibe | null>(null)
  const [activeBgIndex, setActiveBgIndex] = useState(0)

  // Switch background constantly when no vibe card is hovered
  useEffect(() => {
    if (hoveredVibe !== null || vibes.length === 0) return

    const interval = setInterval(() => {
      setActiveBgIndex((prevIndex) => (prevIndex + 1) % vibes.length)
    }, 4500) // switch background every 4.5 seconds

    return () => clearInterval(interval)
  }, [hoveredVibe, vibes.length])

  const handleMouseEnter = (vibe: Vibe) => {
    setHoveredVibe(vibe)
    if (onHoverVibe) {
      onHoverVibe(vibe.id)
    }
  }

  const handleMouseLeave = () => {
    setHoveredVibe(null)
  }

  const activeVibeForGlow = hoveredVibe || vibes[activeBgIndex]

  return (
    <div className="landing-page">
      {/* Dynamic Background Layers for cross-fade effect */}
      <div className="landing-page__bg-container" aria-hidden="true">
        {vibes.map((vibe, index) => {
          const isActive = hoveredVibe
            ? hoveredVibe.id === vibe.id
            : index === activeBgIndex

          return (
            <div
              key={vibe.id}
              className="landing-page__bg-layer"
              style={{
                backgroundColor: vibe.backgroundColor,
                backgroundImage: `radial-gradient(circle at 50% 50%, ${vibe.colorTheme}1A 0%, ${vibe.backgroundColor}E6 100%), url(${vibe.backgroundImage})`,
                opacity: isActive ? 1 : 0,
              }}
            />
          )
        })}
      </div>

      {/* Stars effect background */}
      <div className="landing-page__stars" aria-hidden="true" />
      <div className="landing-page__glow" style={{ 
        background: activeVibeForGlow 
          ? `radial-gradient(circle, ${activeVibeForGlow.colorTheme}33 0%, transparent 60%)` 
          : undefined 
      }} aria-hidden="true" />

      <header className="landing-header">
        {onOpenDonation && (
          <div className="landing-donation-trigger-container">
            <button className="landing-donation-trigger" onClick={onOpenDonation}>
              <span className="landing-donation-trigger__icon">☕</span>
              <span className="landing-donation-trigger__text">Chai on you :)</span>
            </button>
          </div>
        )}
        <div className="landing-header__logo-container">
          <span className="landing-header__live-dot" />
          <img src="/images/mehfil_logo.png" alt="MEHFIL" className="landing-header__logo" />
        </div>
        <p className="landing-header__subtitle">
          Your late-night companion. Pick a vibe, tune in, and let nostalgia play.
        </p>
      </header>

      <main className="landing-grid-container">
        <div className="landing-grid">
          {vibes.map((vibe) => {
            const isHovered = hoveredVibe?.id === vibe.id
            const desc = vibeDescriptions[vibe.id] || 'Step into another atmosphere.'

            return (
              <button
                key={vibe.id}
                className={`vibe-card ${isHovered ? 'vibe-card--active' : ''}`}
                style={{
                  '--vibe-accent': vibe.colorTheme,
                  '--vibe-bg': vibe.backgroundColor,
                } as React.CSSProperties}
                onMouseEnter={() => handleMouseEnter(vibe)}
                onMouseLeave={handleMouseLeave}
                onClick={() => onSelectVibe(vibe.id)}
                aria-label={`Tune into ${vibe.label}`}
              >
                <div 
                  className="vibe-card__bg" 
                  style={{ backgroundImage: `url(${vibe.backgroundImage})` }}
                />
                <div className="vibe-card__overlay" />
                
                <div className="vibe-card__content">
                  <span className="vibe-card__tag">LIVE BROADCAST</span>
                  <h2 className="vibe-card__title">{vibe.label}</h2>
                  <p className="vibe-card__desc">{desc}</p>
                  
                  <div className="vibe-card__action">
                    <span className="vibe-card__btn-text">Tune In</span>
                    <span className="vibe-card__btn-icon">→</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </main>

      <section className="landing-credits">
        <h3 className="landing-credits__title">CREATORS & CONTRIBUTORS</h3>
        <div className="landing-credits__grid">
          <div className="credit-card">
            <span className="credit-card__role">AWS & BACKEND INFRA</span>
            <h4 className="credit-card__name">HARSHIT SAHARAN</h4>
            <p className="credit-card__desc">Database architecture, backend infra & AWS deployment</p>
          </div>
          <div className="credit-card">
            <span className="credit-card__role">AUDIO SDK & PERFORMANCE</span>
            <h4 className="credit-card__name">PANKAJ</h4>
            <p className="credit-card__desc">Music SDK integration, audio performance & optimization</p>
          </div>
          <div className="credit-card">
            <span className="credit-card__role">AI ORCHESTRATION</span>
            <h4 className="credit-card__name">lucky</h4>
            <p className="credit-card__desc">AI orchestration, LLM-assisted architecture & vibe-coding</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p className="landing-footer__note">
          Synchronized streaming radio. Everyone hears the same tracks, at the exact same second.
        </p>
      </footer>
    </div>
  )
}
