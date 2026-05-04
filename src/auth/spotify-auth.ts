import type { TokenResponse } from '../types/spotify'
import {
  clearCodeVerifier,
  generateCodeChallenge,
  generateCodeVerifier,
  retrieveCodeVerifier,
  storeCodeVerifier,
} from './pkce'

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const TOKEN_KEY = 'spotify_token_set'
const SCOPES = 'user-top-read user-read-private'

export interface TokenSet {
  accessToken: string
  expiresAt: number
  scope: string
}

export async function initiateAuthFlow(clientId: string, redirectUri: string): Promise<never> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  storeCodeVerifier(verifier)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  const url = `${SPOTIFY_AUTH_URL}?${params.toString()}`
  console.log('[spotify-auth] redirect_uri being sent:', redirectUri)
  console.log('[spotify-auth] full auth URL:', url)
  window.location.href = url
  throw new Error('unreachable')
}

export async function handleAuthCallback(clientId: string, redirectUri: string): Promise<TokenSet> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const error = params.get('error')

  if (error) {
    throw new Error(`Spotify auth error: ${error}`)
  }
  if (!code) {
    throw new Error('No auth code found in callback URL.')
  }

  const verifier = retrieveCodeVerifier()

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  })

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token exchange failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as TokenResponse
  clearCodeVerifier()

  const tokenSet: TokenSet = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  }

  storeToken(tokenSet)

  // Clean the ?code= param from the URL without triggering a reload
  const cleanUrl = window.location.pathname + window.location.hash
  window.history.replaceState({}, '', cleanUrl)

  return tokenSet
}

export function getStoredToken(): TokenSet | null {
  const raw = sessionStorage.getItem(TOKEN_KEY)
  if (!raw) return null

  const token = JSON.parse(raw) as TokenSet
  if (Date.now() >= token.expiresAt) {
    sessionStorage.removeItem(TOKEN_KEY)
    return null
  }

  return token
}

export function storeToken(token: TokenSet): void {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token))
}

export function clearAuth(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  clearCodeVerifier()
}

export function isAuthCallback(): boolean {
  return new URLSearchParams(window.location.search).has('code')
}
