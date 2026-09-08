import React, { useState } from 'react'
import Taro from '@tarojs/taro'
import { Input, Image, View, Text } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import { useAppStore } from '../../store/useAppStore'
import { apiUpdateMe } from '../../services/api'
import { silentLogin, logout } from '../../services/auth'
import './index.scss'

function Profile() {
  const user = useAppStore((state) => state.user)
  const setUser = useAppStore((state) => state.setUser)
  const [nickname, setNickname] = useState(user ? user.nickname : '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const name = nickname.trim()
    if (!name) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const { user: next } = await apiUpdateMe({ nickname: name })
      setUser(next)
      Taro.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      Taro.showToast({ title: e.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const doLogin = async () => {
    const u = await silentLogin()
    if (u) setNickname(u.nickname)
    else Taro.showToast({ title: '登录失败', icon: 'none' })
  }

  const doLogout = async () => {
    await logout()
    setNickname('')
    Taro.showToast({ title: '已退出', icon: 'none' })
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>个人信息</View>
        <View className='subtitle'>维护你的昵称和头像，这些信息会在群组与审批中展示。</View>
      </View>

      {!user ? (
        <View className='panel'>
          <View className='empty-state'>尚未登录</View>
          <View className='profile-login' onClick={doLogin}>
            <Reicon name='User' size={16} color='#ffffff' />
            <Text>微信登录</Text>
          </View>
        </View>
      ) : (
        <View className='panel'>
          <View className='field'>
            <View className='label'>头像</View>
            <View className='profile-avatar'>
              {user.avatar ? (
                <Image className='profile-avatar__img' src={user.avatar} mode='aspectFill' />
              ) : (
                <View className='profile-avatar__fallback'>{user.nickname ? user.nickname.slice(0, 1) : '?'}</View>
              )}
            </View>
          </View>
          <View className='field'>
            <View className='label'>昵称</View>
            <Input
              className='input'
              value={nickname}
              maxlength='16'
              placeholder='请输入昵称'
              onInput={(e) => setNickname(e.detail.value)}
            />
          </View>
          <View className='profile-actions'>
            <View className='profile-btn profile-btn--primary' onClick={save}>{saving ? '保存中…' : '保存'}</View>
            <View className='profile-btn profile-btn--ghost' onClick={doLogout}>退出登录</View>
          </View>
        </View>
      )}
    </View>
  )
}

export default Profile
