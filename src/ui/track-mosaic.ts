import * as d3 from 'd3'
import type { SpotifyArtist, SpotifyTrack } from '../types/spotify'

interface PackItem {
  id: string
  rank: number
  imageUrl: string
  label: string
  sublabel: string
  spotifyUrl: string
  itemType: 'artist' | 'track'
  album?: string
  duration?: number
}

interface TooltipState {
  el: HTMLDivElement
}

function mountTooltip(container: HTMLElement): TooltipState {
  const el = document.createElement('div')
  el.style.cssText = `
    position: fixed;
    background: rgba(15,15,20,0.92);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 8px 12px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.12s ease;
    z-index: 200;
    max-width: 220px;
  `
  container.appendChild(el)
  return { el }
}

function renderCirclePack(
  container: HTMLElement,
  items: PackItem[],
  tooltip: HTMLDivElement,
  clipPrefix: string
): SVGSVGElement {
  container.innerHTML = ''

  const size = Math.min((container.clientWidth || 800) * 1.2, Math.floor(window.innerHeight * 0.82 * 1.2))

  const root = d3
    .hierarchy<{ children?: PackItem[] } | PackItem>({ children: items })
    .sum((d) => ('rank' in d ? Math.max(1, 51 - (d as PackItem).rank) : 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  d3.pack<{ children?: PackItem[] } | PackItem>()
    .size([size, size])
    .padding(3)(root)

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', size)
    .attr('height', size)
    .style('background', 'transparent')
    .style('display', 'block')
    .style('margin', '0 auto')

  const defs = svg.append('defs')
  const leaves = root.leaves() as d3.HierarchyCircularNode<PackItem>[]

  leaves.forEach((leaf) => {
    defs
      .append('clipPath')
      .attr('id', `${clipPrefix}-${leaf.data.id}`)
      .append('circle')
      .attr('r', leaf.r)
  })

  const groups = svg
    .selectAll<SVGGElement, d3.HierarchyCircularNode<PackItem>>('g.pack-item')
    .data(leaves)
    .enter()
    .append('g')
    .attr('class', 'pack-item')
    .attr('transform', (d) => `translate(${d.x},${d.y})`)
    .style('cursor', 'default')
    .on('mousemove', (event: MouseEvent, d) => {
      const rankLabel =
        d.data.itemType === 'artist'
          ? d.data.rank === 1
            ? 'Your most played artist'
            : d.data.rank <= 10
              ? `Your #${d.data.rank} most played artist`
              : `#${d.data.rank} in your top artists`
          : null

      const durationLabel =
        d.data.duration != null
          ? `${Math.floor(d.data.duration / 60000)}:${String(Math.floor((d.data.duration % 60000) / 1000)).padStart(2, '0')}`
          : null

      tooltip.innerHTML = `
        <div style="font-size:12px;font-weight:700;color:#fff;line-height:1.3">${d.data.label}</div>
        ${d.data.sublabel ? `<div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:3px">${d.data.sublabel}</div>` : ''}
        ${d.data.album ? `<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px">${d.data.album}${durationLabel ? ` · ${durationLabel}` : ''}</div>` : ''}
        ${rankLabel ? `<div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:2px">${rankLabel}</div>` : !d.data.album ? `<div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px">#${d.data.rank}</div>` : ''}
      `
      tooltip.style.opacity = '1'
      tooltip.style.left = `${event.clientX + 14}px`
      tooltip.style.top = `${event.clientY - 10}px`
    })
    .on('mouseleave', () => {
      tooltip.style.opacity = '0'
    })

  // Background circle
  groups
    .append('circle')
    .attr('r', (d) => d.r)
    .attr('fill', (d) => (d.data.imageUrl ? '#1a1a2a' : '#2a2a3a'))

  // Image
  groups
    .filter((d) => !!d.data.imageUrl)
    .append('image')
    .attr('href', (d) => d.data.imageUrl)
    .attr('x', (d) => -d.r)
    .attr('y', (d) => -d.r)
    .attr('width', (d) => d.r * 2)
    .attr('height', (d) => d.r * 2)
    .attr('clip-path', (d) => `url(#${clipPrefix}-${d.data.id})`)
    .attr('preserveAspectRatio', 'xMidYMid slice')

  // Fallback initials
  groups
    .filter((d) => !d.data.imageUrl)
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('fill', 'rgba(255,255,255,0.5)')
    .attr('font-family', 'system-ui, sans-serif')
    .attr('font-weight', '700')
    .attr('font-size', (d) => Math.max(8, d.r * 0.55))
    .attr('pointer-events', 'none')
    .text((d) =>
      d.data.label
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    )

  // Rank badge — top 10 (only when circle is large enough to fit it)
  groups
    .filter((d) => d.data.rank <= 10 && d.r >= 20)
    .append('circle')
    .attr('r', (d) => (d.data.rank <= 3 ? Math.max(10, d.r * 0.22) : Math.max(8, d.r * 0.18)))
    .attr('cx', (d) => d.r * 0.6)
    .attr('cy', (d) => -d.r * 0.6)
    .attr('fill', (d) => (d.data.rank <= 3 ? '#1DB954' : 'rgba(255,255,255,0.2)'))

  groups
    .filter((d) => d.data.rank <= 10 && d.r >= 20)
    .append('text')
    .attr('x', (d) => d.r * 0.6)
    .attr('y', (d) => -d.r * 0.6)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('fill', (d) => (d.data.rank <= 3 ? '#000' : '#fff'))
    .attr('font-size', (d) =>
      d.data.rank <= 3 ? Math.max(7, d.r * 0.18) : Math.max(6, d.r * 0.15)
    )
    .attr('font-weight', '700')
    .attr('font-family', 'system-ui, sans-serif')
    .attr('pointer-events', 'none')
    .text((d) => `#${d.data.rank}`)

  return svg.node()!
}

export function renderTrackMosaic(
  container: HTMLElement,
  tracks: SpotifyTrack[],
  tooltip: HTMLDivElement
): SVGSVGElement {
  const items: PackItem[] = tracks.map((t, i) => {
    const imgs = t.album.images
    return {
      id: t.id,
      rank: i + 1,
      imageUrl: imgs.find((img) => img.width >= 64)?.url ?? imgs[0]?.url ?? '',
      label: t.name,
      sublabel: t.artists.map((a) => a.name).join(', '),
      spotifyUrl: t.external_urls.spotify,
      itemType: 'track' as const,
      album: t.album.name,
      duration: t.duration_ms,
    }
  })
  return renderCirclePack(container, items, tooltip, 'clip-track')
}

export function renderArtistMosaic(
  container: HTMLElement,
  artists: SpotifyArtist[],
  tooltip: HTMLDivElement
): SVGSVGElement {
  const items: PackItem[] = artists.map((a, i) => {
    const imgs = a.images
    return {
      id: a.id,
      rank: i + 1,
      imageUrl: imgs.find((img) => img.width >= 64)?.url ?? imgs[0]?.url ?? '',
      label: a.name,
      sublabel: '',
      spotifyUrl: a.external_urls.spotify,
      itemType: 'artist' as const,
    }
  })
  return renderCirclePack(container, items, tooltip, 'clip-artist')
}

export { mountTooltip }
