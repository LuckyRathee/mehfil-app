import type { Vibe } from './types'

// Lazy-loaded vibe modules - only loads when needed
const vibeModules: Record<string, () => Promise<{ default: Vibe }>> = {
  'chai-sutta': () => import('./chai-sutta'),
  'weedy-valley': () => import('./weedy-valley'),
  'panwadi': () => import('./panwadi'),
  'bus-driver': () => import('./bus-driver'),
  'saloon': () => import('./saloon'),
  'old-night-drives': () => import('./old-night-drives'),
  'theth-desi': () => import('./theth-desi'),
}

// Cache for loaded vibes
const vibeCache: Record<string, Vibe> = {}

/**
 * Get a vibe by ID - loads it dynamically if not already cached
 */
export async function getVibe(id: string): Promise<Vibe | null> {
  if (vibeCache[id]) {
    return vibeCache[id]
  }

  const loader = vibeModules[id]
  if (!loader) {
    return null
  }

  try {
    const module = await loader()
    const vibe = module.default
    vibeCache[id] = vibe
    return vibe
  } catch (error) {
    console.error(`Failed to load vibe: ${id}`, error)
    return null
  }
}

/**
 * Get all vibes - loads all vibe modules
 */
export async function getAllVibes(): Promise<Vibe[]> {
  const vibeIds = Object.keys(vibeModules)
  const vibes = await Promise.all(vibeIds.map(id => getVibe(id)))
  return vibes.filter((v): v is Vibe => v !== null)
}

/**
 * Get vibe IDs without loading the full vibe data
 */
export function getVibeIds(): string[] {
  return Object.keys(vibeModules)
}

/**
 * Preload a specific vibe (useful for hover/prefetch)
 */
export function preloadVibe(id: string): Promise<Vibe | null> | null {
  const loader = vibeModules[id]
  if (!loader) {
    return null
  }
  return loader().then(module => {
    vibeCache[id] = module.default
    return module.default
  })
}

/**
 * Preload all vibes
 */
export function preloadAllVibes(): Promise<Vibe[]> {
  const vibeIds = Object.keys(vibeModules)
  return Promise.all(vibeIds.map(id => preloadVibe(id)!)).then(
    vibes => vibes.filter((v): v is Vibe => v !== null)
  )
}

// Re-export types for convenience
export type { Vibe } from './types'
