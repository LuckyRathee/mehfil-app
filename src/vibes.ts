export interface Track {
  title: string
  artist: string
  src: string
}

// Placeholder vibe artwork. Swap this path for the real vibe logo/art
// once it is ready — the player renders whatever lives at `vibe.logo`.
export const VIBE_LOGO_PLACEHOLDER = '/images/vibe-placeholder.svg'

export interface Vibe {
  id: string
  label: string
  backgroundColor: string
  colorTheme: string
  /** Center artwork shown in the radio player (the vibe's logo/identity). */
  logo: string
  backgroundImage?: string
  backgroundVideo?: string
  playlistId?: string // <-- Added this so TypeScript stops throwing errors
  tracks: Track[]
}

const vibes: Vibe[] = [
  {
    id: 'chai-sutta',
    label: 'Chai Sutta',
    backgroundColor: '#C8A887',
    colorTheme: '#7A5A3F',
    logo: VIBE_LOGO_PLACEHOLDER,
    backgroundImage: '/images/chai-sutta.png',
    //backgroundVideo: '/images/chai-sutta.png',
    playlistId: 'PLqUiEGO2-62v2C2yCmPHdRs-z_p3j7m7M',
    tracks: [
      { title: 'Smoky Chai Beats', artist: 'Delhi Dusk', src: '/audio/chai-sutta-1.mp3' },
      { title: 'Station Murmurs', artist: 'Kolkata Loops', src: '/audio/chai-sutta-2.mp3' },
      { title: 'Evening Smoke', artist: 'Bengal Dust', src: '/audio/chai-sutta-3.mp3' },
      { title: 'Lo-fi Radio', artist: 'YouTube Music', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
    ],
  },
  {
    id: 'weedy-valley',
    label: 'Weedy Valley',
    backgroundColor: '#1A123A',
    colorTheme: '#6EE7E6',
    logo: VIBE_LOGO_PLACEHOLDER,
    backgroundImage: '/images/weedy-valley.png',
    //backgroundVideo: '/images/weedy-valley.png',
    playlistId: 'PLDPlCaMP9SofsDI4Fe1SYsOW5sLUoDxc5',
    tracks: [
      { title: 'Himalayan Drive', artist: 'Psy Lotus', src: '/audio/weedy-valley-1.mp3' },
      { title: 'Rave Fog', artist: 'Echo Nomad', src: '/audio/weedy-valley-2.mp3' },
      { title: 'Moonlit Ascent', artist: 'Valley Pulse', src: '/audio/weedy-valley-3.mp3' },
    ],
  },
  {
    id: 'theth-desi',
    label: 'Theth Desi',
    backgroundColor: '#611A1A',
    colorTheme: '#F97316',
    logo: VIBE_LOGO_PLACEHOLDER,
    backgroundImage: '/images/theth-desi.png',
    //backgroundVideo: '/videos/panwadi.mp4',
    playlistId: 'RDMASZ7glxV2w',
    tracks: [
      { title: '90s Paan Talk', artist: 'Mumbai Nights', src: '/audio/panwadi-1.mp3' },
      { title: 'Tinted Glass', artist: 'Retro Sahib', src: '/audio/panwadi-2.mp3' },
      { title: 'Late-Night Chaar', artist: 'Bollywood Afterglow', src: '/audio/panwadi-3.mp3' },
    ],
  },
  {
    id: 'bus-driver',
    label: 'Bus Driver',
    backgroundColor: '#2C1810',
    colorTheme: '#FFA726',
    logo: VIBE_LOGO_PLACEHOLDER,
    backgroundImage: '/images/bus-driver.png',
    //backgroundVideo: '/images/bus-driver.png',
    playlistId: 'PLFgquLnL59alW3xmYiWRaoz0oM3H17Lth',
    tracks: [
      { title: 'Highway Rhythm', artist: 'Road Warriors', src: '/audio/bus-driver-1.mp3' },
      { title: 'Engine Hum', artist: 'Journey Beats', src: '/audio/bus-driver-2.mp3' },
      { title: 'Sunset Route', artist: 'Travel Vibes', src: '/audio/bus-driver-3.mp3' },
    ],
  },
  {
    id: 'saloon',
    label: 'Saloon',
    backgroundColor: '#1C1C28',
    colorTheme: '#E91E63',
    logo: VIBE_LOGO_PLACEHOLDER,
    backgroundImage: '/images/saloon.png',
    //backgroundVideo: '/images/saloon.png',
    playlistId: 'PLFgquLnL59alW3xmYiWRaoz0oM3H17Lth',
    tracks: [
      { title: 'Mirror Talk', artist: 'Style Sessions', src: '/audio/saloon-1.mp3' },
      { title: 'Clipper Beats', artist: 'Barber Shop Groove', src: '/audio/saloon-2.mp3' },
      { title: 'Fresh Fade', artist: 'Urban Cuts', src: '/audio/saloon-3.mp3' },
    ],
  },
  {
    id: 'old-night-drives',
    label: 'Old Night Drives',
    backgroundColor: '#0A0E1A',
    colorTheme: '#64B5F6',
    logo: VIBE_LOGO_PLACEHOLDER,
    backgroundImage: '/images/old-night-drive.png',
    //backgroundVideo: '/images/Late_night_ride.png',
    playlistId: 'PLFgquLnL59alW3xmYiWRaoz0oM3H17Lth',
    tracks: [
      { title: 'Midnight Highway', artist: 'Retrowave Dreams', src: '/audio/old-night-drives-1.mp3' },
      { title: 'Neon Memories', artist: '80s Nights', src: '/audio/old-night-drives-2.mp3' },
      { title: 'City Lights', artist: 'Synthwave Collective', src: '/audio/old-night-drives-3.mp3' },
    ],
  },
]

export default vibes