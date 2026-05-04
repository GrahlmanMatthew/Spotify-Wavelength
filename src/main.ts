import { loadConfig } from './config/env'
import {
  clearAuth,
  getStoredToken,
  handleAuthCallback,
  initiateAuthFlow,
  isAuthCallback,
} from './auth/spotify-auth'
import { fetchTopArtists, fetchTopTracks } from './api/spotify-client'
import { exportGraphAsPng } from './graph/export'
import { mountTooltip, renderArtistMosaic, renderTrackMosaic } from './ui/track-mosaic'
import type { SpotifyArtist, SpotifyTrack, TimeRange } from './types/spotify'

const TIME_RANGES: TimeRange[] = ['short_term', 'medium_term', 'long_term']
const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: '4 Weeks',
  medium_term: '6 Months',
  long_term: 'All Time',
}

const artistCache = new Map<TimeRange, SpotifyArtist[]>()
const trackCache = new Map<TimeRange, SpotifyTrack[]>()

let activeRange: TimeRange = 'medium_term'
let artistSvg: SVGSVGElement | null = null
let trackSvg: SVGSVGElement | null = null

async function main(): Promise<void> {
  const config = loadConfig()

  if (isAuthCallback()) {
    showStatus('Completing login…')
    await handleAuthCallback(config.spotifyClientId, config.redirectUri)
  }

  const token = getStoredToken()
  if (!token) {
    renderLanding(config.spotifyClientId, config.redirectUri)
    return
  }

  showStatus('Fetching your top artists & tracks…')
  await Promise.all(
    TIME_RANGES.map(async (range) => {
      const [artists, tracks] = await Promise.all([
        fetchTopArtists(token.accessToken, range),
        fetchTopTracks(token.accessToken, range),
      ])
      artistCache.set(range, artists)
      trackCache.set(range, tracks)
    })
  )

  hideStatus()
  renderPage()
}

function renderPage(): void {
  injectGlobalStyles()

  const app = document.getElementById('app')!
  app.innerHTML = ''
  app.style.cssText = 'min-height:100vh;background:#111213;'

  // Header
  const header = document.createElement('header')
  header.style.cssText = `
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 32px;
    background: rgba(17,18,19,0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
  `

  const title = document.createElement('div')
  title.style.cssText = `font-size:15px;font-weight:700;color:#e0e0e0;letter-spacing:-0.2px;font-family:system-ui,sans-serif`
  title.textContent = 'Wavelength'
  header.appendChild(title)

  const controls = buildRangeControls()
  header.appendChild(controls)
  app.appendChild(header)

  // Page content
  const content = document.createElement('main')
  content.style.cssText = `max-width:960px;margin:0 auto;padding:40px 32px 80px;`
  app.appendChild(content)

  const tooltip = mountTooltip(document.body).el

  const artistSection = buildSection('Your Top Artists', () => {
    if (artistSvg) exportGraphAsPng(artistSvg, 'top-artists.png')
  })
  content.appendChild(artistSection.wrapper)

  const trackSection = buildSection('Your Top Tracks', () => {
    if (trackSvg) exportGraphAsPng(trackSvg, 'top-tracks.png')
  })
  content.appendChild(trackSection.wrapper)

  function draw(range: TimeRange): void {
    const artists = artistCache.get(range) ?? []
    const tracks = trackCache.get(range) ?? []

    artistSvg = renderArtistMosaic(artistSection.container, artists, tooltip)
    trackSvg = renderTrackMosaic(trackSection.container, tracks, tooltip)

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

function buildSection(
  heading: string,
  onExport: () => void
): { wrapper: HTMLElement; container: HTMLDivElement } {
  const wrapper = document.createElement('section')
  wrapper.style.cssText = `margin-bottom:56px;`

  const sectionHeader = document.createElement('div')
  sectionHeader.style.cssText = `
    display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;
  `

  const h2 = document.createElement('h2')
  h2.style.cssText = `
    font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
    color:rgba(255,255,255,0.4);font-family:system-ui,sans-serif;
  `
  h2.textContent = heading

  const exportBtn = document.createElement('button')
  exportBtn.textContent = '↓ Export PNG'
  exportBtn.style.cssText = `
    background:transparent;border:1px solid rgba(255,255,255,0.15);
    color:rgba(255,255,255,0.5);border-radius:8px;
    padding:5px 12px;font-size:11px;cursor:pointer;font-family:system-ui,sans-serif;
  `
  exportBtn.addEventListener('click', onExport)

  sectionHeader.appendChild(h2)
  sectionHeader.appendChild(exportBtn)
  wrapper.appendChild(sectionHeader)

  const container = document.createElement('div')
  container.style.cssText = `width:100%;`
  wrapper.appendChild(container)

  return { wrapper, container }
}

function applyButtonStyle(btn: HTMLButtonElement, active: boolean): void {
  btn.style.cssText = `
    background:${active ? 'rgba(255,255,255,0.12)' : 'transparent'};
    border:1px solid ${active ? 'rgba(255,255,255,0.25)' : 'transparent'};
    color:${active ? '#fff' : 'rgba(255,255,255,0.45)'};
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
    body { background: #111213; overflow-x: hidden; }
  `
  document.head.appendChild(style)
}

function renderLanding(clientId: string, redirectUri: string): void {
  const app = document.getElementById('app')!
  app.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
      height:100vh;color:#e0e0e0;font-family:system-ui,sans-serif;text-align:center;gap:16px;background:#111213">
      <h1 style="font-size:2rem;font-weight:700;margin:0">Wavelength</h1>
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
      background:#111213;z-index:200;font-size:14px;
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
      color:#ff6b6b;font-family:system-ui,sans-serif;padding:24px;text-align:center;background:#111213">
      Something went wrong.
      <button onclick="location.reload()" style="margin-left:8px;background:none;
        border:1px solid #ff6b6b;color:#ff6b6b;padding:4px 10px;border-radius:6px;cursor:pointer">
        Retry
      </button>
    </div>
  `
  clearAuth()
})
