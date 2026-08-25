import type { Vibe } from './types'
import { playlistIds } from './playlistIds'

export const panwadiVibe: Vibe = {
  id: 'panwadi',
  label: 'Theth Desi',
  backgroundColor: '#611A1A',
  colorTheme: '#F97316',
  logo: '/images/vibe-placeholder.svg',
  backgroundImage: '/images/theth-desi.png',
  playlistId: playlistIds['panwadi'],
  tracks: [
    { title: '90s Paan Talk', artist: 'Mumbai Nights', src: '/audio/panwadi-1.mp3' },
    { title: 'Tinted Glass', artist: 'Retro Sahib', src: '/audio/panwadi-2.mp3' },
    { title: 'Late-Night Chaar', artist: 'Bollywood Afterglow', src: '/audio/panwadi-3.mp3' },
  ],
}

export default panwadiVibe
