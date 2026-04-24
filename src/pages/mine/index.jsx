import React from 'react'
import { View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import './index.scss'

function Mine() {
  const histories = useAppStore((state) => state.histories)
  const clearHistory = useAppStore((state) => state.clearHistory)
  const total = histories.wheel.length + histories.xiaoliuren.length + histories.liuyao.length

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>我的</View>
        <View className='subtitle'>历史记录会保存在本机，方便回看每一次结果。</View>
      </View>
      <View className='panel'>
        <View className='result-title'>{total} 条记录</View>
        <View className='result-text'>转盘 {histories.wheel.length} 条，小六壬 {histories.xiaoliuren.length} 条，六爻 {histories.liuyao.length} 条。</View>
        <View className='mine-actions'>
          <Button type='danger' fill='outline' onClick={() => clearHistory()}>清空全部历史</Button>
        </View>
      </View>
    </View>
  )
}

export default Mine
