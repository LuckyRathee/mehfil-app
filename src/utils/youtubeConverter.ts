/**
 * Converts YouTube URLs to playable audio stream URLs
 * Uses local backend endpoint (/api/youtube-audio) with ytdl-core for audio extraction
 */

export function extractYoutubeVideoId(url: string): string | null {
  const regexPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
  ]

  for (const regex of regexPatterns) {
    const match = url.match(regex)
    if (match) {
      return match[1]
    }
  }

  return null
}

export function isYoutubeUrl(url: string): boolean {
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('youtube-nocookie.com')
  )
}

interface YoutubeAudioResponse {
  url: string
  title: string
  duration: number
  thumbnail?: string
  error?: string
  details?: string
}

/**
 * Fetches the direct audio stream URL from our backend API
 * The backend uses ytdl-core to extract the best quality audio-only stream
 */
export async function getYoutubeAudioStream(youtubeUrl: string): Promise<string> {
  const videoId = extractYoutubeVideoId(youtubeUrl)

  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  try {
    console.log('Requesting audio from backend for:', youtubeUrl)
    
    const encodedUrl = encodeURIComponent(youtubeUrl)
    const apiUrl = `/api/youtube-audio?url=${encodedUrl}`
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API error: ${response.status}`)
    }
    
    const data: YoutubeAudioResponse = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    console.log('Got audio stream:', data.title, data.url)
    return data.url
  } catch (error) {
    console.error('Error fetching YouTube audio stream:', error)
    throw new Error(error instanceof Error ? error.message : 'Could not fetch audio stream')
  }
}
