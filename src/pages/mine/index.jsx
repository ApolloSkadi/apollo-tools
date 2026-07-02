import React from 'react'
import Taro from '@tarojs/taro'
import { Image, View } from '@tarojs/components'
import './index.scss'

const actions = [
  { title: '转盘预设组', desc: '配置常用选项组', url: '/pages/wheel-presets/index' },
  { title: '设置', desc: '偏好与应用配置' },
]

function Mine() {
  const openAction = (item) => {
    if (item.url) {
      Taro.navigateTo({ url: item.url })
      return
    }
    Taro.showToast({ title: '设置功能待完善', icon: 'none' })
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>我的</View>
        <View className='subtitle'>管理个人信息和应用偏好。</View>
      </View>

      <View className='user-card'>
        <View className='user-avatar'>
          <Image className='user-avatar__image' src={require('../../images/user-black.png')} mode='aspectFit' />
        </View>
        <View className='user-info'>
          <View className='user-name'>Apollo</View>
          <View className='user-desc'>本机用户</View>
        </View>
      </View>

      <View className='action-list'>
        {actions.map((item) => (
          <View className='action-item' key={item.title} onClick={() => openAction(item)}>
            <View className='action-icon'>⚙</View>
            <View className='action-content'>
              <View className='action-title'>{item.title}</View>
              <View className='action-desc'>{item.desc}</View>
            </View>
            <View className='action-arrow'>›</View>
          </View>
        ))}
      </View>
    </View>
  )
}

export default Mine
