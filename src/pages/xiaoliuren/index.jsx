import React, { useState } from 'react'
import { Input, Picker, Textarea, View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import { calculateXiaoLiuRen } from '../../utils/divination'
import './index.scss'

const methods = ['时间起卦', '随机起卦']

function XiaoLiuRen() {
  const addHistory = useAppStore((state) => state.addHistory)
  const [event, setEvent] = useState('')
  const [methodIndex, setMethodIndex] = useState(0)
  const [dateTime, setDateTime] = useState('')
  const [result, setResult] = useState(null)

  const submit = () => {
    const next = calculateXiaoLiuRen({
      event,
      method: methods[methodIndex],
      dateTime,
    })
    setResult(next)
    addHistory('xiaoliuren', { title: `${next.event}：${next.name}`, detail: next.advice })
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>小六壬</View>
        <View className='subtitle'>输入事件、起卦方式与时间，生成卦象、解释和建议。</View>
      </View>

      <View className='panel'>
        <View className='field'>
          <View className='label'>事件</View>
          <Textarea className='textarea' value={event} placeholder='例如：这周是否适合推进新项目' onInput={(event) => setEvent(event.detail.value)} />
        </View>
        <View className='field'>
          <View className='label'>起卦方式</View>
          <Picker mode='selector' range={methods} value={methodIndex} onChange={(event) => setMethodIndex(Number(event.detail.value))}>
            <View className='picker-value'>{methods[methodIndex]}</View>
          </Picker>
        </View>
        <View className='field'>
          <View className='label'>日期时间</View>
          <Input className='input' value={dateTime} placeholder='留空则使用当前时间，如 2026-04-24 10:30' onInput={(event) => setDateTime(event.detail.value)} />
        </View>
        <Button block type='primary' onClick={submit}>起卦</Button>
      </View>

      {result && (
        <View className='panel'>
          <View className='result-title'>{result.name}</View>
          <View className='result-text'>事件：{result.event}</View>
          <View className='result-text'>时间：{result.dateText}</View>
          <View className='result-text'>计算：{result.formula}</View>
          <View className='result-text'>解释：{result.meaning}</View>
          <View className='result-text'>建议：{result.advice}</View>
        </View>
      )}
    </View>
  )
}

export default XiaoLiuRen
