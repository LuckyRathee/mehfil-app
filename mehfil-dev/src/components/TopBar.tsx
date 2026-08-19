import { useEffect, useState } from 'react'

export default function TopBar() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <header className="top-bar">
      <div className="top-bar__label">LIVE</div>
      <div className="top-bar__clock">
        {time.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </div>
    </header>
  )
}
