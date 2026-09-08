import React from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import Reicon from '../Reicon'
import { useAppStore } from '../../store/useAppStore'
import './index.scss'

/** 各主题的品牌色（与「我的-首页主题」选择器保持一致） */
export const THEME_TINTS = {
  ledger: '#2c2c2c',
  divination: '#5a4f8a',
  approval: '#2f5f9e',
}

/**
 * 每个主题一套底部导航（与首页内容联动）：
 *   ledger     首页 / 账户 / 记一笔(+ 动作按钮) / 报表 / 我的 —— 5 栏，「+」居中平衡
 *   divination 首页 / 工具 / 我的
 *   approval   首页 / 群组 / 发布(+ 动作按钮) / 记录 / 我的 —— 5 栏，「+」居中平衡
 * action: true 的项不是页面 tab，点击以 navigateTo 打开（如「记一笔」表单）。
 */
export const THEME_TABS = {
  ledger: [
    { key: 'home', text: '首页', icon: 'Home2', url: '/pages/home/index' },
    { key: 'account', text: '账户', icon: 'Wallet', url: '/pages/accounts/index' },
    { key: 'ledger-create', text: '记一笔', icon: 'Plus', url: '/pages/ledger-create/index', action: true },
    { key: 'report', text: '报表', icon: 'Chart', url: '/pages/ledger-report/index' },
    { key: 'mine', text: '我的', icon: 'User', url: '/pages/mine/index' },
  ],
  divination: [
    { key: 'home', text: '首页', icon: 'Home2', url: '/pages/home/index' },
    { key: 'tools', text: '工具', icon: 'Settings', url: '/pages/tools/index' },
    { key: 'mine', text: '我的', icon: 'User', url: '/pages/mine/index' },
  ],
  approval: [
    { key: 'home', text: '首页', icon: 'Home2', url: '/pages/home/index' },
    { key: 'group', text: '群组', icon: 'Users', url: '/pages/groups/index' },
    { key: 'approval-create', text: '发布', icon: 'Plus', url: '/pages/approval-create/index', action: true },
    { key: 'record', text: '记录', icon: 'Notebook', url: '/pages/approval/index' },
    { key: 'mine', text: '我的', icon: 'User', url: '/pages/mine/index' },
  ],
}

/**
 * 页面内底部导航栏（替代原生 tabBar，实现按主题切换导航结构）。
 * @param {string} tabKey 当前页面在导航中的 key，见 THEME_TABS；
 *   若当前页面不属于该主题的导航（如从工具页跨主题进入审批），则无高亮项，导航仍可正常切换。
 */
function TabBar({ tabKey }) {
  const homeTheme = useAppStore((state) => state.homeTheme)
  const tabs = THEME_TABS[homeTheme] || THEME_TABS.ledger
  const tint = THEME_TINTS[homeTheme] || THEME_TINTS.ledger

  const onTap = (item) => {
    if (item.key === tabKey) return
    if (item.action) {
      Taro.navigateTo({ url: item.url })
      return
    }
    Taro.redirectTo({ url: item.url })
  }

  return (
    <View className='tabbar'>
      <View className='tabbar__inner'>
        {tabs.map((item) => {
          const active = item.key === tabKey
          if (item.action) {
            return (
              <View className='tabbar__item' key={item.key} onClick={() => onTap(item)}>
                <View className='tabbar__action' style={{ background: tint }}>
                  <Reicon name={item.icon} size={22} color='#ffffff' weight='F' />
                </View>
                <Text className='tabbar__text'>{item.text}</Text>
              </View>
            )
          }
          return (
            <View className='tabbar__item' key={item.key} onClick={() => onTap(item)}>
              <Reicon name={item.icon} size={22} color={active ? tint : '#9a9a9a'} weight={active ? 'F' : 'O'} />
              <Text className={`tabbar__text ${active ? 'tabbar__text--active' : ''}`} style={active ? { color: tint } : undefined}>
                {item.text}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default TabBar
