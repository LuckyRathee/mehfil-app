import fs from 'fs'
import { execFileSync } from 'child_process'

const API_KEY = process.env.YOUTUBE_API_KEY

const VIBE_PLAYLISTS = {
  'chai-sutta': 'PLo7WLtfSrhdbdR4K_EQzplNiDYZMFk8jQ',
  'weedy-valley': 'PLCCTHlcjByiLW1E5cG9m_9WGnuXkhmfWj',
  'panwadi': 'PL4zY2tyCYAI0UMnMRD_Tx1LW6fX1RDkB9',
  'bus-driver': 'PL0umg_TNpoZTTdZVIi5tfX69pRmoMFGna',
  'saloon': 'PLy534Is5Apmt6J6Ia61liVa8_b11cC1ov',
  'old-night-drives': 'PL2n9PsUx_VHcVgOATXGVFFP9IXjYO6wMY',
}

const requestedVibe = process.argv.includes('--vibe')
  ? process.argv[process.argv.indexOf('--vibe') + 1]
  : null

const playlistsToFetch = Object.entries(VIBE_PLAYLISTS).filter(([vibeId]) =>
  !requestedVibe || vibeId === requestedVibe
)

if (requestedVibe && playlistsToFetch.length === 0) {
  console.error(`Unknown vibe: ${requestedVibe}`)
  process.exit(1)
}

function parseISO8601Duration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) throw new Error(`Invalid duration: ${iso}`)
  return parseInt(match[1] || '0', 10) * 3600 +
         parseInt(match[2] || '0', 10) * 60 +
         parseInt(match[3] || '0', 10)
}

async function fetchJSON(url) {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(JSON.stringify(data.error || {
      status: res.status,
      statusText: res.statusText
    }, null, 2))
  }
  return data
}

async function fetchPlaylistItems(playlistId) {
  const videoIds = []
  const seenIds = new Set()
  let pageToken = ''
  do {
    const params = new URLSearchParams({
      part: 'contentDetails',
      maxResults: '50',
      playlistId,
      key: API_KEY
    })
    if (pageToken) params.set('pageToken', pageToken)
    const data = await fetchJSON(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
    )
    for (const item of data.items || []) {
      const videoId = item.contentDetails?.videoId
      if (videoId && !seenIds.has(videoId)) {
        seenIds.add(videoId)
        videoIds.push(videoId)
      }
    }
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return videoIds
}

async function fetchDurations(videoIds) {
  const durations = {}
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50)
    const params = new URLSearchParams({
      part: 'contentDetails,status',
      id: batch.join(','),
      key: API_KEY
    })
    const data = await fetchJSON(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    )
    for (const item of data.items || []) {
      if (item.contentDetails?.duration) {
        try {
          durations[item.id] = parseISO8601Duration(item.contentDetails.duration)
        } catch {
          durations[item.id] = 0
        }
      } else {
        durations[item.id] = 0
      }
    }
  }
  return durations
}

function fetchDurationsWithYtDlp(playlistId) {
  const command = process.env.YT_DLP_BIN || 'yt-dlp'
  const output = execFileSync(command, [
    '--flat-playlist',
    '--dump-single-json',
    '--skip-download',
    `https://www.youtube.com/playlist?list=${playlistId}`,
  ], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
  const data = JSON.parse(output)
  const entries = data.entries || []
  return {
    total: entries.length,
    tracks: entries
    .filter(entry => entry.id && Number(entry.duration) > 0)
    .map(entry => ({ videoId: entry.id, duration: Math.round(entry.duration) }))
  }
}

async function main() {
  const output = {}
  let failedCount = 0
  for (const [vibeId, playlistId] of playlistsToFetch) {
    console.log(`\n🔍 Fetching ${vibeId} (${playlistId})...`)
    try {
      let tracks
      let totalVideoCount
      if (API_KEY) {
        const videoIds = await fetchPlaylistItems(playlistId)
        console.log(`   Found ${videoIds.length} videos`)
        if (videoIds.length === 0) {
          throw new Error('Playlist returned no videos; keeping the existing cache')
        }
        totalVideoCount = videoIds.length
        const durations = await fetchDurations(videoIds)
        tracks = videoIds
          .filter(id => durations[id] > 0)
          .map(videoId => ({ videoId, duration: durations[videoId] }))
      } else {
        console.log('   Using yt-dlp fallback (no YouTube API key set)')
        const result = fetchDurationsWithYtDlp(playlistId)
        totalVideoCount = result.total
        tracks = result.tracks
        if (tracks.length === 0) {
          throw new Error('Playlist returned no usable durations; keeping the existing cache')
        }
        console.log(`   Found ${tracks.length} videos with durations`)
      }
      
      const skipped = totalVideoCount - tracks.length
      if (skipped) console.log(`   ⚠️  Skipped ${skipped} videos with 0/unknown duration`)
      
      output[vibeId] = tracks
      console.log(`   ✅ ${tracks.length} tracks cached`)
    } catch (err) {
      failedCount += 1
      console.error(`   ❌ Failed: ${err.message}`)
      console.error('   Existing duration cache was preserved')
    }
  }

  const outputDir = 'src/data/trackDurations'
  fs.mkdirSync(outputDir, { recursive: true })
  for (const [vibeId, tracks] of Object.entries(output)) {
    fs.writeFileSync(
      `${outputDir}/${vibeId}.json`,
      JSON.stringify(tracks, null, 2) + '\n'
    )
  }
  console.log(`\n💾 Written ${Object.keys(output).length} duration files to ${outputDir}`)
  if (failedCount > 0) {
    process.exitCode = 1
  }
}

main()
