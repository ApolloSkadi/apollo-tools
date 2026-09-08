import { svgToDataUri } from '../icons'

const fmt = (n) => `${Math.round(n * 100) / 100}`

/**
 * Build a multi-series line/area chart as a base64 SVG data URI.
 *
 * @param {Array<{ name, color, values:number[] }>} series
 * @param {object} opts
 * @returns {string} data URI
 */
export function buildLineChartUri(series, opts = {}) {
  const {
    width = 340,
    height = 180,
    pad = { top: 12, right: 10, bottom: 14, left: 10 },
    minY,
    maxY,
    area = true,
  } = opts

  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const safe = series.filter((s) => s && s.values && s.values.length)
  if (!safe.length) return ''

  const n = safe[0].values.length
  let min = minY
  let max = maxY
  if (min === undefined || max === undefined) {
    const flat = safe.flatMap((s) => s.values)
    const dataMin = Math.min(...flat, 0)
    const dataMax = Math.max(...flat, 1)
    min = min === undefined ? dataMin : min
    max = max === undefined ? dataMax : max
  }
  if (max - min <= 0) max = min + 1

  const xStep = n > 1 ? innerW / (n - 1) : 0
  const yFor = (v) => pad.top + innerH - ((v - min) / (max - min)) * innerH
  const xAt = (i) => pad.left + (n > 1 ? i * xStep : innerW / 2)

  const parts = []

  // gridlines + y baseline
  const lines = 4
  for (let i = 0; i <= lines; i += 1) {
    const y = pad.top + (innerH / lines) * i
    parts.push(
      `<line x1="${pad.left}" y1="${fmt(y)}" x2="${width - pad.right}" y2="${fmt(y)}" stroke="#ececec" stroke-width="1"/>`
    )
  }

  // area + line per series
  safe.forEach((s) => {
    const points = s.values.map((v, i) => [xAt(i), yFor(v)])
    const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${fmt(x)} ${fmt(y)}`).join(' ')
    if (area && points.length) {
      const first = points[0]
      const last = points[points.length - 1]
      const bottom = pad.top + innerH
      const areaPath =
        `${line} L${fmt(last[0])} ${fmt(bottom)} L${fmt(first[0])} ${fmt(bottom)} Z`
      parts.push(`<path d="${areaPath}" fill="${s.color}" fill-opacity="0.1"/>`)
    }
    parts.push(`<path d="${line}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`)
  })

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">${parts.join('')}</svg>`
  return svgToDataUri(svg)
}
