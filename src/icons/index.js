import { REICON } from './reicon-data'

// WeChat mini programs have no <svg> DOM node and their <image> component
// does not accept SVG. The reliable way to draw an SVG icon on all targets is
// to embed it as a base64 data-URI background-image. Reicon's markup uses
// currentColor, so we substitute the requested tint before encoding.

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function utf8Bytes(str) {
  const bytes = []
  for (let i = 0; i < str.length; i += 1) {
    let code = str.charCodeAt(i)
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // surrogate pair
      const hi = code
      const lo = str.charCodeAt(i + 1)
      code = 0x10000 + ((hi - 0xd800) << 10) + (lo - 0xdc00)
      i += 1
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      )
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
  }
  return bytes
}

function base64(bytes) {
  let out = ''
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63]
  }
  const rem = bytes.length - i
  if (rem === 1) {
    const n = bytes[i] << 16
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + '=='
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8)
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + '='
  }
  return out
}

const cache = {}

export function svgToDataUri(svg) {
  return `data:image/svg+xml;base64,${base64(utf8Bytes(svg))}`
}

export function iconToDataUri(name, options = {}) {
  const {
    color = '#2c2c2c',
    weight = 'O',
  } = options
  const icon = REICON[name]
  if (!icon) return ''

  const inner = (icon[weight] || icon.O || '').replace(/currentColor/g, color)
  if (!inner) return ''

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">${inner}</svg>`
  const key = `${name}|${weight}|${color}`
  if (cache[key]) return cache[key]

  const uri = svgToDataUri(svg)
  cache[key] = uri
  return uri
}

export function hasIcon(name) {
  return Boolean(REICON[name])
}

export const iconNames = Object.keys(REICON)
