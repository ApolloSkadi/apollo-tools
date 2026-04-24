import React from 'react'
import Taro from '@tarojs/taro'
import { View } from '@tarojs/components'
import './index.scss'

const groups = [
  {
    title: '日常类',
    tools: [
      { icon: '🎡', title: '动态转盘', desc: '选择困难、抽签、权重决策', url: '/pages/wheel/index' },
    ],
  },
  {
    title: '占卜类',
    tools: [
      { icon: '☯️', title: '六爻', desc: '手动摇卦、随机起卦、本卦变卦', url: '/pages/liuyao/index' },
      { icon: '🔮', title: '小六壬', desc: '快速起卦，查看卦象建议', url: '/pages/xiaoliuren/index' },
    ],
  },
]

function Tools() {
  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>工具</View>
        <View className='subtitle'>按类型整理入口，轻一点，也更好找。</View>
      </View>
      {groups.map((group) => (
        <View className='tool-group' key={group.title}>
          <View className='section-title'>{group.title}</View>
          <View className='tool-list'>
            {group.tools.map((tool) => (
              <View className='tool-list-item' key={tool.url} onClick={() => Taro.navigateTo({ url: tool.url })}>
                <View className='tool-list-item__icon'>{tool.icon}</View>
                <View className='tool-list-item__content'>
                  <View className='tool-list-item__title'>{tool.title}</View>
                  <View className='tool-list-item__desc'>{tool.desc}</View>
                </View>
                <View className='tool-list-item__arrow'>›</View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}

export default Tools
