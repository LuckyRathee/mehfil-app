import type { Vibe } from './types'
import { playlistIds } from './playlistIds'

export const busDriverVibe: Vibe = {
  id: 'bus-driver',
  label: 'Bus Driver',
  backgroundColor: '#2C1810',
  colorTheme: '#FFA726',
  logo: '/images/vibe-placeholder.svg',
  backgroundImage: '/images/bus-driver.png',
  playlistId: playlistIds['bus-driver'],
  tracks: [
    { title: 'Highway Rhythm', artist: 'Road Warriors', src: '/audio/bus-driver-1.mp3' },
    { title: 'Engine Hum', artist: 'Journey Beats', src: '/audio/bus-driver-2.mp3' },
    { title: 'Sunset Route', artist: 'Travel Vibes', src: '/audio/bus-driver-3.mp3' },
  ],
}

export default busDriverVibe
