export interface Track {
  title: string
  artist: string
  src: string
}

export interface TrackInfo {
  videoId: string
  duration: number // seconds
}

export interface Vibe {
  id: string
  label: string
  backgroundColor: string
  colorTheme: string
  /** Center artwork shown in the radio player (the vibe's logo/identity). */
  logo: string
  backgroundImage?: string
  playlistId?: string
  tracks: Track[]
}

export interface PlaybackPosition {
  trackIndex: number
  offsetSeconds: number
  isStaticWindow: boolean
}
