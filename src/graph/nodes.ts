import type { SpotifyArtist, TimeRange } from '../types/spotify'
import { resolveArtistColor } from './genre-colors'

export interface GraphNode {
  id: string
  name: string
  genres: string[]
  imageUrl: string
  spotifyUrl: string
  rank: number
  popularity: number
  timeRange: TimeRange
  size: number
  color: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

const MIN_SIZE_PX = 10
const MAX_SIZE_PX = 32

export function computeNodeSize(rank: number, total = 50): number {
  // Log scale: rank 1 → MAX_SIZE_PX, rank `total` → MIN_SIZE_PX
  const t = Math.log(rank) / Math.log(total)
  return MAX_SIZE_PX - t * (MAX_SIZE_PX - MIN_SIZE_PX)
}

export function buildNodes(artists: SpotifyArtist[], timeRange: TimeRange): GraphNode[] {
  return artists.map((artist, index) => {
    const rank = index + 1
    const image = artist.images.find((img) => img.width >= 64) ?? artist.images[0]

    const genres = artist.genres ?? []
    return {
      id: artist.id,
      name: artist.name,
      genres,
      imageUrl: image?.url ?? '',
      spotifyUrl: artist.external_urls.spotify,
      rank,
      popularity: artist.popularity ?? 0,
      timeRange,
      size: computeNodeSize(rank, artists.length),
      color: resolveArtistColor(genres, artist.popularity ?? 50),
    }
  })
}
