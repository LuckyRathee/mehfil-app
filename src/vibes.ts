export interface Track {
  title: string
  artist: string
  src: string
}

export interface Vibe {
  id: string
  label: string
  backgroundColor: string
  colorTheme: string
  backgroundImage?: string
  tracks: Track[]
}

const vibes: Vibe[] = [
  {
    id: 'chai-sutta',
    label: 'Chai Sutta',
    backgroundColor: '#C8A887',
    colorTheme: '#7A5A3F',
    backgroundImage: '/images/chai-sutta.png',
    tracks: [
      { title: 'Smoky Chai Beats', artist: 'Delhi Dusk', src: '/audio/chai-sutta-1.mp3' },
      { title: 'Station Murmurs', artist: 'Kolkata Loops', src: '/audio/chai-sutta-2.mp3' },
      { title: 'Evening Smoke', artist: 'Bengal Dust', src: '/audio/chai-sutta-3.mp3' },
    ],
  },
  {
    id: 'weedy-valley',
    label: 'Weedy Valley',
    backgroundColor: '#1A123A',
    colorTheme: '#6EE7E6',
    backgroundImage: '/images/weedy-valley.png',
    tracks: [
      { title: 'Himalayan Drive', artist: 'Psy Lotus', src: '/audio/weedy-valley-1.mp3' },
      { title: 'Rave Fog', artist: 'Echo Nomad', src: '/audio/weedy-valley-2.mp3' },
      { title: 'Moonlit Ascent', artist: 'Valley Pulse', src: '/audio/weedy-valley-3.mp3' },
    ],
  },
  {
    id: 'panwadi',
    label: 'Panwadi',
    backgroundColor: '#611A1A',
    colorTheme: '#F97316',
    backgroundImage: '/images/panwadi.png',
    tracks: [
      { title: '90s Paan Talk', artist: 'Mumbai Nights', src: '/audio/panwadi-1.mp3' },
      { title: 'Tinted Glass', artist: 'Retro Sahib', src: '/audio/panwadi-2.mp3' },
      { title: 'Late-Night Chaar', artist: 'Bollywood Afterglow', src: '/audio/panwadi-3.mp3' },
    ],
  },
]

export default vibes
