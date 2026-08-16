/**
 * Converts YouTube URLs to playable audio stream URLs
 * Uses the Piped API (privacy-focused YouTube frontend) for audio extraction
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

/**
 * Converts a YouTube URL to a Piped API audio stream URL
 * Piped is a privacy-focused YouTube frontend that provides direct audio streams
 */
export function convertYoutubeToAudioStream(youtubeUrl: string): string {
  const videoId = extractYoutubeVideoId(youtubeUrl)

  if (!videoId) {
    console.warn('Could not extract video ID from YouTube URL:', youtubeUrl)
    return youtubeUrl
  }

  // Using Piped API instance - provides direct audio/video streams without CORS issues
  // Format: https://pipedapi.kavin.rocks/streams/{videoId}
  // This returns JSON with audio stream URLs
  return `https://piped-instances.kavin.rocks/?videoId=${videoId}`
}

/**
 * Fetches the audio stream URL from Piped API
 */
export async function getYoutubeAudioStream(youtubeUrl: string): Promise<string> {
  const videoId = extractYoutubeVideoId(youtubeUrl)

  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  try {
    // Use our local backend endpoint that handles YouTube extraction
    // This uses ytdl-core to extract the best audio quality
    console.log('Requesting audio from backend for:', youtubeUrl)
    
    const encodedUrl = encodeURIComponent(youtubeUrl)
    const audioUrl = `/api/youtube-audio?url=${encodedUrl}`
    
    console.log('Audio URL:', audioUrl)
    return audioUrl
  } catch (error) {
    console.error('Error creating audio stream URL:', error)
    throw new Error('Could not create audio stream URL')
  }
}
