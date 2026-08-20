import { useEffect, useRef } from 'react'

const ROTATION_PERIOD_MS = 12000 // ~12s per full rotation while audible
const ROTATION_VELOCITY = (Math.PI * 2) / ROTATION_PERIOD_MS // rad per ms

interface RadioPlayerProps {
  /** Artwork/logo for the currently selected vibe. */
  logo: string
  /** Vibe accent color (hex) used to tint the ambient glow + waveform. */
  accentColor: string
  title: string
  artist: string
  isMuted: boolean
  onToggleMute: () => void
}

export default function RadioPlayer({
  logo,
  accentColor,
  title,
  artist,
  isMuted,
  onToggleMute,
}: RadioPlayerProps) {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightCanvasRef = useRef<HTMLCanvasElement>(null)
  const discRef = useRef<HTMLButtonElement>(null)
  const artRef = useRef<HTMLImageElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)

  // Mirror props into a ref the animation loop reads every frame, so the
  // loop never needs to be torn down/recreated when props change.
  const stateRef = useRef({ isMuted, accentColor })
  useEffect(() => {
    stateRef.current = { isMuted, accentColor }
  }, [isMuted, accentColor])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const leftCanvas = leftCanvasRef.current
    const rightCanvas = rightCanvasRef.current
    const leftCtx = leftCanvas?.getContext('2d')
    const rightCtx = rightCanvas?.getContext('2d')
    const art = artRef.current
    if (!leftCanvas || !leftCtx || !rightCanvas || !rightCtx || !art) return

    // Non-null aliases for use inside the animation closures (guard
    // narrowing doesn't flow into hoisted function declarations).
    const leftCanvasEl = leftCanvas
    const rightCanvasEl = rightCanvas
    const leftCtxEl = leftCtx
    const rightCtxEl = rightCtx
    const artEl = art

    const WAVE_COLUMNS = 32
    // Independent clocks for each side ensure the two waveforms drift
    // apart so the pair never looks mirrored or frozen.
    const sideA = Math.random() * Math.PI * 2
    const sideB = Math.random() * Math.PI * 2

    interface WaveNode {
      target: number
      current: number
      // Per-node wandering bias, drift speed and phase — each slice moves
      // on its own clock so the shape is always in motion.
      bias: number
      seed: number
      drift: number
    }

    const nodes = {
      left: Array.from({ length: WAVE_COLUMNS }, (): WaveNode => ({
        target: 0,
        current: 0,
        bias: Math.random() * 0.35,
        seed: Math.random() * Math.PI * 2,
        drift: 0.6 + Math.random() * 1.1,
      })),
      right: Array.from({ length: WAVE_COLUMNS }, (): WaveNode => ({
        target: 0,
        current: 0,
        bias: Math.random() * 0.35,
        seed: Math.random() * Math.PI * 2,
        drift: 0.6 + Math.random() * 1.1,
      })),
    }

    const gradients = new Map<CanvasRenderingContext2D, CanvasGradient>()

    function setCanvasSize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      gradients.set(
        ctx,
        ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height) / 2
        )
      )
    }
    setCanvasSize(leftCanvasEl, leftCtxEl)
    setCanvasSize(rightCanvasEl, rightCtxEl)

    // Seam for real audio analysis. Cross-origin YouTube audio cannot be
    // tapped by an AnalyserNode, so energy comes from the procedural model.
    // Swap this read() for real band energy later without touching the
    // renderer — read() fills in bandA/bandB/bandC (0..1) each frame.
    const analyser = {
      bandA: 0,
      bandB: 0,
      bandC: 0,
      read(): void {
        this.bandA = 0
        this.bandB = 0
        this.bandC = 0
      },
    }

    let raf = 0
    let last = performance.now()
    // Rotation state lives here, outside React, so pausing/resuming
    // preserves the current angle instead of snapping back to 0.
    let angle = Math.random() * Math.PI * 2
    let velocity = isMuted ? 0 : ROTATION_VELOCITY

    function tick(now: number) {
      const dt = Math.min(now - last, 64)
      last = now

      const { isMuted: muted } = stateRef.current
      analyser.read()

      // Smoothly ramp rotation velocity toward its target. ~0.55s attack /
      // ~0.7s decay gives a physical start & stop that never snaps or
      // bounces, and never resets the angle.
      if (!reducedMotion) {
        const targetVel = muted ? 0 : ROTATION_VELOCITY
        const ramp = muted ? 1 - Math.exp(-dt / 420) : 1 - Math.exp(-dt / 550)
        velocity += (targetVel - velocity) * ramp
        angle = (angle + velocity * dt) % (Math.PI * 2)
        artEl.style.transform = `rotate(${angle}rad)`
      }

      const time = now / 1000

      // Re-aim node targets so the wave continuously changes shape. Each
      // slice rides its own slow clock, modulated by a broad envelope that
      // peaks near the center and tapers outward, plus band-shaped energy.
      const energy = 0.55 * analyser.bandA + 0.3 * analyser.bandB + 0.15 * analyser.bandC
      const drive = muted ? 0.075 * energy + 0.02 : 0.55 + 0.35 * energy

      for (const side of ['left', 'right'] as const) {
        const phase = side === 'left' ? sideA : sideB
        for (let i = 0; i < WAVE_COLUMNS; i++) {
          const node = nodes[side][i]
          const t = i / (WAVE_COLUMNS - 1)
          // Broad main hum tapers to the edges; higher harmonics give depth.
          const envelope = Math.sin(t * Math.PI) * 0.9 + Math.sin(t * Math.PI * 2 + phase + time * 1.3) * 0.35 * Math.sin(t * Math.PI)
          const ripple = Math.sin(t * Math.PI * 3 + node.seed + time * node.drift) * 0.25
          const travel = Math.sin(time * 0.9 + phase + i * 0.42) * 0.28
          const shaped = envelope * 0.55 + ripple + travel + node.bias
          node.target = shaped * drive
        }
      }

      // Different damping rates on rise vs fall give a floating feel.
      const dampA = 1 - Math.exp(-dt / 240)
      const dampB = 1 - Math.exp(-dt / 96)
      for (const side of ['left', 'right'] as const) {
        for (const node of nodes[side]) {
          const target = node.target
          node.current = node.current + (target - node.current) * (target > node.current ? dampB : dampA)
        }
      }

      draw(leftCtxEl, leftCanvasEl, 'left', muted, time)
      draw(rightCtxEl, rightCanvasEl, 'right', muted, time)

      if (statusRef.current) {
        statusRef.current.textContent = muted ? 'Muted' : 'On air'
      }

      raf = requestAnimationFrame(tick)
    }

    function draw(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      side: 'left' | 'right',
      muted: boolean,
      time: number
    ) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Resolve the accent color freshly per frame so switching vibe
      // recolors the waveform without restarting the animation loop.
      const accentRgb =
        stateRef.current.accentColor.replace(/^#/, '').match(/.{2}/g)?.map(h => parseInt(h, 16)).join(',') ??
        '255,255,255'

      const w = canvas.width
      const h = canvas.height
      const dpr = window.devicePixelRatio || 1
      const columnW = Math.max(2, Math.round((w / WAVE_COLUMNS) * 0.72))
      const inner = side === 'left' ? w : 0 // the canvas edge that faces the logo
      const outer = side === 'left' ? 0 : w
      const phase = side === 'left' ? sideA : sideB

      ctx.save()
      const grad = gradients.get(ctx)
      if (grad) {
        ctx.globalAlpha = muted ? 0.32 : 0.45
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      ctx.globalAlpha = muted ? 0.45 : 1
      // A soft traveling glow trailing the wave adds atmosphere without a
      // hard border.
      const travelGlow = 0.5 + 0.5 * Math.sin(time * 0.6 + phase)
      ctx.fillStyle = `rgba(${accentRgb},${0.05 + 0.05 * travelGlow})`
      ctx.fillRect(0, h * 0.2, w, h * 0.6)

      for (let i = 0; i < WAVE_COLUMNS; i++) {
        const node = nodes[side][i]
        const colW = columnW * 0.62
        const x0 = i * (w / WAVE_COLUMNS)

        // Fade the wave near the logo (inner edge) and near the screen edge
        // (outer edge) so both ends dissolve gently instead of stopping.
        const distFromLogo = Math.abs(x0 + colW / 2 - inner)
        const distFromEdge = Math.abs(x0 + colW / 2 - outer)
        const fadeToLogo = Math.max(0, Math.min(1, distFromLogo / (34 * dpr)))
        const fadeToEdge = Math.max(0, Math.min(1, distFromEdge / (30 * dpr)))
        const fade = Math.min(fadeToLogo, fadeToEdge)

        const amp = node.current
        const top = h / 2 - amp * h * 0.46
        const bottom = h / 2 + amp * h * 0.46

        // Per-column glow so bars read as soft light, not hard blocks.
        const glow = 0.5 + 0.5 * Math.abs(Math.sin(time * 1.7 + node.seed))
        const g = ctx.createLinearGradient(0, top, 0, bottom)
        const color = muted ? '255,255,255' : accentRgb
        g.addColorStop(0, `rgba(${color},0)`)
        g.addColorStop(0.5, `rgba(${color},${(0.35 + 0.2 * glow) * fade})`)
        g.addColorStop(1, `rgba(${color},0)`)

        ctx.fillStyle = g
        ctx.fillRect(x0, top, colW, Math.max(2, bottom - top))
        ctx.fillStyle = `rgba(${color},${(0.55 + 0.3 * glow) * fade})`
        ctx.fillRect(x0, h / 2 - 0.5 * dpr, colW, dpr)
      }
      ctx.restore()
    }

    function handleResize() {
      setCanvasSize(leftCanvasEl, leftCtxEl)
      setCanvasSize(rightCanvasEl, rightCtxEl)
    }

    window.addEventListener('resize', handleResize)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
    }
    // The animation loop only ever reads props through stateRef to stay
    // stable across prop changes, so it must not re-run on isMuted toggles
    // (that would reset the disc's rotation angle and wave phase).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="radio-player" data-position="bottom-center">
      <canvas ref={leftCanvasRef} className="radio-player__wave radio-player__wave--left" aria-hidden="true" />
      <div className="radio-player__center" style={{ color: accentColor }}>
        <div className="radio-player__halo" aria-hidden="true" />
        <button
          type="button"
          ref={discRef}
          className="radio-player__disc"
          onClick={onToggleMute}
          aria-pressed={!isMuted}
          aria-label={isMuted ? 'Unmute Mehfil Radio' : 'Mute Mehfil Radio'}
          data-muted={isMuted}
        >
          <img ref={artRef} className="radio-player__disc-art" src={logo} alt="" draggable={false} />
        </button>
        <div className="radio-player__meta">
          <span className="radio-player__title">{title}</span>
          <span className="radio-player__artist">{artist}</span>
        </div>
        <span className="radio-player__status" aria-hidden="true">
          <span ref={statusRef}>{isMuted ? 'Muted' : 'On air'}</span>
        </span>
      </div>
      <canvas ref={rightCanvasRef} className="radio-player__wave radio-player__wave--right" aria-hidden="true" />
    </div>
  )
}
