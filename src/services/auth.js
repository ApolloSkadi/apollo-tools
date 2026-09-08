import Taro from '@tarojs/taro'
import { apiWechatLogin, apiGetMe, apiLogout } from './api'
import { useAppStore } from '../store/useAppStore'

export async function silentLogin() {
  try {
    const { code } = await Taro.login()
    const res = await apiWechatLogin(code)
    useAppStore.getState().setSession(res)
    return res.user
  } catch (e) {
    return null
  }
}

export async function refreshMe() {
  try {
    const { user } = await apiGetMe()
    useAppStore.getState().setUser(user)
    return user
  } catch (e) {
    return null
  }
}

export async function logout() {
  try {
    await apiLogout()
  } catch (e) { /* ignore */ }
  useAppStore.getState().clearSession()
}

export const isLoggedIn = () => Boolean(useAppStore.getState().token)

/**
 * 确保存在可用会话：无 token 时静默登录。
 * 页面拉数据前调用，避免「进页面时登录还没完成」或「token 已失效被清」
 * 导致的 401 空转。
 */
export async function ensureSession() {
  if (useAppStore.getState().token) return true
  return Boolean(await silentLogin())
}
