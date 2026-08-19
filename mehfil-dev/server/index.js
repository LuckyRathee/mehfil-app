import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/api/youtube-audio', async (req, res) => {
  const videoUrl = req.query.url;
  
  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : videoUrl;
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`[YouTube API] Fetching via Cobalt API for: ${cleanUrl}`);

    // Cobalt API is currently the most reliable scraper
    const response = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: cleanUrl,
        isAudioOnly: true
      })
    });

    if (!response.ok) {
      throw new Error(`Cobalt API failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'error' || !data.url) {
      return res.status(404).json({ error: 'Failed to extract audio URL from Cobalt' });
    }

    console.log(`[YouTube API] Success! Extracted audio stream.`);

    res.json({
      url: data.url,
      title: "YouTube Audio Stream", // Cobalt doesn't always return metadata
      duration: 0,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    });

  } catch (error) {
    console.error('[YouTube API] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch audio stream: ' + error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Mehfil Backend API running at http://localhost:${PORT}`);
});