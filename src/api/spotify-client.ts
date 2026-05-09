import type { ArtistsResponse, SpotifyArtist, SpotifyTrack, SpotifyUser, TimeRange, TopArtistsResponse, TopTracksResponse } from '../types/spotify'

const API_BASE = 'https://api.spotify.com/v1'

async function spotifyGet<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After') ?? '2')
    await sleep(retryAfter * 1000)
    return spotifyGet<T>(accessToken, path)
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)')
    throw new Error(`Spotify API error: ${response.status} on ${path} — ${body}`)
  }

  return response.json() as Promise<T>
}

export async function fetchTopArtists(
  accessToken: string,
  timeRange: TimeRange,
  limit = 50
): Promise<SpotifyArtist[]> {
  const params = new URLSearchParams({ time_range: timeRange, limit: String(limit) })
  const data = await spotifyGet<TopArtistsResponse>(accessToken, `/me/top/artists?${params}`)
  return data.items
}

export async function fetchTopTracks(
  accessToken: string,
  timeRange: TimeRange,
  limit = 50
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({ time_range: timeRange, limit: String(limit) })
  const data = await spotifyGet<TopTracksResponse>(accessToken, `/me/top/tracks?${params}`)
  return data.items
}

export async function fetchCurrentUser(accessToken: string): Promise<SpotifyUser> {
  return spotifyGet<SpotifyUser>(accessToken, '/me')
}

export async function fetchArtistDetails(
  accessToken: string,
  artistIds: string[]
): Promise<SpotifyArtist[]> {
  const results: SpotifyArtist[] = []
  // API allows max 50 IDs per request
  for (let i = 0; i < artistIds.length; i += 50) {
    const batch = artistIds.slice(i, i + 50)
    const data = await spotifyGet<ArtistsResponse>(
      accessToken,
      `/artists?ids=${batch.join(',')}`
    )
    results.push(...data.artists)
  }
  return results
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
