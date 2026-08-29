import type { Vibe } from './types'
import { playlistIds } from './playlistIds'

export const thethDesiVibe: Vibe = {
  id: 'theth-desi',
  label: 'Theth Desi',
  backgroundColor: '#611A1A',
  colorTheme: '#F97316',
  logo: '/images/vibe-placeholder.svg',
  backgroundImage: '/images/theth-desi.png',
  // theth-desi has multiple interleaved playlists, handled via trackDurations
  playlistId: undefined,
  tracks: [
    { title: 'Theth Vibes Mix', artist: 'Desi Radio', src: '/audio/theth-desi-mix.mp3' },
  ],
}

export default thethDesiVibe
