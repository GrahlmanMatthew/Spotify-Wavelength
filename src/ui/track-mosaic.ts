import * as d3 from 'd3'
import type { SpotifyArtist, SpotifyTrack } from '../types/spotify'

interface PackItem {
  id: string
  rank: number
  imageUrl: string
  label: string
  sublabel: string
  spotifyUrl: string
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

  const size = Math.min(container.clientWidth || 800, Math.floor(window.innerHeight * 0.82))

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
    .style('background', '#111213')
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
    .style('cursor', 'pointer')
    .on('click', (_, d) => window.open(d.data.spotifyUrl, '_blank'))
    .on('mousemove', (event: MouseEvent, d) => {
      tooltip.innerHTML = `
        <div style="font-size:12px;font-weight:700;color:#fff;line-height:1.3">${d.data.label}</div>
        ${d.data.sublabel ? `<div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:3px">${d.data.sublabel}</div>` : ''}
        <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px">#${d.data.rank}</div>
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

  // Rank badge — top 3
  groups
    .filter((d) => d.data.rank <= 3)
    .append('circle')
    .attr('r', (d) => Math.max(10, d.r * 0.22))
    .attr('cx', (d) => d.r * 0.6)
    .attr('cy', (d) => -d.r * 0.6)
    .attr('fill', '#1DB954')

  groups
    .filter((d) => d.data.rank <= 3)
    .append('text')
    .attr('x', (d) => d.r * 0.6)
    .attr('y', (d) => -d.r * 0.6)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('fill', '#000')
    .attr('font-size', (d) => Math.max(7, d.r * 0.18))
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
    }
  })
  return renderCirclePack(container, items, tooltip, 'clip-artist')
}

export { mountTooltip }
