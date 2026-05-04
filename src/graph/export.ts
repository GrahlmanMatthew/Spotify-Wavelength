export async function exportGraphAsPng(
  svgElement: SVGSVGElement,
  filename = 'spotify-graph.png'
): Promise<void> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement

  // Inline all cross-origin <image> elements as base64 data URIs
  const imageEls = Array.from(clone.querySelectorAll('image'))
  await Promise.allSettled(
    imageEls.map(async (img) => {
      const href = img.getAttribute('href') ?? img.getAttribute('xlink:href')
      if (!href) return
      try {
        const response = await fetch(href)
        const blob = await response.blob()
        const dataUri = await blobToDataUri(blob)
        img.setAttribute('href', dataUri)
      } catch {
        // Non-fatal: image stays broken in export rather than blocking the download
      }
    })
  )

  // Inject CSS needed for visual fidelity
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `
    .graph-node-ring { transition: none; animation: none; }
  `
  let defs = clone.querySelector('defs')
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    clone.prepend(defs)
  }
  defs.appendChild(style)

  const svgString = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = svgUrl
    })

    const canvas = document.createElement('canvas')
    const { width, height } = svgElement.getBoundingClientRect()
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio

    const ctx = canvas.getContext('2d')!
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.drawImage(img, 0, 0)

    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        resolve()
      }, 'image/png')
    })
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
