import React, { useEffect } from 'react'
import { useDidShow, useDidHide } from '@tarojs/taro'
// 全局样式
import './app.scss'
import { useAppStore } from './store/useAppStore'
import { silentLogin, refreshMe } from './services/auth'

function App(props) {
  // 可以使用所有的 React Hooks
  useEffect(() => {
    const initAuth = async () => {
      const { token } = useAppStore.getState()
      if (token) {
        // 本地 token 校验失败（如后端更换、mock 时代遗留）时 401 会清会话，
        // 这里兜底重新登录，避免启动后一直处于「已登录却请求 401」的状态
        const me = await refreshMe()
        if (!me) await silentLogin()
      } else {
        await silentLogin()
      }
    }
    initAuth()
  }, [])

  // 对应 onShow
  useDidShow(() => {})

  // 对应 onHide
  useDidHide(() => {})

  return props.children
}

export default App
