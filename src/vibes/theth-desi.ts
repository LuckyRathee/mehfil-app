import type { Vibe } from './types'
import { playlistIds } from './playlistIds'

export const VIBE_LOGO_PLACEHOLDER = '/images/vibe-placeholder.svg'

export const thethDesiVibe: Vibe = {
  id: 'theth-desi',
  label: 'Theth Desi',
  backgroundColor: '#D4A574',
  colorTheme: '#8B6F47',
  logo: VIBE_LOGO_PLACEHOLDER,
  backgroundImage: '/images/theth-desi.png',
  // Note: theth-desi has multiple playlists (interleaved), handled via trackDurations
  // playlistId is not used - individual tracks are loaded from videoIds
  playlistId: undefined,
  tracks: [
    { title: 'Theth Vibes Mix', artist: 'Desi Radio', src: '/audio/theth-desi-mix.mp3' },
  ],
}

export default thethDesiVibe
