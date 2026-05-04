import { buildNodes, computeNodeSize } from '../graph/nodes'
import type { SpotifyArtist } from '../types/spotify'

function makeArtist(id: string, overrides: Partial<SpotifyArtist> = {}): SpotifyArtist {
  return {
    id,
    name: `Artist ${id}`,
    genres: ['indie rock'],
    images: [{ url: `https://example.com/${id}.jpg`, width: 300, height: 300 }],
    popularity: 50,
    external_urls: { spotify: `https://open.spotify.com/artist/${id}` },
    ...overrides,
  }
}

describe('computeNodeSize', () => {
  it('returns max size for rank 1', () => {
    expect(computeNodeSize(1)).toBeCloseTo(32, 0)
  })

  it('returns min size for the last rank', () => {
    expect(computeNodeSize(50)).toBeCloseTo(10, 0)
  })

  it('produces strictly decreasing sizes as rank increases', () => {
    const sizes = [1, 5, 10, 25, 50].map((r) => computeNodeSize(r))
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeLessThan(sizes[i - 1]!)
    }
  })
})

describe('buildNodes', () => {
  const artists = [makeArtist('a1'), makeArtist('a2'), makeArtist('a3')]

  it('returns one node per artist', () => {
    const nodes = buildNodes(artists, 'medium_term')
    expect(nodes).toHaveLength(3)
  })

  it('assigns rank starting from 1', () => {
    const nodes = buildNodes(artists, 'medium_term')
    expect(nodes[0]!.rank).toBe(1)
    expect(nodes[2]!.rank).toBe(3)
  })

  it('maps artist id and name correctly', () => {
    const nodes = buildNodes(artists, 'medium_term')
    expect(nodes[0]!.id).toBe('a1')
    expect(nodes[0]!.name).toBe('Artist a1')
  })

  it('assigns a color from genre', () => {
    const nodes = buildNodes(artists, 'short_term')
    // 'indie rock' → rock bucket → #FF4040
    expect(nodes[0]!.color).toBe('#FF4040')
  })

  it('uses the spotify URL from the artist', () => {
    const nodes = buildNodes(artists, 'long_term')
    expect(nodes[0]!.spotifyUrl).toBe('https://open.spotify.com/artist/a1')
  })

  it('falls back gracefully when artist has no images', () => {
    const noImage = makeArtist('x', { images: [] })
    const nodes = buildNodes([noImage], 'medium_term')
    expect(nodes[0]!.imageUrl).toBe('')
  })
})
