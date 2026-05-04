import { classifyGenre, GENRE_COLORS, resolveArtistColor } from '../graph/genre-colors'

describe('classifyGenre', () => {
  const cases: Array<[string, string]> = [
    ['indie rock', 'rock'],
    ['alternative rock', 'rock'],
    ['punk', 'rock'],
    ['pop', 'pop'],
    ['dance pop', 'pop'],
    ['hip hop', 'hip-hop'],
    ['trap', 'hip-hop'],
    ['rap', 'hip-hop'],
    ['techno', 'electronic'],
    ['deep house', 'electronic'],
    ['ambient', 'electronic'],
    ['jazz', 'jazz'],
    ['bebop', 'jazz'],
    ['blues', 'jazz'],
    ['classical', 'classical'],
    ['baroque', 'classical'],
    ['death metal', 'metal'],
    ['black metal', 'metal'],
    ['folk', 'folk'],
    ['singer-songwriter', 'folk'],
    ['country', 'folk'],
    ['r&b', 'r&b'],
    ['neo soul', 'r&b'],
    ['funk', 'r&b'],
    ['xyzzy obscure genre', 'other'],
  ]

  it.each(cases)('classifies "%s" as %s', (genre, expected) => {
    expect(classifyGenre(genre)).toBe(expected)
  })

  it('is case-insensitive', () => {
    expect(classifyGenre('INDIE ROCK')).toBe('rock')
    expect(classifyGenre('Hip Hop')).toBe('hip-hop')
  })

  // Metal keywords are checked before rock to avoid "death rock" → rock
  it('classifies metal before rock', () => {
    expect(classifyGenre('metal')).toBe('metal')
  })
})

describe('GENRE_COLORS', () => {
  it('has a hex color for every bucket', () => {
    for (const color of Object.values(GENRE_COLORS)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})

describe('resolveArtistColor', () => {
  it('returns the color for the first recognisable genre', () => {
    const color = resolveArtistColor(['indie rock', 'alternative'])
    expect(color).toBe(GENRE_COLORS.rock)
  })

  it('returns a popularity-based colour for an empty genres array', () => {
    // popularity defaults to 50 → hue = round(50/100 * 300) = 150
    expect(resolveArtistColor([])).toBe('hsl(150, 100%, 65%)')
  })

  it('returns a popularity-based colour when no genre matches', () => {
    expect(resolveArtistColor(['xyzzy', 'zzz'])).toBe('hsl(150, 100%, 65%)')
  })

  it('skips unrecognised genres and finds the first match', () => {
    const color = resolveArtistColor(['zzz unknown', 'jazz'])
    expect(color).toBe(GENRE_COLORS.jazz)
  })
})
