import React, { useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Image, View, Text } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import TabBar from '../../components/TabBar'
import { useAppStore } from '../../store/useAppStore'
import { apiMyGroups } from '../../services/api'
import { silentLogin, refreshMe, logout } from '../../services/auth'
import './index.scss'

const THEMES = [
  { id: 'ledger', label: '记账', icon: 'WalletMoney', tint: '#2c2c2c' },
  { id: 'divination', label: '占卜', icon: 'MagicWand', tint: '#5a4f8a' },
  { id: 'approval', label: '审批', icon: 'ShieldCheck', tint: '#2f5f9e' },
]

const actions = [
  { title: '记账', desc: '本地账本与报表', url: '/pages/ledger/index', icon: 'WalletMoney', tint: '#2c2c2c' },
  { title: '记账报表', desc: '类型环比、日期收支、趋势', url: '/pages/ledger-report/index', icon: 'Chart', tint: '#2f8a5b' },
  { title: '转盘预设组', desc: '配置常用选项组', url: '/pages/wheel-presets/index', icon: 'Wheel', tint: '#8a8a8a' },
]

function Mine() {
  const token = useAppStore((state) => state.token)
  const user = useAppStore((state) => state.user)
  const myGroups = useAppStore((state) => state.myGroups)
  const setMyGroups = useAppStore((state) => state.setMyGroups)
  const homeTheme = useAppStore((state) => state.homeTheme)
  const setHomeTheme = useAppStore((state) => state.setHomeTheme)

  const loadGroups = async () => {
    try {
      const { groups } = await apiMyGroups()
      setMyGroups(groups)
    } catch (e) { /* ignore */ }
  }

  useDidShow(() => {
    if (token) {
      refreshMe()
      loadGroups()
    }
  })

  useEffect(() => {
    if (!token) return
    refreshMe()
    loadGroups()
  }, [token])

  const doLogin = async () => {
    const u = await silentLogin()
    if (u) loadGroups()
    else Taro.showToast({ title: '登录失败', icon: 'none' })
  }

  const openAction = (item) => {
    if (item.url) {
      Taro.navigateTo({ url: item.url })
      return
    }
    Taro.showToast({ title: '功能待完善', icon: 'none' })
  }

  const goProfile = () => {
    if (token) Taro.navigateTo({ url: '/pages/profile/index' })
    else doLogin()
  }

  return (
    <View className='page page--with-tabbar'>
      <View className='hero'>
        <View className='title'>我的</View>
        <View className='subtitle'>管理个人信息、应用偏好与群组。</View>
      </View>

      <View className='user-card' onClick={goProfile}>
        <View className='user-avatar'>
          {user && user.avatar ? (
            <Image className='user-avatar__image' src={user.avatar} mode='aspectFill' />
          ) : (
            <View className='user-avatar__fallback'>{user ? user.nickname.slice(0, 1) : '?'}</View>
          )}
        </View>
        <View className='user-info'>
          <View className='user-name'>{user ? user.nickname : '未登录'}</View>
          <View className='user-desc'>{user ? '本机用户 · 点击完善资料' : '点击卡片登录，登录后可创建群组、发布审批'}</View>
        </View>
      </View>

      <View className='action-list'>
        {actions.map((item) => (
          <View className='action-item' key={item.title} onClick={() => openAction(item)}>
            <View className='action-icon'>
              <Reicon name={item.icon} size={18} color={item.tint || '#4d4d4d'} />
            </View>
            <View className='action-content'>
              <View className='action-title'>{item.title}</View>
              <View className='action-desc'>{item.desc}</View>
            </View>
            <View className='action-arrow'>›</View>
          </View>
        ))}
      </View>

      <View className='section-title'>群组</View>
      <View className='group-quick'>
        <View className='group-quick__item' onClick={() => Taro.navigateTo({ url: '/pages/group-create/index' })}>
          <Reicon name='Plus' size={16} color='#2c2c2c' />
          <Text>创建群组</Text>
        </View>
        <View className='group-quick__item' onClick={() => Taro.navigateTo({ url: '/pages/group-join/index' })}>
          <Reicon name='Users' size={16} color='#2c2c2c' />
          <Text>加入群组</Text>
        </View>
      </View>

      {myGroups.length ? (
        <View className='group-list'>
          {myGroups.map((g) => (
            <View className='group-list__item' key={g.id} onClick={() => Taro.navigateTo({ url: `/pages/group/index?groupId=${g.id}` })}>
              <View className='group-list__icon'>
                <Reicon name='Users' size={17} color='#5a4f8a' />
              </View>
              <View className='group-list__body'>
                <View className='group-list__name'>{g.name}</View>
                <View className='group-list__meta'>{g.memberCount} 人 · 群码 {g.code}</View>
              </View>
              <View className='group-list__arrow'>›</View>
            </View>
          ))}
        </View>
      ) : (
        <View className='muted'>还没有加入群组，先创建一个或输入群组码加入。</View>
      )}

      <View className='section-title'>设置</View>
      <View className='mine-setting'>
        <View className='mine-setting__head'>
          <View className='mine-setting__title'>首页主题</View>
          <View className='mine-setting__desc'>切换首页内容与底部导航</View>
        </View>
        <View className='mine-theme-seg'>
          {THEMES.map((theme) => {
            const active = theme.id === homeTheme
            return (
              <View
                className={`mine-theme ${active ? 'mine-theme--active' : ''}`}
                key={theme.id}
                style={active ? { background: theme.tint } : undefined}
                onClick={() => setHomeTheme(theme.id)}
              >
                <Reicon name={theme.icon} size={16} color={active ? '#ffffff' : '#707070'} />
                <Text>{theme.label}</Text>
              </View>
            )
          })}
        </View>
      </View>

      <TabBar tabKey='mine' />
    </View>
  )
}

export default Mine
