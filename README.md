# Wavelength

Visualise your Spotify listening history as interactive bubble mosaics. Connect your Spotify account to see your top artists and tracks arranged by how much you play them — the bigger the bubble, the more you listen.

## Features

- **Top artists & tracks** across three time ranges: Last 4 Weeks, Last 6 Months, All Time
- **Circle-pack mosaic** — bubble size reflects your listening rank
- **Rank badges** on your top 10 artists and tracks
- **Hover / tap tooltips** with track duration, album name, and artist rank context
- **Mobile-friendly** — responsive layout, touch tooltips, no horizontal scroll
- Fully client-side — no backend, no data stored anywhere

## Setup

### Prerequisites

- Node.js 18+ and npm
- A [Spotify Developer](https://developer.spotify.com/dashboard) account

### 1. Create a Spotify app

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new app
2. Under **Redirect URIs**, add `http://127.0.0.1:5173/` (for local dev)
3. Copy your **Client ID**

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_REDIRECT_URI=http://127.0.0.1:5173/
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173` and connect your Spotify account.

## Deployment (GitHub Pages)

1. Add `https://GrahlmanMatthew.github.io/Spotify-Wavelength/` to your Spotify app's Redirect URIs
2. In your GitHub repo go to **Settings → Secrets and variables → Actions** and add:
   - `VITE_SPOTIFY_CLIENT_ID` — your Spotify Client ID
   - `VITE_REDIRECT_URI` — `https://GrahlmanMatthew.github.io/Spotify-Wavelength/`
3. Push to `main` — the GitHub Actions workflow builds and deploys automatically

## Tech

- [Vite](https://vitejs.dev/) + TypeScript
- [D3.js](https://d3js.org/) — circle-pack layout and SVG rendering
- Spotify Web API — PKCE OAuth (no backend required)
