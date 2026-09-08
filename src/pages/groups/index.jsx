import React, { useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import TabBar from '../../components/TabBar'
import { useAppStore } from '../../store/useAppStore'
import { apiMyGroups } from '../../services/api'
import { silentLogin } from '../../services/auth'
import './index.scss'

/** 审批主题的「群组」Tab：我的群组列表 + 创建/加入入口 */
function Groups() {
  const token = useAppStore((state) => state.token)
  const myGroups = useAppStore((state) => state.myGroups)
  const setMyGroups = useAppStore((state) => state.setMyGroups)

  const loadGroups = async () => {
    try {
      const { groups } = await apiMyGroups()
      setMyGroups(groups)
    } catch (e) { /* 未登录等场景静默 */ }
  }

  useDidShow(() => {
    if (token) loadGroups()
  })

  useEffect(() => {
    if (token) loadGroups()
  }, [token])

  const goCreate = () => Taro.navigateTo({ url: '/pages/group-create/index' })
  const goJoin = () => Taro.navigateTo({ url: '/pages/group-join/index' })

  return (
    <View className='page page--with-tabbar'>
      <View className='hero'>
        <View className='title'>群组</View>
        <View className='subtitle'>建一个群或用群组码加入，把想买的东西发进来一起审批。</View>
      </View>

      <View className='groups-quick'>
        <View className='groups-quick__item' onClick={goCreate}>
          <View className='groups-quick__icon'>
            <Reicon name='Plus' size={16} color='#2f5f9e' />
          </View>
          <Text>创建群组</Text>
        </View>
        <View className='groups-quick__item' onClick={goJoin}>
          <View className='groups-quick__icon'>
            <Reicon name='Users' size={16} color='#2f5f9e' />
          </View>
          <Text>群组码加入</Text>
        </View>
      </View>

      <View className='section-title'>我加入的群组</View>
      {myGroups.length ? (
        myGroups.map((g) => (
          <View
            className='groups-item'
            key={g.id}
            onClick={() => Taro.navigateTo({ url: `/pages/group/index?groupId=${g.id}` })}
          >
            <View className='groups-item__icon'>
              <Reicon name='Users' size={17} color='#2f5f9e' />
            </View>
            <View className='groups-item__body'>
              <View className='groups-item__name'>{g.name}</View>
              <View className='groups-item__meta'>
                {g.memberCount} 人 · 群主 {g.ownerName || '—'} · 群码 {g.code}
              </View>
            </View>
            <View className='groups-item__arrow'>›</View>
          </View>
        ))
      ) : (
        <View className='empty-state'>
          {token ? '还没有加入群组，先创建一个或输入群组码加入。' : '登录后即可创建或加入群组。'}
        </View>
      )}

      <View className='groups-hint'>在群组详情页可以复制群组码、分享给微信好友，好友点开即可自动加入。</View>

      <TabBar tabKey='group' />
    </View>
  )
}

export default Groups
