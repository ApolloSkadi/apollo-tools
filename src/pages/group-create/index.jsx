import React, { useState } from 'react'
import Taro from '@tarojs/taro'
import { Input, Textarea, View, Text } from '@tarojs/components'
import { useAppStore } from '../../store/useAppStore'
import { apiCreateGroup, apiMyGroups } from '../../services/api'
import { silentLogin } from '../../services/auth'
import './index.scss'

function GroupCreate() {
  const setMyGroups = useAppStore((state) => state.setMyGroups)
  const [name, setName] = useState('')
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(false)

  const refreshGroups = async () => {
    try {
      const { groups } = await apiMyGroups()
      setMyGroups(groups)
    } catch (e) { /* ignore */ }
  }

  const submit = async () => {
    const n = name.trim()
    if (!n) {
      Taro.showToast({ title: '请输入群组名称', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      if (!useAppStore.getState().token) {
        const u = await silentLogin()
        if (!u) {
          Taro.showToast({ title: '请先登录', icon: 'none' })
          setLoading(false)
          return
        }
      }
      const { group } = await apiCreateGroup({ name: n, remark: remark.trim() })
      await refreshGroups()
      Taro.showToast({ title: '已创建', icon: 'success' })
      Taro.redirectTo({ url: `/pages/group/index?groupId=${group.id}` })
    } catch (e) {
      Taro.showToast({ title: e.message || '创建失败', icon: 'none' })
      setLoading(false)
    }
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>创建群组</View>
        <View className='subtitle'>建一个群，把想买的东西发进来，让好友一起投票。</View>
      </View>

      <View className='panel'>
        <View className='field'>
          <View className='label'>群组名称</View>
          <Input
            className='input'
            value={name}
            placeholder='例如：买不买帮帮团'
            onInput={(e) => setName(e.detail.value)}
          />
        </View>
        <View className='field'>
          <View className='label'>群组简介</View>
          <Textarea
            className='textarea'
            value={remark}
            placeholder='选填，简单说明这个群用来干嘛'
            onInput={(e) => setRemark(e.detail.value)}
          />
        </View>
      </View>

      <View className='group-create__submit' onClick={submit}>
        <Text>{loading ? '创建中…' : '创建群组'}</Text>
      </View>
    </View>
  )
}

export default GroupCreate
