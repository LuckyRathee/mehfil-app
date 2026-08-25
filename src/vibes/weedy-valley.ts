import type { Vibe } from './types'
import { playlistIds } from './playlistIds'

export const weedyValleyVibe: Vibe = {
  id: 'weedy-valley',
  label: 'Weedy Valley',
  backgroundColor: '#1A123A',
  colorTheme: '#6EE7E6',
  logo: '/images/vibe-placeholder.svg',
  backgroundImage: '/images/weedy-valley.png',
  playlistId: playlistIds['weedy-valley'],
  tracks: [
    { title: 'Himalayan Drive', artist: 'Psy Lotus', src: '/audio/weedy-valley-1.mp3' },
    { title: 'Rave Fog', artist: 'Echo Nomad', src: '/audio/weedy-valley-2.mp3' },
    { title: 'Moonlit Ascent', artist: 'Valley Pulse', src: '/audio/weedy-valley-3.mp3' },
  ],
}

export default weedyValleyVibe
