export type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export interface SpotifyImage {
  url: string
  width: number
  height: number
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  images: SpotifyImage[]
  popularity: number
  followers?: { total: number }
  external_urls: { spotify: string }
}

export interface TopArtistsResponse {
  items: SpotifyArtist[]
  total: number
  limit: number
  offset: number
}


export interface ArtistsResponse {
  artists: SpotifyArtist[]
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  album: {
    name: string
    images: SpotifyImage[]
  }
  popularity: number
  duration_ms: number
  external_urls: { spotify: string }
}

export interface TopTracksResponse {
  items: SpotifyTrack[]
  total: number
  limit: number
  offset: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
}

export interface SpotifyUser {
  id: string
  display_name: string
  images: SpotifyImage[]
}
