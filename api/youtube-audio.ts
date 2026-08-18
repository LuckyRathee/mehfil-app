import { ytdl } from '@distube/ytdl-core';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const videoUrl = url.searchParams.get('url');

  if (!videoUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Extract video ID to use clean URL
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    const cleanUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : videoUrl;
    
    console.log('[YouTube API] Original URL:', videoUrl);
    console.log('[YouTube API] Clean URL:', cleanUrl);

    // Validate YouTube URL
    if (!ytdl.validateURL(cleanUrl)) {
      return new Response(JSON.stringify({ error: 'Invalid YouTube URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get video info to find best audio format
    const info = await ytdl.getInfo(cleanUrl);
    console.log('[YouTube API] Video title:', info.videoDetails.title);
    console.log('[YouTube API] Available formats:', info.formats.length);
    
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    console.log('[YouTube API] Audio-only formats:', audioFormats.length);
    
    // Sort by quality (bitrate) descending
    audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
    
    if (audioFormats.length > 0) {
      console.log('[YouTube API] Best audio format:', {
        itag: audioFormats[0].itag,
        bitrate: audioFormats[0].audioBitrate,
        container: audioFormats[0].container,
        urlLength: audioFormats[0].url?.length,
        urlPreview: audioFormats[0].url?.substring(0, 100)
      });
    }
    
    const bestAudio = audioFormats[0];
    
    if (!bestAudio?.url) {
      return new Response(JSON.stringify({ error: 'No audio stream found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return the direct audio stream URL
    return new Response(JSON.stringify({ 
      url: bestAudio.url,
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails[0]?.url,
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[YouTube API] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to extract audio stream',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}