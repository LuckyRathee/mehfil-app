# MEHFIL APP DEVELOPMENT CONTEXT & UPDATES SUMMARY
Last Updated: 2026-08-21T23:02:00+05:30

## 1. Accomplished Updates & Corrections

### A. Music Sync & Player Performance
* **ESM Dynamic JSON Loader Bug Fix**: Extracted the `.default` exports from Vite dynamic JSON imports inside `src/data/trackDurations/index.ts` to retrieve raw arrays, resolving the "No live tracks available" playback error.
* **Warm Pre-Buffering on Startup**: Initialized player state to muted (`isMuted: true` by default) and preloaded the default *Chai Sutta* playlist muted in the background on mount. Playback starts instantly (0ms delay) once the user clicks "Tune In".
* **Fail-Safe Stream Recovery**: Handled player load failures inside `onPlayerError` by falling back to loading the raw `videoId` directly, bypassing playlist-level permissions.
* **Race Condition Guards**: Added `activeVibeIdRef` to protect async playlist loading. If a user switches vibes rapidly, older pending async imports discard themselves without interrupting the active vibe.
* **Smooth Vibe Swapping**: Added `player.stopVideo()` before launching a new playlist, clearing buffers to ensure the player loads the requested playlist index on the first attempt.

### B. Analog Radio Static Transition Windows
* **10-Second Gaps**: Built a `GAP_DURATION_SECONDS = 10` transition gap between tracks in the `getCurrentPlaybackPosition` timeline calculation (`src/utils/liveSync.ts`).
* **Procedural Static Noise**: Programmed a custom Web Audio API white noise generator in `src/App.tsx`. 
* **1s Sync Interval**: Shifted resync checks to run every 1 second. When inside a gap, the YouTube video pauses, title changes to `Tuning station...`, and soft white noise fades in. Once the gap ends, the static fades out and the next video plays.

### C. Branding & UI Customizations
* **App Favicon**: Updated `index.html` to map the browser tab icon to `/images/logo_main.png`.
* **Landing Page Logo**: Swapped the text header "MEHFIL" with the branding image `/images/mehfil_logo.png` on the landing page.
* **TopBar Logo Integration**: Sectioned `src/components/TopBar.tsx` into left, center, and right flex compartments. The center compartment renders the logo and the donation button in the top center of all player pages.
* **Unified Donation Button**: Lifted the donation modal state to `App.tsx` and refactored `<DonationButton>` to accept controlled props, removing its duplicate floating button. Placed identical orange gradient buttons above the logo on both pages and adjusted alignment (`margin-top: -8px` on player screens).

## 2. Updated File Registry

### Created Files
* [`src/components/LandingPage.tsx`](file:///D:/GitRepo/mehfil-app/src/components/LandingPage.tsx) - Responsive landing page layout.
* [`CONTEXT-SUMMARY.md`](file:///D:/GitRepo/mehfil-app/CONTEXT-SUMMARY.md) - This summary file.

### Modified Files
* [`src/App.tsx`](file:///D:/GitRepo/mehfil-app/src/App.tsx) - Embedded Web Audio synthesizer, race condition controls, 1s sync loop, preloading startup logic, and donation state lifting.
* [`src/App.css`](file:///D:/GitRepo/mehfil-app/src/App.css) - Appended styling for top bar flex layout, unified orange gradient donation triggers, and pulled-up alignments.
* [`src/components/TopBar.tsx`](file:///D:/GitRepo/mehfil-app/src/components/TopBar.tsx) - Added flex layout with center-positioned logo and donation button.
* [`src/components/DonationButton.tsx`](file:///D:/GitRepo/mehfil-app/src/components/DonationButton.tsx) - Refactored as controlled component and removed old floating markup.
* [`src/utils/liveSync.ts`](file:///D:/GitRepo/mehfil-app/src/utils/liveSync.ts) - Incorporated timeline gap duration checks.
* [`src/vibes/types.ts`](file:///D:/GitRepo/mehfil-app/src/vibes/types.ts) - Modified `PlaybackPosition` interface to support the `isStaticWindow` flag.
* [`src/vibes/playlistIds.ts`](file:///D:/GitRepo/mehfil-app/src/vibes/playlistIds.ts) - Updated the `old-night-drives` playlist ID to `PLHpUqbmxs4E0`.
* [`src/data/trackDurations/old-night-drives.json`](file:///D:/GitRepo/mehfil-app/src/data/trackDurations/old-night-drives.json) - Saved scraped track durations for the updated Old Night Drives playlist.
* [`index.html`](file:///D:/GitRepo/mehfil-app/index.html) - Swapped favicon to `logo_main.png`.
