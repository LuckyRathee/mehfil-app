import type { TrackInfo } from '../../vibes/types'

// Lazy-loaded track duration modules - only loads when needed
const trackDurationModules: Record<string, () => Promise<TrackInfo[]>> = {
  'chai-sutta': () => import('./chai-sutta.json'),
  'weedy-valley': () => import('./weedy-valley.json'),
  'panwadi': () => import('./panwadi.json'),
  'bus-driver': () => import('./bus-driver.json'),
  'saloon': () => import('./saloon.json'),
  'old-night-drives': () => import('./old-night-drives.json'),
}

// Cache for loaded track durations
const trackDurationCache: Record<string, TrackInfo[]> = {}

/**
 * Get track durations for a vibe by ID - loads it dynamically if not already cached
 */
export async function getTrackDurations(vibeId: string): Promise<TrackInfo[]> {
  if (trackDurationCache[vibeId]) {
    return trackDurationCache[vibeId]
  }

  const loader = trackDurationModules[vibeId]
  if (!loader) {
    return []
  }

  try {
    const tracks = await loader()
    trackDurationCache[vibeId] = tracks
    return tracks
  } catch (error) {
    console.error(`Failed to load track durations for: ${vibeId}`, error)
    return []
  }
}

/**
 * Preload track durations for a specific vibe
 */
export function preloadTrackDurations(vibeId: string): Promise<TrackInfo[]> | null {
  const loader = trackDurationModules[vibeId]
  if (!loader) {
    return null
  }
  return loader().then(tracks => {
    trackDurationCache[vibeId] = tracks
    return tracks
  })
}

/**
 * Preload all track durations
 */
export async function preloadAllTrackDurations(): Promise<void> {
  const vibeIds = Object.keys(trackDurationModules)
  await Promise.all(vibeIds.map(id => preloadTrackDurations(id)))
}