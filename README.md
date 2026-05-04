# Spotify Listening Graph

[![CI](https://github.com/grahlmanmatthew/spotify-listening-history-graph/actions/workflows/ci.yml/badge.svg)](https://github.com/grahlmanmatthew/spotify-listening-history-graph/actions/workflows/ci.yml)
![GitHub release](https://img.shields.io/github/v/release/grahlmanmatthew/spotify-listening-history-graph)

> A force-directed graph of your Spotify listening history — artists as nodes, edges weighted by related-artist overlap, clusters colour-coded by genre.

<!-- Add demo GIF here before opening the final PR -->

## How it works

Your top 50 artists across three time windows (4 weeks, 6 months, all time) become nodes in a physics simulation. An edge is drawn between two artists only when Spotify's `related-artists` endpoint lists each as a relation of the other — mutual similarity, not one-directional. Edge thickness scales with how many related artists the pair shares.

Each node is your artist's Spotify profile photo, ringed in a neon halo coloured by their primary genre bucket (rock, pop, hip-hop, electronic, jazz, classical, metal, folk, R&B). The simulation runs a D3 force layout — nodes repel each other, edges act as springs pulling similar artists together — until it cools and settles. The result is a personal map of your taste: genre clusters emerge, crossover artists sit at the borders, your most-listened act dominates the centre by node size.

## Prerequisites

- Node 22+ (`node --version`)
- A [Spotify Developer app](https://developer.spotify.com/dashboard) with your redirect URIs added

## Installation and setup

```bash
git clone https://github.com/grahlmanmatthew/spotify-listening-history-graph.git
cd spotify-listening-history-graph
npm install
```

Copy the env template and fill in your Spotify Client ID:

```bash
cp .env.example .env.local
# then edit .env.local and set VITE_SPOTIFY_CLIENT_ID=<your client id>
```

## Usage

```bash
npm run dev
```

Open `http://localhost:5173`, click **Connect Spotify**, and log in. The graph will render once your top artist and related-artist data has been fetched (expect 10–20 seconds on first load).

**Controls:**
- Hover a node — tooltip with artist name, genres, and rank
- Click a node — opens the artist's Spotify page
- Drag nodes — repositions them; simulation re-settles around the new position
- Bottom bar — toggle between **4 Weeks**, **6 Months**, **All Time** views
- **↓ Export PNG** — downloads the current graph as a high-resolution PNG

## Configuration

| Variable | Required | Description |
|---|---|---|
| `VITE_SPOTIFY_CLIENT_ID` | Yes | Your Spotify app's Client ID (non-secret) |

Add `http://localhost:5173/` as a redirect URI in your Spotify Developer app settings for local dev.

For GitHub Pages, add `https://grahlmanmatthew.github.io/spotify-listening-history-graph/` as a redirect URI and set `VITE_SPOTIFY_CLIENT_ID` as a repository variable under **Settings → Secrets and variables → Variables**.

## Running the tests

```bash
npm test
```

---

© 2026 Matthew Grahlman. All rights reserved.
