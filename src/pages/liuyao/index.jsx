import React, { useState } from 'react'
import { View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import { calculateLiuYao, createRandomYao } from '../../utils/divination'
import './index.scss'

const yaoValues = [6, 7, 8, 9]
const yaoNames = {
  6: '老阴',
  7: '少阳',
  8: '少阴',
  9: '老阳',
}

function LiuYao() {
  const addHistory = useAppStore((state) => state.addHistory)
  const [lines, setLines] = useState(Array(6).fill(null))
  const [result, setResult] = useState(null)
  const filledCount = lines.filter((line) => line).length

  const shakeOne = () => {
    const emptyIndex = lines.findIndex((line) => !line)
    if (emptyIndex === -1) return
    const next = [...lines]
    next[emptyIndex] = createRandomYao()
    setLines(next)
  }

  const randomAll = () => {
    const nextLines = Array.from({ length: 6 }, createRandomYao)
    const next = calculateLiuYao(nextLines)
    setLines(nextLines)
    setResult(next)
    addHistory('liuyao', { title: next.originalHexagram.name, detail: next.summary })
  }

  const generate = () => {
    if (filledCount !== 6) return
    const next = calculateLiuYao(lines)
    setResult(next)
    addHistory('liuyao', { title: next.originalHexagram.name, detail: next.summary })
  }

  const reset = () => {
    setLines(Array(6).fill(null))
    setResult(null)
  }

  const changeLine = (index, value) => {
    const next = [...lines]
    next[index] = value
    setLines(next)
    setResult(null)
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>六爻</View>
        <View className='subtitle'>自下而上生成六爻，可手动调整，也可一键随机起卦。</View>
      </View>

      <View className='panel'>
        <View className='row-wrap'>
          <Button type='primary' onClick={shakeOne} disabled={filledCount >= 6}>手动摇一爻</Button>
          <Button type='success' fill='outline' onClick={randomAll}>随机起卦</Button>
          <Button fill='outline' onClick={reset}>重置</Button>
        </View>
        <View className='muted liuyao-tip'>当前已生成 {filledCount}/6 爻</View>
      </View>

      <View className='hexagram-panel'>
        {Array.from({ length: 6 }).map((_, reverseIndex) => {
          const index = 5 - reverseIndex
          const value = lines[index]
          const isYang = value === 7 || value === 9
          return (
            <View className='yao-row' key={index}>
              <View className='yao-index'>第 {index + 1} 爻</View>
              <View className={`yao-line ${isYang ? 'yang' : 'yin'} ${value ? '' : 'empty'}`}>
                <View />
                {!isYang && <View />}
              </View>
              <View className='yao-actions'>
                {yaoValues.map((item) => (
                  <Button
                    key={item}
                    size='small'
                    type={value === item ? 'primary' : 'default'}
                    fill={value === item ? 'solid' : 'outline'}
                    onClick={() => changeLine(index, item)}
                  >
                    {yaoNames[item]}
                  </Button>
                ))}
              </View>
            </View>
          )
        })}
      </View>

      <Button block type='primary' disabled={filledCount !== 6} onClick={generate}>生成卦象</Button>

      {result && (
        <View className='panel'>
          <View className='result-title'>{result.originalHexagram.name}</View>
          <View className='result-text'>本卦：{result.originalHexagram.text}，{result.originalHexagram.note}</View>
          <View className='result-text'>变卦：{result.changedHexagram.name}（{result.changedHexagram.text}）</View>
          <View className='result-text'>动爻：{result.changedLines.length ? `第 ${result.changedLines.join('、')} 爻` : '无'}</View>
          <View className='result-text'>六爻：{result.lineLabels.join('、')}</View>
          <View className='result-text'>解释：{result.summary}</View>
        </View>
      )}
    </View>
  )
}

export default LiuYao
