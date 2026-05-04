import type { GraphNode } from './nodes'

let tooltipEl: HTMLDivElement | null = null

export function mountTooltip(container: HTMLElement): void {
  tooltipEl = document.createElement('div')
  tooltipEl.className = 'graph-tooltip'
  tooltipEl.style.cssText = `
    position: fixed;
    display: none;
    pointer-events: none;
    background: rgba(15, 15, 20, 0.92);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 10px 14px;
    color: #e0e0e0;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    max-width: 220px;
    backdrop-filter: blur(8px);
    z-index: 100;
  `
  container.appendChild(tooltipEl)
}

export function showTooltip(event: MouseEvent, node: GraphNode): void {
  if (!tooltipEl) return

  const topGenres = node.genres.slice(0, 3)
  const genrePills = topGenres
    .map(
      (g) =>
        `<span style="
          display:inline-block;
          background:rgba(255,255,255,0.1);
          border-radius:4px;
          padding:1px 6px;
          font-size:11px;
          margin:1px 2px 1px 0;
        ">${g}</span>`
    )
    .join('')

  tooltipEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      ${
        node.imageUrl
          ? `<img src="${node.imageUrl}" width="40" height="40"
               style="border-radius:50%;border:2px solid ${node.color};flex-shrink:0">`
          : ''
      }
      <div>
        <div style="font-weight:600;font-size:14px">${node.name}</div>
        <div style="color:#888;font-size:11px">Rank #${node.rank}</div>
      </div>
    </div>
    ${genrePills ? `<div>${genrePills}</div>` : ''}
  `

  tooltipEl.style.display = 'block'
  positionTooltip(event)
}

export function moveTooltip(event: MouseEvent): void {
  positionTooltip(event)
}

export function hideTooltip(): void {
  if (tooltipEl) tooltipEl.style.display = 'none'
}

function positionTooltip(event: MouseEvent): void {
  if (!tooltipEl) return
  const pad = 12
  const tw = tooltipEl.offsetWidth
  const th = tooltipEl.offsetHeight
  let x = event.clientX + pad
  let y = event.clientY + pad

  if (x + tw > window.innerWidth - pad) x = event.clientX - tw - pad
  if (y + th > window.innerHeight - pad) y = event.clientY - th - pad

  tooltipEl.style.left = `${x}px`
  tooltipEl.style.top = `${y}px`
}
