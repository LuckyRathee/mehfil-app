# Context Summary - Mehfil App Development Session

**Date:** August 20, 2026  
**Session Duration:** Multiple iterations throughout the day  
**Branch/Commit:** Latest commit `5435df419f88bd5516df6a7f093ee7021fe18c77`

---

## Overview

This session focused on refactoring the Mehfil Radio app to improve performance through code splitting and lazy loading, fixing playlist switching bugs, and centralizing playlist ID management.

---

## Major Changes

### 1. Code Splitting & Lazy Loading Architecture

**Created new directory structure:**
```
src/vibes/
├── types.ts              # Shared TypeScript interfaces
├── playlistIds.ts        # Centralized playlist ID constants
├── index.ts              # Lazy loading utilities with caching
├── chai-sutta.ts         # Individual vibe data files
├── weedy-valley.ts
├── panwadi.ts
├── bus-driver.ts
├── saloon.ts
└── old-night-drives.ts

src/data/trackDurations/
├── index.ts              # Lazy loading for track durations
├── chai-sutta.json       # Individual track duration files
├── weedy-valley.json
├── panwadi.json
├── bus-driver.json
├── saloon.json
└── old-night-drives.json
```

**Key Features:**
- **Dynamic imports** - Each vibe loads only when needed
- **Caching layer** - Loaded vibes/track durations cached in memory
- **Hover preloading** - Preloads next vibe on hover for instant switching
- **Loading screen** - Shows spinner while initial vibes load

**Build Output (separate chunks):**
```
dist/assets/chai-sutta-*.js          ~0.6-1.5 kB
dist/assets/weedy-valley-*.js        ~0.5-31 kB
dist/assets/panwadi-*.js             ~0.5-2 kB
dist/assets/bus-driver-*.js          ~0.5-2.8 kB
dist/assets/saloon-*.js              ~0.5-2.6 kB
dist/assets/old-night-drives-*.js    ~0.5-2.3 kB
dist/assets/index-*.js               ~222 kB (main bundle)
```

### 2. Playlist Switching Bug Fixes

**Root Cause:** Race condition between:
- `onPlayerReady` calling `tuneIntoVibe()` (uses `loadVideoById`)
- `handleSelectVibe` calling `loadPlaylist()`
- `onStateChange` (video end) calling `tuneIntoVibe()` again

**Solution:** Unified to use **only `loadPlaylist`** for all player interactions:
- `onPlayerReady` → loads playlist for initial vibe
- `handleSelectVibe` → loads playlist for selected vibe
- `onPlayerError` → reloads current playlist
- Removed `tuneIntoVibe` calls from player callbacks
- YouTube playlist API auto-advances to next video

**Additional Fix:** Early return in `handleSelectVibe` prevents unnecessary reloads when clicking the same vibe.

### 3. Centralized Playlist ID Management

**Created:** `src/vibes/playlistIds.ts`
```typescript
export const playlistIds = {
  'chai-sutta': 'PL3pHzzJ_qh96fpA11KWFQ5h3nFfzGkIAR',
  'weedy-valley': 'PLCCTHlcjByiLW1E5cG9m_9WGnuXkhmfWj',
  'panwadi': 'PL4zY2tyCYAI0UMnMRD_Tx1LW6fX1RDkB9',
  'bus-driver': 'PL0umg_TNpoZTTdZVIi5tfX69pRmoMFGna',
  'saloon': 'PLy534Is5Apmt6J6Ia61liVa8_b11cC1ov',
  'old-night-drives': 'PL2n9PsUx_VHcVgOATXGVFFP9IXjYO6wMY',
} as const

export type VibeId = keyof typeof playlistIds
```

**Updated all vibe files** to import from this central source.

### 4. Fixed Background Image for Old Night Drives

**Issue:** Filename mismatch - actual file is `old-night-drive.png` (singular) but config referenced `old-night-drives.png` (plural)

**Fix:** Updated `src/vibes/old-night-drives.ts` backgroundImage path.

### 5. Removed Legacy Files

**Deleted:**
- `src/vibes.ts` (monolithic vibe definitions)
- `src/data/trackDurations.json` (monolithic track durations)

---

## Files Modified

### New Files Created:
- `src/vibes/types.ts`
- `src/vibes/playlistIds.ts`
- `src/vibes/index.ts`
- `src/vibes/chai-sutta.ts`
- `src/vibes/weedy-valley.ts`
- `src/vibes/panwadi.ts`
- `src/vibes/bus-driver.ts`
- `src/vibes/saloon.ts`
- `src/vibes/old-night-drives.ts`
- `src/data/trackDurations/index.ts`
- `src/data/trackDurations/chai-sutta.json`
- `src/data/trackDurations/weedy-valley.json`
- `src/data/trackDurations/panwadi.json`
- `src/data/trackDurations/bus-driver.json`
- `src/data/trackDurations/saloon.json`
- `src/data/trackDurations/old-night-drives.json`

### Modified Files:
- `src/App.tsx` - Complete rewrite with lazy loading, playlist-only approach
- `src/components/VibeSwitcher.tsx` - Added `onVibeHover` prop for preloading
- `src/utils/liveSync.ts` - Updated to use shared types from `vibes/types.ts`
- `src/App.css` - Added loading screen styles

### Deleted Files:
- `src/vibes.ts`
- `src/data/trackDurations.json`

---

## Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| Initial JS bundle | ~260 kB (single) | ~222 kB (main) + lazy chunks |
| Vibe switching | Full reload | Instant (preloaded) or fast (lazy) |
| Unused vibe data | Loaded upfront | Never loaded unless needed |
| Track durations | All loaded | Per-vibe on demand |

---

## Technical Details

### Lazy Loading Pattern
```typescript
// src/vibes/index.ts
const vibeModules = {
  'chai-sutta': () => import('./chai-sutta'),
  // ...
}

const vibeCache = {}

export async function getVibe(id) {
  if (vibeCache[id]) return vibeCache[id]
  const module = await vibeModules[id]()
  vibeCache[id] = module.default
  return module.default
}
```

### Playlist-Only Player Integration
```typescript
// All player interactions use loadPlaylist
playerTarget.loadPlaylist({
  list: vibe.playlistId,
  listType: 'playlist',
  index: 0,
  startSeconds: 0,
})
```

---

## Verification

- ✅ TypeScript compilation passes (`tsc -b`)
- ✅ Vite build succeeds with code splitting
- ✅ All 6 vibes have separate chunks
- ✅ Playlist IDs centralized and consistent
- ✅ No playlist mixing between vibes
- ✅ Hover preloading works for faster switching

---

## Next Steps / Future Improvements

1. **Service Worker** - Cache vibe chunks for offline/repeat visits
2. **Preload Strategy** - Preload all vibes on idle (requestIdleCallback)
3. **Error Boundaries** - Graceful fallback if vibe chunk fails to load
4. **Analytics** - Track vibe switching performance metrics
5. **Background Video** - Implement video backgrounds for vibes that have them