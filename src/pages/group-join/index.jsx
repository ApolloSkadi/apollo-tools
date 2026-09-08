import React, { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { Input, View, Text } from '@tarojs/components'
import { useAppStore } from '../../store/useAppStore'
import { apiGroupByCode, apiJoinGroup, apiMyGroups } from '../../services/api'
import { silentLogin, refreshMe } from '../../services/auth'
import './index.scss'

function GroupJoin() {
  const router = Taro.useRouter()
  const setMyGroups = useAppStore((state) => state.setMyGroups)
  const [codeInput, setCodeInput] = useState('')
  const [preview, setPreview] = useState(null)
  const [joining, setJoining] = useState(false)

  const ensureLogin = async () => {
    const { token } = useAppStore.getState()
    if (token) {
      refreshMe()
      return true
    }
    const u = await silentLogin()
    return Boolean(u)
  }

  const join = async (code) => {
    const c = code.trim().toUpperCase()
    if (!c) {
      Taro.showToast({ title: '请输入群组码', icon: 'none' })
      return
    }
    setJoining(true)
    try {
      const ok = await ensureLogin()
      if (!ok) {
        Taro.showToast({ title: '加入前请先登录', icon: 'none' })
        setJoining(false)
        return
      }
      const byCode = await apiGroupByCode(c)
      setPreview(byCode.group)
      await apiJoinGroup(c)
      const { groups } = await apiMyGroups()
      setMyGroups(groups)
      Taro.showToast({ title: '已加入群组', icon: 'success' })
      // 邀请链接加入 / 手动加入成功后，都回到首页
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (e) {
      Taro.showToast({ title: e.message || '加入失败', icon: 'none' })
      setJoining(false)
      // 已加入过该群组：同样视为「已在群内」，回到首页
      if (e.code === 409) Taro.switchTab({ url: '/pages/home/index' })
    }
  }

  useEffect(() => {
    const code = (router.params && router.params.groupCode) || ''
    if (code) {
      setCodeInput(code)
      join(code)
    } else {
      setJoining(false)
    }
  }, [router.params])

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>加入群组</View>
        <View className='subtitle'>输入好友分享的群组码，或直接点开分享链接自动加入。</View>
      </View>

      {preview && (
        <View className='join-preview'>
          <View className='join-preview__label'>即将加入</View>
          <View className='join-preview__name'>{preview.name}</View>
          <View className='join-preview__code'>{preview.code}</View>
        </View>
      )}

      <View className='panel'>
        <View className='field'>
          <View className='label'>群组码</View>
          <Input
            className='input'
            value={codeInput}
            maxlength='6'
            placeholder='输入 6 位群组码'
            onInput={(e) => setCodeInput(e.detail.value)}
          />
        </View>
      </View>

      <View className='join-submit' onClick={() => join(codeInput)}>
        {joining ? '加入中…' : '加入群组'}
      </View>
    </View>
  )
}

export default GroupJoin
