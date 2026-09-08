import React from 'react'
import Taro from '@tarojs/taro'
import { View } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import TabBar from '../../components/TabBar'
import './index.scss'

const groups = [
  {
    title: '记账类',
    tint: '#2c2c2c',
    tools: [
      { icon: 'WalletMoney', title: '记账', desc: '本地账本、分类环比、收支趋势', url: '/pages/ledger/index' },
    ],
  },
  {
    title: '日常类',
    tint: '#4a7cf0',
    tools: [
      { icon: 'Wheel', title: '动态转盘', desc: '选择困难、抽签、权重决策', url: '/pages/wheel/index' },
    ],
  },
  {
    title: '占卜类',
    tint: '#5a4f8a',
    tools: [
      { icon: 'Coins', title: '六爻', desc: '手动摇卦、随机起卦、本卦变卦', url: '/pages/liuyao/index' },
      { icon: 'Compass', title: '小六壬', desc: '快速起卦，查看卦象建议', url: '/pages/xiaoliuren/index' },
      { icon: 'Cards', title: '今日运势', desc: '塔罗三牌占卜，过去·现在·未来', url: '/pages/tarot/index' },
    ],
  },
  {
    title: '审批类',
    tint: '#2f5f9e',
    tools: [
      { icon: 'ShieldCheck', title: '真的要吗', desc: '发布想买的物品，好友审批帮你冷静', url: '/pages/approval/index' },
    ],
  },
]

function Tools() {
  return (
    <View className='page page--with-tabbar'>
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
                <View className='tool-list-item__icon' style={{ background: `${group.tint}14` }}>
                  <Reicon name={tool.icon} size={20} color={group.tint} />
                </View>
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
      <TabBar tabKey='tools' />
    </View>
  )
}

export default Tools
