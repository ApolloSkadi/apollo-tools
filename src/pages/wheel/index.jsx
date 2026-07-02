import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Input, Picker, View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import './index.scss'

const colors = ['#84cc9a', '#7dd3c7', '#f9c86a', '#f7a4a4', '#b8a3ff', '#93c5fd', '#f0abfc', '#a7b7aa']

const getReadableTextColor = (color) => {
  const value = color.replace('#', '')
  const red = parseInt(value.slice(0, 2), 16)
  const green = parseInt(value.slice(2, 4), 16)
  const blue = parseInt(value.slice(4, 6), 16)
  return red * 0.299 + green * 0.587 + blue * 0.114 > 160 ? '#2c2c2c' : '#ffffff'
}

const shuffleColors = () => [...colors].sort(() => Math.random() - 0.5)
const modes = ['自定义', '预设组']

const getWeightedResult = (options) => {
  const pool = options.filter((item) => item.label.trim() && Number(item.weight) > 0)
  const total = pool.reduce((sum, item) => sum + Number(item.weight), 0)
  let target = Math.random() * total
  return pool.find((item) => {
    target -= Number(item.weight)
    return target <= 0
  }) || pool[0]
}

function Wheel() {
  const wheelOptions = useAppStore((state) => state.wheelOptions)
  const wheelPresetGroups = useAppStore((state) => state.wheelPresetGroups || [])
  const updateWheelOption = useAppStore((state) => state.updateWheelOption)
  const addWheelOption = useAppStore((state) => state.addWheelOption)
  const removeWheelOption = useAppStore((state) => state.removeWheelOption)
  const addWheelPresetGroup = useAppStore((state) => state.addWheelPresetGroup)
  const addHistory = useAppStore((state) => state.addHistory)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [resultEnter, setResultEnter] = useState(false)
  const [modeIndex, setModeIndex] = useState(0)
  const [presetIndex, setPresetIndex] = useState(0)
  const [presetName, setPresetName] = useState('')
  const settleTimer = useRef(null)

  const selectedPreset = wheelPresetGroups[presetIndex]
  const activeOptions = modeIndex === 1 && selectedPreset ? selectedPreset.options : wheelOptions
  const validOptions = activeOptions.filter((item) => item.label.trim() && Number(item.weight) > 0)
  const optionColorMap = useMemo(() => {
    const shuffled = shuffleColors()
    return activeOptions.reduce((map, item, index) => {
      map[item.id] = shuffled[index % shuffled.length]
      return map
    }, {})
  }, [activeOptions.map((item) => item.id).join('|')])
  const wheelData = useMemo(() => {
    if (!validOptions.length) return { style: {}, labels: [], ranges: [] }
    const total = validOptions.reduce((sum, item) => sum + Number(item.weight), 0)
    let cursor = 0
    const labels = []
    const ranges = []
    const stops = validOptions.map((item) => {
      const startValue = cursor
      const start = (startValue / total) * 100
      cursor += Number(item.weight)
      const end = (cursor / total) * 100
      const startAngle = (startValue / total) * 360
      const endAngle = (cursor / total) * 360
      const middleAngle = (startAngle + endAngle) / 2
      const span = endAngle - startAngle
      const color = optionColorMap[item.id] || colors[0]
      const radians = ((middleAngle - 90) * Math.PI) / 180
      const radius = 80

      ranges.push({ id: item.id, startAngle, endAngle, middleAngle })
      if (span >= 32) {
        labels.push({
          id: item.id,
          text: item.label,
          style: {
            left: `${130 + Math.cos(radians) * radius}px`,
            top: `${130 + Math.sin(radians) * radius}px`,
            color: getReadableTextColor(color),
          },
        })
      }

      return `${color} ${start}% ${end}%`
    })
    return {
      style: {
        background: `conic-gradient(${stops.join(', ')})`,
        transform: `rotate(${rotation}deg)`,
      },
      labels,
      ranges,
    }
  }, [rotation, validOptions, optionColorMap])

  const start = useCallback(() => {
    if (spinning || !validOptions.length) return
    const picked = getWeightedResult(validOptions)
    const range = wheelData.ranges.find((item) => item.id === picked.id)
    const targetAngle = 360 - (range?.middleAngle || 0)
    const nextRotation = rotation + 1440 + targetAngle
    setSpinning(true)
    setResult(null)
    setResultEnter(false)
    setRotation(nextRotation)

    // Main spin: 2.4s deceleration, then reveal
    settleTimer.current = setTimeout(() => {
      setSpinning(false)
      setResult(picked)
      addHistory('wheel', {
        title: picked.label,
        detail: `权重 ${picked.weight}`,
        payload: {
          mode: modes[modeIndex],
          presetName: selectedPreset?.name,
          options: validOptions,
          result: picked,
        },
      })
      // Trigger result entrance on next frame
      setTimeout(() => {
        setResultEnter(true)
      }, 50)
    }, 2400)
  }, [spinning, validOptions, wheelData.ranges, rotation, modeIndex, selectedPreset, addHistory])

  const saveAsPreset = () => {
    if (!validOptions.length) return
    addWheelPresetGroup(presetName || '临时自定义预设', validOptions)
    setPresetName('')
    setModeIndex(1)
    setPresetIndex(0)
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>动态转盘</View>
        <View className='subtitle'>自定义选项与权重，点击开始后保存本次结果。</View>
      </View>

      <View className='panel wheel-mode-panel'>
        <View className='field'>
          <View className='label'>使用方式</View>
          <Picker mode='selector' range={modes} value={modeIndex} onChange={(event) => setModeIndex(Number(event.detail.value))}>
            <View className='picker-value'>{modes[modeIndex]}</View>
          </Picker>
        </View>
        {modeIndex === 1 && (
          <View className='field wheel-mode-field'>
            <View className='label'>预设组</View>
            <Picker
              mode='selector'
              range={wheelPresetGroups.map((item) => item.name)}
              value={presetIndex}
              onChange={(event) => setPresetIndex(Number(event.detail.value))}
            >
              <View className='picker-value'>{selectedPreset?.name || '暂无预设组'}</View>
            </Picker>
          </View>
        )}
      </View>

      <View className={`wheel-wrap ${spinning ? 'wheel-wrap--spinning' : ''}`}>
        <View className={`wheel-pointer ${spinning ? 'wheel-pointer--active' : ''}`} />
        <View className={`wheel ${spinning ? 'wheel--spinning' : ''}`} style={wheelData.style}>
          {wheelData.labels.map((label) => (
            <View className='wheel-label' key={label.id} style={label.style}>{label.text}</View>
          ))}
          <View className='wheel-center'>🎯</View>
        </View>
      </View>

      <Button block type='primary' loading={spinning} onClick={start}>{spinning ? '转动中' : '✨ 开始转动'}</Button>
      {result && (
        <View className={`result-banner ${resultEnter ? 'result-banner--enter' : ''}`}>
          <View className='result-banner__emoji'>🎉</View>
          <View className='result-banner__content'>
            <View className='result-banner__label'>结果是</View>
            <View className='result-banner__title'>{result.label}</View>
            <View className='result-banner__text'>已保存到历史记录</View>
          </View>
        </View>
      )}

      <View className='section-title'>{modeIndex === 1 ? '预设组选项' : '选项与权重'}</View>
      {modeIndex === 0 ? (
        <View>
          {wheelOptions.map((item) => (
            <View className='option-row' key={item.id}>
              <Input
                className='input option-name'
                value={item.label}
                placeholder='选项名称'
                onInput={(event) => updateWheelOption(item.id, { label: event.detail.value })}
              />
              <Input
                className='input option-weight'
                type='number'
                value={`${item.weight}`}
                onInput={(event) => updateWheelOption(item.id, { weight: Math.max(0, Number(event.detail.value) || 0) })}
              />
              <Button size='small' type='danger' fill='outline' onClick={() => removeWheelOption(item.id)}>🗑</Button>
            </View>
          ))}
          <Button type='success' fill='outline' onClick={addWheelOption}>＋ 新增选项</Button>
          <View className='save-preset-panel'>
            <Input className='input save-preset-input' value={presetName} placeholder='预设组名称' onInput={(event) => setPresetName(event.detail.value)} />
            <Button type='primary' fill='outline' disabled={!validOptions.length} onClick={saveAsPreset}>保存为预设组</Button>
          </View>
        </View>
      ) : (
        <View className='preset-preview'>
          {validOptions.length ? (
            validOptions.map((item) => (
              <View className='preset-preview-item' key={item.id}>
                <View className='preset-preview-item__name'>{item.label}</View>
                <View className='preset-preview-item__weight'>权重 {item.weight}</View>
              </View>
            ))
          ) : (
            <View className='empty-state'>暂无可用预设组选项</View>
          )}
        </View>
      )}
    </View>
  )
}

export default Wheel
