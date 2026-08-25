import type { Vibe } from './types'
import { playlistIds } from './playlistIds'

export const saloonVibe: Vibe = {
  id: 'saloon',
  label: 'Saloon',
  backgroundColor: '#1C1C28',
  colorTheme: '#E91E63',
  logo: '/images/vibe-placeholder.svg',
  backgroundImage: '/images/saloon.png',
  playlistId: playlistIds['saloon'],
  tracks: [
    { title: 'Mirror Talk', artist: 'Style Sessions', src: '/audio/saloon-1.mp3' },
    { title: 'Clipper Beats', artist: 'Barber Shop Groove', src: '/audio/saloon-2.mp3' },
    { title: 'Fresh Fade', artist: 'Urban Cuts', src: '/audio/saloon-3.mp3' },
  ],
}

export default saloonVibe
