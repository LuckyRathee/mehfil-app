import type { TrackInfo, PlaybackPosition } from '../vibes/types'

export function getCurrentPlaybackPosition(
  tracks: TrackInfo[],
  epochMs: number,
  now: number = Date.now()
): PlaybackPosition | null {
  if (!tracks.length) return null

  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0)
  if (totalDuration <= 0) return null

  const elapsedSeconds = Math.max(0, (now - epochMs) / 1000)
  const loopPosition = elapsedSeconds % totalDuration

  let cursor = 0
  for (let i = 0; i < tracks.length; i++) {
    const trackEnd = cursor + tracks[i].duration
    if (loopPosition < trackEnd) {
      return { trackIndex: i, offsetSeconds: loopPosition - cursor }
    }
    cursor = trackEnd
  }

  return { trackIndex: tracks.length - 1, offsetSeconds: 0 }
}