import { fetchTopArtists, fetchTopTracks } from '../api/spotify-client'
import type { SpotifyArtist, SpotifyTrack } from '../types/spotify'

const TOKEN = 'test-token'

function mockFetch(body: unknown, status = 200): void {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response)
}

const ARTIST_STUB: SpotifyArtist = {
  id: 'abc123',
  name: 'Test Artist',
  genres: ['rock'],
  images: [{ url: 'https://example.com/img.jpg', width: 300, height: 300 }],
  popularity: 72,
  external_urls: { spotify: 'https://open.spotify.com/artist/abc123' },
}

const TRACK_STUB: SpotifyTrack = {
  id: 'trk456',
  name: 'Test Track',
  artists: [{ id: 'abc123', name: 'Test Artist' }],
  album: {
    name: 'Test Album',
    images: [{ url: 'https://example.com/album.jpg', width: 300, height: 300 }],
  },
  popularity: 58,
  duration_ms: 210000,
  external_urls: { spotify: 'https://open.spotify.com/track/trk456' },
}

describe('fetchTopArtists', () => {
  it('returns the items array from the API response', async () => {
    mockFetch({ items: [ARTIST_STUB], total: 1, limit: 50, offset: 0 })
    const result = await fetchTopArtists(TOKEN, 'medium_term')
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('abc123')
  })

  it('preserves the popularity field from the API response', async () => {
    mockFetch({ items: [ARTIST_STUB], total: 1, limit: 50, offset: 0 })
    const result = await fetchTopArtists(TOKEN, 'medium_term')
    expect(result[0]!.popularity).toBe(72)
  })

  it('throws on non-ok responses', async () => {
    mockFetch({ error: { status: 403, message: 'Forbidden' } }, 403)
    await expect(fetchTopArtists(TOKEN, 'short_term')).rejects.toThrow('403')
  })
})

describe('fetchTopTracks', () => {
  it('returns the items array from the API response', async () => {
    mockFetch({ items: [TRACK_STUB], total: 1, limit: 50, offset: 0 })
    const result = await fetchTopTracks(TOKEN, 'medium_term')
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('trk456')
  })

  it('preserves the duration_ms field from the API response', async () => {
    mockFetch({ items: [TRACK_STUB], total: 1, limit: 50, offset: 0 })
    const result = await fetchTopTracks(TOKEN, 'medium_term')
    expect(result[0]!.duration_ms).toBe(210000)
  })

  it('preserves album images', async () => {
    mockFetch({ items: [TRACK_STUB], total: 1, limit: 50, offset: 0 })
    const result = await fetchTopTracks(TOKEN, 'medium_term')
    expect(result[0]!.album.images[0]!.url).toBe('https://example.com/album.jpg')
  })

  it('throws on non-ok responses', async () => {
    mockFetch({ error: { status: 401, message: 'Unauthorized' } }, 401)
    await expect(fetchTopTracks(TOKEN, 'long_term')).rejects.toThrow('401')
  })
})
