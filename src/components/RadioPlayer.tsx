import { useEffect, useRef } from 'react'

interface RadioPlayerProps {
  /** Vibe accent color used by the center player UI. */
  accentColor: string
  title: string
  artist: string
  isMuted: boolean
  onToggleMute: () => void
}

export default function RadioPlayer({
  accentColor,
  isMuted,
  onToggleMute,
}: RadioPlayerProps) {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightCanvasRef = useRef<HTMLCanvasElement>(null)
  const discRef = useRef<HTMLButtonElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)

  // Mirror props into a ref the animation loop reads every frame, so the
  // loop never needs to be torn down/recreated when props change.
  const stateRef = useRef({ isMuted, accentColor })
  useEffect(() => {
    stateRef.current = { isMuted, accentColor }
  }, [isMuted, accentColor])

  useEffect(() => {
    const leftCanvas = leftCanvasRef.current
    const rightCanvas = rightCanvasRef.current
    const leftCtx = leftCanvas?.getContext('2d')
    const rightCtx = rightCanvas?.getContext('2d')
    if (!leftCanvas || !leftCtx || !rightCanvas || !rightCtx) return

    // Keep non-null aliases for the animation callbacks. TypeScript cannot
    // retain the ref guard's narrowing inside nested functions.
    const leftCanvasEl = leftCanvas
    const rightCanvasEl = rightCanvas
    const leftCtxEl = leftCtx
    const rightCtxEl = rightCtx
    const TAU = Math.PI * 2

    interface WaveNode {
      target: number
      current: number
      seed: number
      drift: number
      weight: number
    }

    // Deterministic phases keep the animation organic without allocating
    // random values on every frame or changing shape on every mount.
    const phase = (index: number, side: number) =>
      ((index * 1.61803398875 + side * 0.731) % 1) * TAU

    const createNodes = (count: number, side: number): WaveNode[] =>
      Array.from({ length: count }, (_, i): WaveNode => ({
        target: 0,
        current: 0,
        seed: phase(i, side),
        drift: 0.62 + ((i + side) % 6) * 0.075,
        weight: 0.72 + ((i * 7) % 9) / 30,
      }))

    let nodes = { left: [] as WaveNode[], right: [] as WaveNode[] }
    let waveColumns = 0

    function setCanvasSize(canvas: HTMLCanvasElement) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
    }

    function updateWaveColumns() {
      const availableWidth = Math.min(
        leftCanvasEl.getBoundingClientRect().width,
        rightCanvasEl.getBoundingClientRect().width
      )
      // Large displays get 20–26 slim bars per side. As the visualizer
      // contracts, reduce the count instead of letting dense bars collide.
      const nextCount = Math.max(12, Math.min(26, Math.round(availableWidth / 13)))
      if (nextCount !== waveColumns) {
        waveColumns = nextCount
        nodes = {
          left: createNodes(waveColumns, 1),
          right: createNodes(waveColumns, 2),
        }
      }
    }

    setCanvasSize(leftCanvasEl)
    setCanvasSize(rightCanvasEl)
    updateWaveColumns()

    let raf = 0
    let last = performance.now()
    function tick(now: number) {
      const dt = Math.min(now - last, 64)
      last = now
      const { isMuted: muted } = stateRef.current
      const time = now / 1000

      // YouTube playback is cross-origin, so the browser cannot expose its
      // decoded audio spectrum to an AnalyserNode. Instead, create a stable,
      // musical procedural signal driven by the real playback/mute state.
      const activity = muted ? 0.08 : 0.82
      const beat = muted ? 0 : Math.pow(Math.max(0, Math.sin(time * 2.05)), 8)
      for (const side of ['left', 'right'] as const) {
        const sideNodes = nodes[side]
        for (let i = 0; i < sideNodes.length; i++) {
          const node = sideNodes[i]
          const t = i / Math.max(1, sideNodes.length - 1)

          // The tallest bars sit in the outer-middle waveform region. The
          // center retains a small, non-zero amplitude so the connector bars
          // keep breathing instead of becoming fixed dots.
          const outerPeak = Math.sin((1 - t) * Math.PI)
          const centerTaper = Math.pow(1 - t, 0.45)
          const breathing = 0.58 + 0.18 * Math.sin(time * 1.15 + node.seed)
          const ripple = 0.16 * Math.sin(time * node.drift + node.seed + i * 0.38)
          const sideOffset = side === 'left' ? 0 : 0.07
          const waveformShape = 0.18 + outerPeak * 0.82 * centerTaper

          const target = Math.max(
            0.035,
            waveformShape *
              (breathing + ripple + beat * (0.24 + 0.08 * Math.sin(i + sideOffset))) *
              activity *
              node.weight
          )

          node.target = Math.min(1, target)
        }
      }

      const rise = 1 - Math.exp(-dt / 90)
      const fall = 1 - Math.exp(-dt / 220)
      for (const side of ['left', 'right'] as const) {
        for (const node of nodes[side]) {
          const easing = node.target > node.current ? rise : fall
          node.current += (node.target - node.current) * easing
        }
      }

      draw(leftCtxEl, leftCanvasEl, nodes.left, muted)
      draw(rightCtxEl, rightCanvasEl, nodes.right, muted)

      if (statusRef.current) {
        statusRef.current.textContent = muted ? 'Muted' : 'On air'
      }

      raf = requestAnimationFrame(tick)
    }

    function draw(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      sideNodes: WaveNode[],
      muted: boolean
    ) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      const centerY = h / 2
      const barWidth = Math.max(2, Math.min(3, w / (sideNodes.length * 3.6)))
      const step = w / sideNodes.length
      const maxHeight = Math.min(h * 0.78, 76)

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = muted ? 0.28 : 0.9

      for (let i = 0; i < sideNodes.length; i++) {
        const node = sideNodes[i]
        // `node.current` already includes the taper. Keep only a tiny visual
        // floor here; every bar, including the innermost one, still derives
        // its height from the animated value above.
        const height = Math.max(1.4, node.current * maxHeight)
        const x = i * step + (step - barWidth) / 2
        const y = centerY - height / 2
        const radius = barWidth / 2

        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, height, radius)
        ctx.fill()
      }

      ctx.globalAlpha = 1
    }

    function handleResize() {
      setCanvasSize(leftCanvasEl)
      setCanvasSize(rightCanvasEl)
      updateWaveColumns()
    }

    window.addEventListener('resize', handleResize)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="radio-player" data-position="bottom-center">
      <div className="radio-player__visualizer" style={{ color: accentColor }}>
        <canvas ref={leftCanvasRef} className="radio-player__wave radio-player__wave--left" aria-hidden="true" />
        <div className="radio-player__disc-anchor">
          <button
            type="button"
            ref={discRef}
            className="radio-player__disc"
            onClick={onToggleMute}
            aria-pressed={!isMuted}
            aria-label={isMuted ? 'Unmute Mehfil Radio' : 'Mute Mehfil Radio'}
            data-muted={isMuted}
          >
            <img className="radio-player__disc-art" src="/images/mehfil-logo-disc.png" alt="" draggable={false} />
          </button>
        </div>
        <canvas ref={rightCanvasRef} className="radio-player__wave radio-player__wave--right" aria-hidden="true" />
      </div>
      <div className="radio-player__meta" data-muted={isMuted}>
        <span className="radio-player__status" aria-hidden="true">
          <span ref={statusRef}>{isMuted ? 'Muted' : 'On air'}</span>
        </span>
      </div>
    </div>
  )
}
