import { generateCodeChallenge, generateCodeVerifier } from '../auth/pkce'

// Node 22 has WebCrypto available globally — no polyfill needed

describe('generateCodeVerifier', () => {
  it('returns a string of expected length', () => {
    const verifier = generateCodeVerifier()
    // 96 random bytes → base64url ≈ 128 chars (no padding)
    expect(verifier.length).toBeGreaterThanOrEqual(100)
    expect(verifier.length).toBeLessThanOrEqual(150)
  })

  it('only contains URL-safe characters', () => {
    const verifier = generateCodeVerifier()
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/)
  })

  it('produces a different value each call', () => {
    const a = generateCodeVerifier()
    const b = generateCodeVerifier()
    expect(a).not.toBe(b)
  })
})

describe('generateCodeChallenge', () => {
  it('returns a non-empty base64url string', async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    expect(challenge.length).toBeGreaterThan(0)
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/)
  })

  it('returns the same challenge for the same verifier', async () => {
    const verifier = generateCodeVerifier()
    const a = await generateCodeChallenge(verifier)
    const b = await generateCodeChallenge(verifier)
    expect(a).toBe(b)
  })

  it('returns different challenges for different verifiers', async () => {
    const a = await generateCodeChallenge(generateCodeVerifier())
    const b = await generateCodeChallenge(generateCodeVerifier())
    expect(a).not.toBe(b)
  })
})
