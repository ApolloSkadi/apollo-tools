import React, { useMemo, useState } from 'react'
import { Input, View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import './index.scss'

const colors = ['#84cc9a', '#7dd3c7', '#f9c86a', '#f7a4a4', '#b8a3ff', '#93c5fd', '#f0abfc', '#a7b7aa']

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
  const updateWheelOption = useAppStore((state) => state.updateWheelOption)
  const addWheelOption = useAppStore((state) => state.addWheelOption)
  const removeWheelOption = useAppStore((state) => state.removeWheelOption)
  const addHistory = useAppStore((state) => state.addHistory)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)

  const validOptions = wheelOptions.filter((item) => item.label.trim() && Number(item.weight) > 0)
  const wheelStyle = useMemo(() => {
    if (!validOptions.length) return {}
    const total = validOptions.reduce((sum, item) => sum + Number(item.weight), 0)
    let cursor = 0
    const stops = validOptions.map((item, index) => {
      const start = (cursor / total) * 100
      cursor += Number(item.weight)
      const end = (cursor / total) * 100
      return `${colors[index % colors.length]} ${start}% ${end}%`
    })
    return {
      background: `conic-gradient(${stops.join(', ')})`,
      transform: `rotate(${rotation}deg)`,
    }
  }, [rotation, validOptions])

  const start = () => {
    if (spinning || !validOptions.length) return
    const picked = getWeightedResult(validOptions)
    const index = validOptions.findIndex((item) => item.id === picked.id)
    const slice = 360 / validOptions.length
    const targetAngle = 360 - (index * slice + slice / 2)
    const nextRotation = rotation + 1440 + targetAngle
    setSpinning(true)
    setResult(null)
    setRotation(nextRotation)
    setTimeout(() => {
      setResult(picked)
      addHistory('wheel', { title: picked.label, detail: `权重 ${picked.weight}` })
      setSpinning(false)
    }, 2600)
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>动态转盘</View>
        <View className='subtitle'>自定义选项与权重，点击开始后保存本次结果。</View>
      </View>

      <View className='wheel-wrap'>
        <View className='wheel-pointer' />
        <View className='wheel' style={wheelStyle}>
          <View className='wheel-center'>🎯</View>
        </View>
      </View>

      <Button block type='primary' loading={spinning} onClick={start}>{spinning ? '转动中' : '✨ 开始转动'}</Button>
      {result && (
        <View className='result-banner'>
          <View className='result-banner__emoji'>🎉</View>
          <View className='result-banner__content'>
            <View className='result-banner__label'>结果是</View>
            <View className='result-banner__title'>{result.label}</View>
            <View className='result-banner__text'>已保存到历史记录</View>
          </View>
        </View>
      )}

      <View className='section-title'>选项与权重</View>
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
    </View>
  )
}

export default Wheel
