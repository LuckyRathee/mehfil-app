# Audio Integration Context - Mehfil App

## Project Overview
A React + Vite application with 3 "vibes" (Chai Sutta, Weedy Valley, Panwadi), each with background visuals and audio tracks. The app needs to play local MP3 files and YouTube audio streams.

---

## Current State (As of Aug 17, 2026)

### Completed

#### 1. Data Model (`src/vibes.ts`)
- 3 vibes defined with background colors, images, videos
- 10 tracks total: 9 local MP3s + 1 YouTube URL
- YouTube track: "Lo-fi Radio" - `https://www.youtube.com/watch?v=Vjelj0un5CI&list=RDVjelj0un5CI&start_radio=1`

#### 2. Local Audio Files (`public/audio/`)
- 9 placeholder MP3 files created (3192 bytes each, ~1 second silence)
- Files: `chai-sutta-1/2/3.mp3`, `weedy-valley-1/2/3.mp3`, `panwadi-1/2/3.mp3`

#### 3. YouTube Converter Utility (`src/utils/youtubeConverter.ts`)
- `extractYoutubeVideoId()` - extracts 11-char video ID from various URL formats
- `isYoutubeUrl()` - detects YouTube URLs
- `getYoutubeAudioStream()` - calls `/api/youtube-audio` endpoint, returns direct stream URL

#### 4. Main App Logic (`src/App.tsx`)
- Audio playback via `<audio ref={audioRef}>`
- Track loading with YouTube detection and conversion
- Progress tracking, auto-next on ended, error handling
- Loading states and error UI (`.audio-error` component)
- Vibe switching resets playlist

#### 5. PlayerBar Component (`src/components/PlayerBar.tsx`)
- Minimal UI: title, artist, progress bar, mute toggle
- Kept minimal per requirements

#### 6. Dependencies Added
```json
"@distube/ytdl-core": "^4.16.12",  // YouTube audio extraction
"@types/node": "^24.13.3"           // Types for serverless functions
```

#### 7. Styling (`src/App.css`)
- `.audio-error` with slide-in animation for error display

---

### Blocker: YouTube API Endpoint

#### The Problem
Vite's `configureServer` middleware in `vite.config.ts` is NOT intercepting `/api/youtube-audio` requests. Instead, Vite treats the request as a module import and returns the transpiled source code (JS) instead of executing the handler.

#### Attempted Solutions
1. **Serverless function in `api/youtube-audio.ts`** - Vite doesn't auto-execute these
2. **Middleware in `configureServer` with path** - `server.middlewares.use('/api/youtube-audio', ...)` - Not matched
3. **Middleware without path + manual check** - Still returns module source
4. **Vite Plugin with dynamic import** - Same issue

#### Root Cause
Vite's internal module resolution (`/node_modules/.vite/deps/...`) intercepts requests before custom middleware can handle them. The request for `/api/youtube-audio?url=...` is being treated as a JavaScript module request.

---

## Files Overview

### Core Files (Working)
| File | Status |
|------|--------|
| `src/vibes.ts` | Complete |
| `src/App.tsx` | Complete |
| `src/utils/youtubeConverter.ts` | Complete |
| `src/components/PlayerBar.tsx` | Complete (minimal) |
| `src/App.css` | Complete |
| `public/audio/*.mp3` | Placeholders created |

### Files Needing Fix
| File | Issue |
|------|-------|
| `vite.config.ts` | **BLOCKER**: Middleware not intercepting API route |
| `api/youtube-audio.ts` | Created but unused (Vite doesn't execute serverless functions) |