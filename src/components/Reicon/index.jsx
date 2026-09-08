import React, { useMemo } from 'react'
import { View } from '@tarojs/components'
import { iconToDataUri } from '../../icons'
import './index.scss'

/**
 * Cross-platform Reicon renderer.
 *
 * Draws a Reicon SVG as a base64 background-image so it works on WeChat
 * mini programs (no <svg> node, no SVG <image>) and on H5 as well.
 *
 * @param {string} name   Reicon icon name, e.g. 'Wheel'
 * @param {number} size   px size (square)
 * @param {string} color  icon tint
 * @param {'O'|'F'} weight weight: 'O' outline, 'F' filled
 */
function Reicon({
  name,
  size = 24,
  color = '#2c2c2c',
  weight = 'O',
  className = '',
  style = {},
}) {
  const uri = useMemo(() => iconToDataUri(name, { color, weight }), [name, color, weight])

  if (!uri) {
    return <View className={`reicon reicon--empty ${className}`} style={{ width: `${size}px`, height: `${size}px`, ...style }} />
  }

  return (
    <View
      className={`reicon ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url("${uri}")`,
        ...style,
      }}
    />
  )
}

export default Reicon
