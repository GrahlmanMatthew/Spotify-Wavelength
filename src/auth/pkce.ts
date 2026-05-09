const CODE_VERIFIER_KEY = 'spotify_pkce_verifier'

export function generateCodeVerifier(): string {
  const array = new Uint8Array(96)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier)
}

export function retrieveCodeVerifier(): string {
  const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY)
  if (!verifier) {
    throw new Error('PKCE code verifier not found in sessionStorage. Auth flow may have been interrupted.')
  }
  return verifier
}

export function clearCodeVerifier(): void {
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
