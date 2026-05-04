const API_BASE = 'https://ws.audioscrobbler.com/2.0'

export interface LastfmArtistInfo {
  listeners: number
  tags: string[]
}

interface LastfmResponse {
  artist?: {
    stats?: { listeners?: string }
    tags?: { tag?: Array<{ name: string }> }
  }
  error?: number
  message?: string
}

async function fetchArtistInfo(name: string, apiKey: string): Promise<LastfmArtistInfo | null> {
  const params = new URLSearchParams({
    method: 'artist.getInfo',
    artist: name,
    api_key: apiKey,
    format: 'json',
    autocorrect: '1',
  })

  try {
    const response = await fetch(`${API_BASE}?${params}`)
    if (!response.ok) return null
    const data = (await response.json()) as LastfmResponse
    if (data.error || !data.artist) return null

    const listeners = parseInt(data.artist.stats?.listeners ?? '0', 10)
    const tags = (data.artist.tags?.tag ?? []).map((t) => t.name.toLowerCase())
    return { listeners, tags }
  } catch {
    return null
  }
}

export async function fetchAllArtistInfo(
  names: string[],
  apiKey: string,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, LastfmArtistInfo>> {
  const result = new Map<string, LastfmArtistInfo>()
  const BATCH = 5

  for (let i = 0; i < names.length; i += BATCH) {
    const batch = names.slice(i, i + BATCH)
    const settled = await Promise.allSettled(batch.map((name) => fetchArtistInfo(name, apiKey)))

    settled.forEach((outcome, idx) => {
      if (outcome.status === 'fulfilled' && outcome.value) {
        result.set(batch[idx]!, outcome.value)
      }
    })

    onProgress?.(Math.min(i + BATCH, names.length), names.length)
  }

  return result
}