import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import http from 'http'

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Try multiple YouTube audio extraction services
function tryAudioServices(videoId: string, onSuccess: (url: string) => void, onError: (error: string) => void) {
  const services = [
    // Service 1: Direct proxy using invidious API
    () => {
      const apiUrl = `https://invidious.io/api/v1/videos/${videoId}?fields=formatStreams`
      console.log('[YouTube] Trying invidious API...')
      
      https.get(apiUrl, { timeout: 10000 }, (apiRes) => {
        let data = ''
        apiRes.on('data', (chunk) => { data += chunk })
        apiRes.on('end', () => {
          try {
            const jsonData = JSON.parse(data)
            // Invidious doesn't return audio-only in format streams typically
            // Let's try another service
            tryNextService()
          } catch (e) {
            tryNextService()
          }
        })
      }).on('error', () => tryNextService())
    },
    
    // Service 2: Use a custom CORS proxy with YouTube
    () => {
      console.log('[YouTube] Trying direct YouTube proxy...')
      // This is a fallback that just returns the YouTube watch URL
      // The browser will handle it
      onSuccess(`https://www.youtube.com/watch?v=${videoId}`)
    },

    // Service 3: Try cobalt-api
    () => {
      const apiUrl = `https://api.cobalt.tools/api/json`
      console.log('[YouTube] Trying cobalt API...')
      
      const postData = JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}` })
      
      const options = {
        hostname: 'api.cobalt.tools',
        port: 443,
        path: '/api/json',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 10000,
      }
      
      const req = https.request(options, (apiRes) => {
        let responseData = ''
        apiRes.on('data', (chunk) => { responseData += chunk })
        apiRes.on('end', () => {
          try {
            const jsonData = JSON.parse(responseData)
            if (jsonData.url) {
              onSuccess(jsonData.url)
            } else {
              tryNextService()
            }
          } catch (e) {
            tryNextService()
          }
        })
      })
      
      req.on('error', () => tryNextService())
      req.on('timeout', () => {
        req.destroy()
        tryNextService()
      })
      
      req.write(postData)
      req.end()
    },
  ]

  let currentService = 0
  const tryNextService = () => {
    currentService++
    if (currentService < services.length) {
      try {
        services[currentService]()
      } catch (e) {
        tryNextService()
      }
    } else {
      onError('All audio services failed')
    }
  }

  // Start with first service
  try {
    services[currentService]()
  } catch (e) {
    tryNextService()
  }
}

// Create a middleware for YouTube audio extraction
const youtubeMiddleware = (): Plugin => {
  return {
    name: 'youtube-audio-middleware',
    apply: 'serve',
    configureServer(server) {
      // Add middleware directly
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/youtube-audio')) {
          console.log('[YouTube Middleware] Request received:', req.url)
          
          const videoUrl = req.url.split('?url=')[1]
          if (!videoUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Missing URL parameter' }))
            return
          }

          const decodedUrl = decodeURIComponent(videoUrl)
          const videoId = extractVideoId(decodedUrl)
          
          if (!videoId) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid YouTube URL' }))
            return
          }
          
          console.log('[YouTube Middleware] Video ID:', videoId)

          // Try audio extraction services
          tryAudioServices(
            videoId,
            (audioUrl) => {
              console.log('[YouTube Middleware] Got audio URL:', audioUrl.substring(0, 100))
              
              // For direct YouTube URLs, just redirect
              if (audioUrl.includes('youtube.com')) {
                res.writeHead(302, {
                  'Location': audioUrl,
                  'Access-Control-Allow-Origin': '*',
                })
                res.end()
                return
              }
              
              // For actual audio streams, proxy them
              const isHttps = audioUrl.startsWith('https')
              const client = isHttps ? https : http
              
              const audioRequest = client.get(audioUrl, { timeout: 60000 }, (audioRes) => {
                res.writeHead(200, {
                  'Content-Type': 'audio/mpeg',
                  'Access-Control-Allow-Origin': '*',
                  'Cache-Control': 'public, max-age=3600',
                })
                audioRes.pipe(res)
              })
              
              audioRequest.on('error', (err) => {
                console.error('[YouTube Middleware] Audio stream error:', (err as any).message)
                if (!res.headersSent) {
                  res.writeHead(500)
                  res.end('Error streaming audio')
                }
              })
            },
            (error) => {
              console.error('[YouTube Middleware] Error:', error)
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error }))
            }
          )
        } else {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), youtubeMiddleware()],
})
