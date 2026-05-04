import type { TimeRange } from '../types/spotify'

export interface ControlsConfig {
  onTimeRangeChange: (range: TimeRange) => void
  onExportPng: () => void
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: '4 Weeks',
  medium_term: '6 Months',
  long_term: 'All Time',
}

const TIME_RANGES: TimeRange[] = ['short_term', 'medium_term', 'long_term']

let activeRange: TimeRange = 'medium_term'

export function mountControls(container: HTMLElement, config: ControlsConfig): void {
  const { onTimeRangeChange, onExportPng } = config

  const wrapper = document.createElement('div')
  wrapper.className = 'controls'
  wrapper.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(15,15,20,0.85);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    padding: 8px 12px;
    backdrop-filter: blur(12px);
    z-index: 50;
    user-select: none;
  `

  // Time range buttons
  for (const range of TIME_RANGES) {
    const btn = document.createElement('button')
    btn.dataset['range'] = range
    btn.textContent = TIME_RANGE_LABELS[range]
    btn.style.cssText = buttonStyle(range === activeRange)
    btn.addEventListener('click', () => {
      activeRange = range
      updateActiveButton(wrapper, range)
      onTimeRangeChange(range)
    })
    wrapper.appendChild(btn)
  }

  // Divider
  const divider = document.createElement('div')
  divider.style.cssText = `width:1px;height:20px;background:rgba(255,255,255,0.15);margin:0 4px`
  wrapper.appendChild(divider)

  // Export button
  const exportBtn = document.createElement('button')
  exportBtn.textContent = '↓ Export PNG'
  exportBtn.style.cssText = buttonStyle(false)
  exportBtn.addEventListener('click', onExportPng)
  wrapper.appendChild(exportBtn)

  container.appendChild(wrapper)
}

export function setActiveTimeRange(range: TimeRange): void {
  activeRange = range
  const wrapper = document.querySelector('.controls') as HTMLElement | null
  if (wrapper) updateActiveButton(wrapper, range)
}

function updateActiveButton(wrapper: HTMLElement, activeTimeRange: TimeRange): void {
  wrapper.querySelectorAll<HTMLButtonElement>('button[data-range]').forEach((btn) => {
    const isActive = btn.dataset['range'] === activeTimeRange
    btn.style.cssText = buttonStyle(isActive)
  })
}

function buttonStyle(active: boolean): string {
  return `
    background: ${active ? 'rgba(255,255,255,0.15)' : 'transparent'};
    border: 1px solid ${active ? 'rgba(255,255,255,0.3)' : 'transparent'};
    color: ${active ? '#fff' : 'rgba(255,255,255,0.55)'};
    border-radius: 8px;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: ${active ? '600' : '400'};
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  `
}
