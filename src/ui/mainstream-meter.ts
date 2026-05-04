import * as d3 from 'd3'
import type { SpotifyTrack } from '../types/spotify'

interface MeterNode extends d3.SimulationNodeDatum {
  track: SpotifyTrack
  targetX: number
}

const SVG_HEIGHT = 340
const BAR_Y = 160
const BAR_HEIGHT = 8
const NODE_RADIUS = 20
const GRAD_ID = 'meter-gradient'

function popularityLabel(score: number): string {
  if (score < 20) return 'Deep Underground'
  if (score < 35) return 'Underground'
  if (score < 48) return 'Indie-leaning'
  if (score < 62) return 'Balanced Taste'
  if (score < 75) return 'Mainstream-leaning'
  if (score < 88) return 'Mainstream'
  return 'Chart Territory'
}

export function renderMainstreamMeter(
  container: HTMLElement,
  tracks: SpotifyTrack[],
  tooltip: HTMLDivElement
): SVGSVGElement {
  container.innerHTML = ''

  const width = container.clientWidth || 900
  const padX = 56
  const barLeft = padX
  const barRight = width - padX

  const xScale = d3.scaleLinear().domain([0, 100]).range([barLeft, barRight])

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', SVG_HEIGHT)
    .style('background', '#111213')
    .style('display', 'block')

  const defs = svg.append('defs')

  const grad = defs.append('linearGradient').attr('id', GRAD_ID)
  grad.append('stop').attr('offset', '0%').attr('stop-color', '#6B48FF')
  grad.append('stop').attr('offset', '50%').attr('stop-color', '#00F5FF')
  grad.append('stop').attr('offset', '100%').attr('stop-color', '#FF3FA4')

  // End labels
  svg
    .append('text')
    .attr('x', barLeft)
    .attr('y', SVG_HEIGHT - 10)
    .attr('text-anchor', 'start')
    .attr('fill', 'rgba(255,255,255,0.35)')
    .attr('font-size', '11px')
    .attr('font-family', 'system-ui, sans-serif')
    .text('Underground')

  svg
    .append('text')
    .attr('x', barRight)
    .attr('y', SVG_HEIGHT - 10)
    .attr('text-anchor', 'end')
    .attr('fill', 'rgba(255,255,255,0.35)')
    .attr('font-size', '11px')
    .attr('font-family', 'system-ui, sans-serif')
    .text('Mainstream')

  // Gradient bar
  svg
    .append('rect')
    .attr('x', barLeft)
    .attr('y', BAR_Y - BAR_HEIGHT / 2)
    .attr('width', barRight - barLeft)
    .attr('height', BAR_HEIGHT)
    .attr('rx', BAR_HEIGHT / 2)
    .attr('fill', `url(#${GRAD_ID})`)
    .attr('opacity', 0.5)

  // Beeswarm simulation
  const nodes: MeterNode[] = tracks.map((t) => ({
    track: t,
    targetX: xScale(t.popularity ?? 50),
    x: xScale(t.popularity ?? 50),
    y: BAR_Y,
  }))

  const sim = d3
    .forceSimulation(nodes)
    .force('x', d3.forceX<MeterNode>((d) => d.targetX).strength(3))
    .force('y', d3.forceY<MeterNode>(BAR_Y).strength(0.08))
    .force('collide', d3.forceCollide<MeterNode>(NODE_RADIUS + 3).strength(1))
    .stop()

  for (let i = 0; i < 300; i++) sim.tick()

  // Clip paths for album art
  nodes.forEach((n) => {
    defs
      .append('clipPath')
      .attr('id', `clip-meter-${n.track.id}`)
      .append('circle')
      .attr('r', NODE_RADIUS)
  })

  const groups = svg
    .selectAll<SVGGElement, MeterNode>('g.meter-node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'meter-node')
    .attr('transform', (d) =>
      `translate(${d.x ?? 0},${Math.max(NODE_RADIUS + 4, Math.min(SVG_HEIGHT - NODE_RADIUS - 30, d.y ?? BAR_Y))})`
    )
    .style('cursor', 'pointer')
    .on('click', (_, d) => window.open(d.track.external_urls.spotify, '_blank'))
    .on('mousemove', (event: MouseEvent, d) => {
      const artists = d.track.artists.map((a) => a.name).join(', ')
      tooltip.innerHTML = `
        <div style="font-size:12px;font-weight:700;color:#fff;line-height:1.3">${d.track.name}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:3px">${artists}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-top:2px">Popularity ${d.track.popularity} / 100</div>
      `
      tooltip.style.opacity = '1'
      tooltip.style.left = `${event.clientX + 14}px`
      tooltip.style.top = `${event.clientY - 10}px`
    })
    .on('mouseleave', () => {
      tooltip.style.opacity = '0'
    })

  // Album art
  groups
    .append('image')
    .attr('href', (d) => {
      const imgs = d.track.album.images
      return imgs.find((img) => img.width >= 64)?.url ?? imgs[0]?.url ?? ''
    })
    .attr('x', -NODE_RADIUS)
    .attr('y', -NODE_RADIUS)
    .attr('width', NODE_RADIUS * 2)
    .attr('height', NODE_RADIUS * 2)
    .attr('clip-path', (d) => `url(#clip-meter-${d.track.id})`)
    .attr('preserveAspectRatio', 'xMidYMid slice')

  // Ring
  groups
    .append('circle')
    .attr('r', NODE_RADIUS)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(255,255,255,0.2)')
    .attr('stroke-width', 1.5)

  // Average score indicator
  const avg = tracks.reduce((s, t) => s + (t.popularity ?? 50), 0) / tracks.length
  const avgX = xScale(avg)

  svg
    .append('line')
    .attr('x1', avgX)
    .attr('y1', BAR_Y - 24)
    .attr('x2', avgX)
    .attr('y2', BAR_Y + 24)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  const d = 6
  svg
    .append('polygon')
    .attr('points', `${avgX},${BAR_Y - d} ${avgX + d},${BAR_Y} ${avgX},${BAR_Y + d} ${avgX - d},${BAR_Y}`)
    .attr('fill', '#fff')

  svg
    .append('text')
    .attr('x', avgX)
    .attr('y', SVG_HEIGHT - 28)
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('font-size', '22px')
    .attr('font-weight', '700')
    .attr('font-family', 'system-ui, sans-serif')
    .text(Math.round(avg))

  svg
    .append('text')
    .attr('x', avgX)
    .attr('y', SVG_HEIGHT - 12)
    .attr('text-anchor', 'middle')
    .attr('fill', 'rgba(255,255,255,0.55)')
    .attr('font-size', '11px')
    .attr('font-family', 'system-ui, sans-serif')
    .text(popularityLabel(avg))

  return svg.node()!
}
