import { buildEdges } from '../graph/edges'
import type { GraphNode } from '../graph/nodes'

function makeNode(id: string, genres: string[], popularity = 50): GraphNode {
  return {
    id,
    name: `Artist ${id}`,
    genres,
    imageUrl: '',
    spotifyUrl: '',
    rank: 1,
    popularity,
    timeRange: 'medium_term',
    size: 20,
    color: '#ffffff',
  }
}

describe('buildEdges', () => {
  it('returns no edges when no nodes share genres', () => {
    const nodes = [makeNode('a', ['jazz']), makeNode('b', ['metal'])]
    expect(buildEdges(nodes)).toHaveLength(0)
  })

  it('creates an edge between two nodes that share a genre', () => {
    const nodes = [makeNode('a', ['indie rock']), makeNode('b', ['indie rock'])]
    const edges = buildEdges(nodes)
    expect(edges).toHaveLength(1)
    expect(edges[0]!.source).toBe('a')
    expect(edges[0]!.target).toBe('b')
  })

  it('sets weight to the number of shared genre buckets', () => {
    // 'pop' and 'dance pop' both → pop bucket (deduplicated to 1)
    // 'rock' and 'indie rock' both → rock bucket (deduplicated to 1)
    // shared buckets between a and b = {pop, rock} → weight 2
    const nodes = [
      makeNode('a', ['pop', 'rock']),
      makeNode('b', ['dance pop', 'indie rock']),
    ]
    const edges = buildEdges(nodes)
    expect(edges[0]!.weight).toBe(2)
  })

  it('does not create duplicate edges', () => {
    const nodes = [makeNode('a', ['pop']), makeNode('b', ['pop'])]
    const edges = buildEdges(nodes)
    expect(edges).toHaveLength(1)
  })

  it('returns no edges for an empty node list', () => {
    expect(buildEdges([])).toHaveLength(0)
  })

  it('returns no edges for a single node', () => {
    expect(buildEdges([makeNode('a', ['pop'])])).toHaveLength(0)
  })

  it('connects all nodes that share at least one genre in a group', () => {
    const nodes = [
      makeNode('a', ['rock']),
      makeNode('b', ['rock']),
      makeNode('c', ['rock']),
    ]
    // 3 nodes all sharing 'rock' → 3 edges: a-b, a-c, b-c
    expect(buildEdges(nodes)).toHaveLength(3)
  })
})
