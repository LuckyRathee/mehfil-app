import fs from 'fs'

const API_KEY = process.env.YOUTUBE_API_KEY
if (!API_KEY) {
  console.error('Set YOUTUBE_API_KEY env var first')
  process.exit(1)
}

const VIBE_PLAYLISTS = {
  'chai-sutta': 'PL3pHzzJ_qh96fpA11KWFQ5h3nFfzGkIAR',
  'weedy-valley': 'PLCCTHlcjByiLW1E5cG9m_9WGnuXkhmfWj',
  'panwadi': 'PL4zY2tyCYAI0UMnMRD_Tx1LW6fX1RDkB9',
  'bus-driver': 'PL0umg_TNpoZTTdZVIi5tfX69pRmoMFGna',
  'saloon': 'PLy534Is5Apmt6J6Ia61liVa8_b11cC1ov',
  'old-night-drives': 'PL2n9PsUx_VHcVgOATXGVFFP9IXjYO6wMY',
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

async function main() {
  const output = {}
  for (const [vibeId, playlistId] of Object.entries(VIBE_PLAYLISTS)) {
    console.log(`\n🔍 Fetching ${vibeId} (${playlistId})...`)
    try {
      const videoIds = await fetchPlaylistItems(playlistId)
      console.log(`   Found ${videoIds.length} videos`)
      
      const durations = await fetchDurations(videoIds)
      
      const tracks = videoIds
        .filter(id => durations[id] > 0)
        .map(videoId => ({ videoId, duration: durations[videoId] }))
      
      const skipped = videoIds.length - tracks.length
      if (skipped) console.log(`   ⚠️  Skipped ${skipped} videos with 0/unknown duration`)
      
      output[vibeId] = tracks
      console.log(`   ✅ ${tracks.length} tracks cached`)
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`)
      output[vibeId] = []
    }
  }

  fs.writeFileSync(
    'src/data/trackDurations.json',
    JSON.stringify(output, null, 2)
  )
  console.log('\n💾 Written to src/data/trackDurations.json')
}

main()