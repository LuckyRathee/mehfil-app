import type { TrackInfo, PlaybackPosition } from '../vibes/types'

export const GAP_DURATION_SECONDS = 5.5 // 5.5-second crossfade with buffer for pre-queueing

export function getCurrentPlaybackPosition(
  tracks: TrackInfo[],
  epochMs: number,
  now: number = Date.now()
): PlaybackPosition | null {
  if (!tracks.length) return null

  const totalDuration = tracks.reduce((sum, t) => sum + t.duration + GAP_DURATION_SECONDS, 0)
  if (totalDuration <= 0) return null

  const elapsedSeconds = Math.max(0, (now - epochMs) / 1000)
  const loopPosition = elapsedSeconds % totalDuration

  let cursor = 0
  for (let i = 0; i < tracks.length; i++) {
    const playDuration = tracks[i].duration
    const totalTrackDuration = playDuration + GAP_DURATION_SECONDS
    const trackEnd = cursor + totalTrackDuration

    if (loopPosition < trackEnd) {
      const offset = loopPosition - cursor
      if (offset < playDuration) {
        return { trackIndex: i, offsetSeconds: offset, isStaticWindow: false }
      } else {
        return { trackIndex: i, offsetSeconds: offset - playDuration, isStaticWindow: true }
      }
    }
    cursor = trackEnd
  }

  return { trackIndex: tracks.length - 1, offsetSeconds: 0, isStaticWindow: false }
}