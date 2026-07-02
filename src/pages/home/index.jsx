import React from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import './index.scss'

const tools = [
  { title: '转盘', desc: '自定义选项、权重、旋转动画与结果历史。', url: '/pages/wheel/index' },
  { title: '小六壬', desc: '按事件、起卦方式和日期时间生成卦象建议。', url: '/pages/xiaoliuren/index' },
  { title: '六爻', desc: '支持手动摇卦和随机起卦，生成本卦、变卦、动爻。', url: '/pages/liuyao/index' },
]

function Home() {
  return (
    <View className='page'>
      <View className='hero'>
        <Text className='eyebrow'>Apollo Tools</Text>
        <View className='title'>什么都有的小程序</View>
        <View className='subtitle'>把日常决策、灵感选择和卜卦记录收在一个轻量入口里。</View>
      </View>

      <View className='section-title'>常用工具</View>
      {tools.map((tool) => (
        <View className='tool-card' key={tool.url} onClick={() => Taro.navigateTo({ url: tool.url })}>
          <View className='tool-card__title'>{tool.title}</View>
          <View className='tool-card__desc'>{tool.desc}</View>
        </View>
      ))}
    </View>
  )
}

export default Home
