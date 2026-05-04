import { classifyGenre } from './genre-colors'
import type { GraphNode } from './nodes'

export interface GraphEdge {
  // D3 forceLink replaces string IDs with node references during simulation
  source: string | GraphNode
  target: string | GraphNode
  weight: number
}

const POPULARITY_THRESHOLD = 22

export function buildEdges(nodes: GraphNode[]): GraphEdge[] {
  const hasGenres = nodes.some((n) => n.genres.length > 0)
  return hasGenres ? buildGenreEdges(nodes) : buildPopularityEdges(nodes)
}

function buildGenreEdges(nodes: GraphNode[]): GraphEdge[] {
  const edges: GraphEdge[] = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!
      const b = nodes[j]!
      const aBuckets = new Set(
        a.genres.map(classifyGenre).filter((bucket) => bucket !== 'other')
      )
      const bBuckets = new Set(
        b.genres.map(classifyGenre).filter((bucket) => bucket !== 'other')
      )
      let shared = 0
      for (const bucket of aBuckets) {
        if (bBuckets.has(bucket)) shared++
      }
      if (shared > 0) edges.push({ source: a.id, target: b.id, weight: shared })
    }
  }
  return edges
}

function buildPopularityEdges(nodes: GraphNode[]): GraphEdge[] {
  const edges: GraphEdge[] = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!
      const b = nodes[j]!
      const diff = Math.abs(a.popularity - b.popularity)
      if (diff <= POPULARITY_THRESHOLD) {
        // Weight 1–5: closer popularity → heavier edge
        const weight = Math.round(((POPULARITY_THRESHOLD - diff) / POPULARITY_THRESHOLD) * 4) + 1
        edges.push({ source: a.id, target: b.id, weight })
      }
    }
  }
  return edges
}
