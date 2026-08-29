import type { Vibe } from './types'
import { playlistIds } from './playlistIds'

export const VIBE_LOGO_PLACEHOLDER = '/images/vibe-placeholder.svg'

export const chaiSuttaVibe: Vibe = {
  id: 'chai-sutta',
  label: 'Chai Sutta',
  backgroundColor: '#C8A887',
  colorTheme: '#7A5A3F',
  logo: VIBE_LOGO_PLACEHOLDER,
  backgroundImage: '/images/chai-sutta.png',
  playlistId: playlistIds['chai-sutta'],
  tracks: [
    { title: 'Smoky Chai Beats', artist: 'Delhi Dusk', src: '/audio/chai-sutta-1.mp3' },
    { title: 'Station Murmurs', artist: 'Kolkata Loops', src: '/audio/chai-sutta-2.mp3' },
    { title: 'Evening Smoke', artist: 'Bengal Dust', src: '/audio/chai-sutta-3.mp3' },
    { title: 'Lo-fi Radio', artist: 'YouTube Music', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
  ],
}

export default chaiSuttaVibe
