import { loadConfig } from './config/env'
import {
  clearAuth,
  getStoredToken,
  handleAuthCallback,
  initiateAuthFlow,
  isAuthCallback,
} from './auth/spotify-auth'
import { fetchCurrentUser, fetchTopArtists, fetchTopTracks } from './api/spotify-client'
import { mountTooltip, renderArtistMosaic, renderTrackMosaic } from './ui/track-mosaic'
import type { SpotifyArtist, SpotifyTrack, SpotifyUser, TimeRange } from './types/spotify'

const TIME_RANGES: TimeRange[] = ['short_term', 'medium_term', 'long_term']
const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: '4 Weeks',
  medium_term: '6 Months',
  long_term: 'All Time',
}
const artistCache = new Map<TimeRange, SpotifyArtist[]>()
const trackCache = new Map<TimeRange, SpotifyTrack[]>()

let activeRange: TimeRange = 'medium_term'

async function main(): Promise<void> {
  const config = loadConfig()

  if (isAuthCallback()) {
    const verifier = sessionStorage.getItem('spotify_pkce_verifier')
    if (verifier) {
      showStatus('Completing login…')
      await handleAuthCallback(config.spotifyClientId, config.redirectUri)
    } else {
      // No verifier — orphaned or shared callback URL. Strip params and show landing.
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  const token = getStoredToken()
  if (!token) {
    renderLanding(config.spotifyClientId, config.redirectUri)
    return
  }

  showStatus('Fetching your top artists & tracks…')
  const [user] = await Promise.all([
    fetchCurrentUser(token.accessToken),
    ...TIME_RANGES.map(async (range) => {
      const [artists, tracks] = await Promise.all([
        fetchTopArtists(token.accessToken, range),
        fetchTopTracks(token.accessToken, range),
      ])
      artistCache.set(range, artists)
      trackCache.set(range, tracks)
    }),
  ])

  // Build artist → album art fallback from all cached tracks
  const artistAlbumArt = new Map<string, string>()
  for (const tracks of trackCache.values()) {
    for (const track of tracks) {
      for (const artist of track.artists) {
        if (!artistAlbumArt.has(artist.id)) {
          const url = track.album.images.find((img) => !!img.url)?.url ?? ''
          if (url) artistAlbumArt.set(artist.id, url)
        }
      }
    }
  }

  hideStatus()
  renderPage(user, artistAlbumArt)
}

function renderPage(user: SpotifyUser, artistAlbumArt: Map<string, string>): void {
  injectGlobalStyles()

  const app = document.getElementById('app')!
  app.innerHTML = ''
  app.style.cssText = 'min-height:100vh;'

  // Header
  const header = document.createElement('header')
  header.id = 'app-header'
  header.style.cssText = `
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 32px;
    background: rgba(17,18,19,0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
  `

  const title = document.createElement('div')
  title.id = 'header-title'
  title.style.cssText = `display:flex;align-items:center;gap:8px;`
  title.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 18" width="48" height="18" aria-hidden="true">
      <path
        d="M 0,9 C 2.4,3 9.6,3 12,9 C 14.4,15 21.6,15 24,9 C 26.4,3 33.6,3 36,9 C 38.4,15 45.6,15 48,9"
        fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
      />
    </svg>
    <span style="font-size:15px;font-weight:700;color:#e0e0e0;letter-spacing:-0.2px;font-family:system-ui,sans-serif">Wavelength</span>
  `
  header.appendChild(title)

  // User profile — centered absolutely on desktop (via CSS), inline on mobile
  const userChip = document.createElement('div')
  userChip.id = 'user-chip'
  userChip.style.cssText = `
    display:flex; align-items:center; gap:8px;
    font-size:13px; font-weight:500; color:rgba(255,255,255,0.75);
    font-family:system-ui,sans-serif;
  `
  const photoUrl = user.images[0]?.url
  if (photoUrl) {
    const img = document.createElement('img')
    img.src = photoUrl
    img.width = 28
    img.height = 28
    img.style.cssText = `border-radius:50%;object-fit:cover;flex-shrink:0;`
    userChip.appendChild(img)
  }
  const nameEl = document.createElement('span')
  nameEl.className = 'user-name'
  nameEl.textContent = user.display_name
  userChip.appendChild(nameEl)
  header.appendChild(userChip)

  const controls = buildRangeControls()
  controls.id = 'header-controls'
  header.appendChild(controls)
  app.appendChild(header)

  // Page content
  const content = document.createElement('main')
  content.id = 'app-content'
  content.style.cssText = `max-width:960px;margin:0 auto;padding:40px 32px 80px;`
  app.appendChild(content)

  const tooltip = mountTooltip(document.body).el

  const artistSection = buildSection('Your Top Artists')
  content.appendChild(artistSection.wrapper)

  const trackSection = buildSection('Your Top Tracks')
  content.appendChild(trackSection.wrapper)

  function draw(range: TimeRange): void {
    const artists = artistCache.get(range) ?? []
    const tracks = trackCache.get(range) ?? []

    renderArtistMosaic(artistSection.container, artists, tooltip, artistAlbumArt)
    renderTrackMosaic(trackSection.container, tracks, tooltip)

    controls.querySelectorAll<HTMLButtonElement>('button[data-range]').forEach((btn) => {
      applyButtonStyle(btn, btn.dataset['range'] === range)
    })
  }

  controls.querySelectorAll<HTMLButtonElement>('button[data-range]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeRange = btn.dataset['range'] as TimeRange
      draw(activeRange)
    })
  })

  draw(activeRange)
}

function buildRangeControls(): HTMLDivElement {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    display:flex;align-items:center;gap:4px;
    background:rgba(255,255,255,0.06);
    border:1px solid rgba(255,255,255,0.1);
    border-radius:10px;padding:4px;
  `
  for (const range of TIME_RANGES) {
    const btn = document.createElement('button')
    btn.dataset['range'] = range
    btn.textContent = TIME_RANGE_LABELS[range]
    applyButtonStyle(btn, range === activeRange)
    wrapper.appendChild(btn)
  }
  return wrapper
}

function buildSection(heading: string): { wrapper: HTMLElement; container: HTMLDivElement } {
  const wrapper = document.createElement('section')
  wrapper.style.cssText = `margin-bottom:56px;`

  const h2 = document.createElement('h2')
  h2.style.cssText = `
    font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
    color:rgba(255,255,255,0.4);font-family:system-ui,sans-serif;margin-bottom:20px;
  `
  h2.textContent = heading
  wrapper.appendChild(h2)

  const container = document.createElement('div')
  container.style.cssText = `width:100%;`
  wrapper.appendChild(container)

  return { wrapper, container }
}

function applyButtonStyle(btn: HTMLButtonElement, active: boolean): void {
  btn.style.cssText = `
    background:${active ? 'rgba(29,185,84,0.15)' : 'transparent'};
    border:1px solid ${active ? 'rgba(29,185,84,0.5)' : 'transparent'};
    color:${active ? '#1DB954' : 'rgba(255,255,255,0.45)'};
    border-radius:7px;padding:5px 12px;font-size:12px;
    font-weight:${active ? '600' : '400'};
    cursor:pointer;white-space:nowrap;font-family:system-ui,sans-serif;
  `
}

function injectGlobalStyles(): void {
  if (document.getElementById('app-styles')) return
  const style = document.createElement('style')
  style.id = 'app-styles'
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #111213; }

    /* Desktop: user chip floats centered over the header */
    @media (min-width: 601px) {
      #user-chip { position: absolute; left: 50%; transform: translateX(-50%); }
    }

    /* Mobile: two-row header, tighter padding */
    @media (max-width: 600px) {
      #app-header {
        display: grid !important;
        grid-template-areas: "title user" "controls controls";
        grid-template-columns: 1fr auto;
        padding: 10px 16px !important;
        gap: 10px 8px;
      }
      #header-title   { grid-area: title; }
      #user-chip      { grid-area: user; }
      #header-controls { grid-area: controls; justify-self: center; }
      .user-name      { display: none; }
      #app-content    { padding: 24px 16px 60px !important; }
    }
  `
  document.head.appendChild(style)
}

function renderLanding(clientId: string, redirectUri: string): void {
  const app = document.getElementById('app')!
  app.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
      height:100vh;color:#e0e0e0;font-family:system-ui,sans-serif;text-align:center;gap:16px;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 24" width="96" height="24" aria-hidden="true">
          <path d="M 0,12 C 4.8,4 19.2,4 24,12 C 28.8,20 43.2,20 48,12 C 52.8,4 67.2,4 72,12 C 76.8,20 91.2,20 96,12"
            fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h1 style="font-size:2rem;font-weight:700;margin:0">Wavelength</h1>
      </div>
      <p style="color:#888;margin:0;max-width:380px;line-height:1.6">
        Explore your listening history — your top artists and tracks visualised as living mosaics.
      </p>
      <button id="connect-btn" style="
        margin-top:8px;padding:12px 28px;background:#1DB954;color:#000;border:none;
        border-radius:24px;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.3px
      ">Connect Spotify</button>
    </div>
  `
  document.getElementById('connect-btn')!.addEventListener('click', () => {
    initiateAuthFlow(clientId, redirectUri)
  })
}

function showStatus(message: string): void {
  let el = document.getElementById('status-overlay')
  if (!el) {
    el = document.createElement('div')
    el.id = 'status-overlay'
    el.style.cssText = `
      position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      color:#e0e0e0;font-family:system-ui,sans-serif;
      background:transparent;z-index:200;font-size:14px;
    `
    document.body.appendChild(el)
  }
  el.textContent = message
}

function hideStatus(): void {
  document.getElementById('status-overlay')?.remove()
}

main().catch((err: unknown) => {
  console.error(err)
  const app = document.getElementById('app')!
  app.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;
      color:#ff6b6b;font-family:system-ui,sans-serif;padding:24px;text-align:center;">
      Something went wrong.
      <button onclick="location.reload()" style="margin-left:8px;background:none;
        border:1px solid #ff6b6b;color:#ff6b6b;padding:4px 10px;border-radius:6px;cursor:pointer">
        Retry
      </button>
    </div>
  `
  clearAuth()
})
