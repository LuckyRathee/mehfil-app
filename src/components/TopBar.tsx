import { useEffect, useState } from 'react'

interface TopBarProps {
  onBackToLanding?: () => void
  onOpenDonation?: () => void
}

export default function TopBar({ onBackToLanding, onOpenDonation }: TopBarProps) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <header className="top-bar">
      <div className="top-bar__left">
        {onBackToLanding ? (
          <button 
            onClick={onBackToLanding} 
            className="top-bar__back-btn"
            aria-label="Back to vibes"
          >
            ← Change Vibe
          </button>
        ) : (
          <div className="top-bar__label">LIVE</div>
        )}
      </div>

      <div className="top-bar__center">
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
      </div>

      <div className="top-bar__right">
        <div className="top-bar__clock">
          {time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      </div>
    </header>
  )
}

