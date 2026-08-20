import type { Vibe } from './types'
import { playlistIds } from './playlistIds'

export const oldNightDrivesVibe: Vibe = {
  id: 'old-night-drives',
  label: 'Old Night Drives',
  backgroundColor: '#0A0E1A',
  colorTheme: '#64B5F6',
  logo: '/images/vibe-placeholder.svg',
  backgroundImage: '/images/old-night-drive.png',
  // backgroundVideo: '/images/Late_night_ride.png',
  playlistId: playlistIds['old-night-drives'],
  tracks: [
    { title: 'Midnight Highway', artist: 'Retrowave Dreams', src: '/audio/old-night-drives-1.mp3' },
    { title: 'Neon Memories', artist: '80s Nights', src: '/audio/old-night-drives-2.mp3' },
    { title: 'City Lights', artist: 'Synthwave Collective', src: '/audio/old-night-drives-3.mp3' },
  ],
}

export default oldNightDrivesVibe
