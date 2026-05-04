export type GenreBucket =
  | 'rock'
  | 'pop'
  | 'hip-hop'
  | 'electronic'
  | 'jazz'
  | 'classical'
  | 'metal'
  | 'folk'
  | 'r&b'
  | 'other'

export const GENRE_COLORS: Record<GenreBucket, string> = {
  rock: '#FF4040',
  pop: '#FF69E0',
  'hip-hop': '#FFD700',
  electronic: '#00F5FF',
  jazz: '#FF8C00',
  classical: '#C8A2FF',
  metal: '#A8FF40',
  folk: '#FFB347',
  'r&b': '#FF3FA4',
  other: '#8888AA',
}

const GENRE_KEYWORDS: Array<[GenreBucket, string[]]> = [
  ['metal', ['metal', 'hardcore', 'death metal', 'black metal', 'doom']],
  ['rock', ['rock', 'punk', 'grunge', 'alternative', 'indie rock', 'post-rock']],
  ['hip-hop', ['hip hop', 'hip-hop', 'rap', 'trap', 'drill', 'grime']],
  ['electronic', ['electronic', 'edm', 'techno', 'house', 'trance', 'ambient', 'dubstep', 'drum and bass', 'dnb']],
  ['jazz', ['jazz', 'bebop', 'swing', 'blues']],
  ['classical', ['classical', 'baroque', 'opera', 'orchestral', 'chamber', 'symphony']],
  ['folk', ['folk', 'country', 'bluegrass', 'acoustic', 'singer-songwriter']],
  ['r&b', ['r&b', 'soul', 'gospel', 'funk', 'neo soul']],
  ['pop', ['pop', 'synth-pop', 'dance pop']],
]

export function classifyGenre(genre: string): GenreBucket {
  const lower = genre.toLowerCase()
  for (const [bucket, keywords] of GENRE_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return bucket
    }
  }
  return 'other'
}

export function resolveArtistColor(genres: string[] | null | undefined, popularity = 50): string {
  for (const genre of genres ?? []) {
    const bucket = classifyGenre(genre)
    if (bucket !== 'other') {
      return GENRE_COLORS[bucket]
    }
  }
  // No genre data — derive a neon colour from popularity so nodes are visually distinct
  const hue = Math.round((popularity / 100) * 300)
  return `hsl(${hue}, 100%, 65%)`
}
