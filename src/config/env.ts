export interface AppConfig {
  spotifyClientId: string
  redirectUri: string
  lastfmApiKey: string
}

export function loadConfig(): AppConfig {
  const spotifyClientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined
  const redirectUri = import.meta.env.VITE_REDIRECT_URI as string | undefined
  const lastfmApiKey = (import.meta.env.VITE_LASTFM_API_KEY as string | undefined) ?? ''

  if (!spotifyClientId) {
    throw new Error(
      'VITE_SPOTIFY_CLIENT_ID is not set. Copy .env.example to .env.local and fill in your Spotify client ID.'
    )
  }

  if (!redirectUri) {
    throw new Error(
      'VITE_REDIRECT_URI is not set. Copy .env.example to .env.local and fill in your redirect URI.'
    )
  }

  return { spotifyClientId, redirectUri, lastfmApiKey }
}
