export const playlistIds = {
  'chai-sutta': 'PLo7WLtfSrhdbdR4K_EQzplNiDYZMFk8jQ',
  'weedy-valley': 'PLCCTHlcjByiLW1E5cG9m_9WGnuXkhmfWj',
  'panwadi': 'PL4zY2tyCYAI0UMnMRD_Tx1LW6fX1RDkB9',
  'bus-driver': 'PL0umg_TNpoZTTdZVIi5tfX69pRmoMFGna',
  'saloon': 'PLy534Is5Apmt6J6Ia61liVa8_b11cC1ov',
  'old-night-drives': 'PLHpUqbmxs4E0',
} as const

export type VibeId = keyof typeof playlistIds