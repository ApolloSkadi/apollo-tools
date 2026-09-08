import Taro from '@tarojs/taro'
import { API_BASE_URL, USE_MOCK, STORAGE_KEYS } from '../../config'
import { useAppStore } from '../../store/useAppStore'
import { handleMockRequest } from './mock'

function getToken() {
  try {
    return Taro.getStorageSync(STORAGE_KEYS.token) || ''
  } catch (e) {
    return ''
  }
}

/**
 * 401 时必须把两份凭证一起清掉：
 * zustand 持久化 store 里的 token（驱动页面「未登录」态与启动逻辑）
 * 和原生存储 'apollo-token'（请求层读取）。只清其一会导致
 * 「页面以为已登录、请求却无凭证」的死循环。
 */
function clearSession() {
  try {
    Taro.removeStorageSync(STORAGE_KEYS.token)
  } catch (e) { /* ignore */ }
  try {
    useAppStore.getState().clearSession()
  } catch (e) { /* ignore */ }
}

function parseBody(data) {
  if (data == null) return null
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (e) {
      return null
    }
  }
  return data
}

function handleError(statusCode, data) {
  const body = parseBody(data) || {}
  const err = new Error(body.message || '请求失败')
  err.code = body.code || statusCode
  err.statusCode = statusCode
  err.data = body
  if (statusCode === 401) clearSession()
  throw err
}

/**
 * 统一请求入口。
 * @param {object} options
 * @param {string} options.url      相对路径，如 '/groups/mine'
 * @param {'GET'|'POST'|'PATCH'|'DELETE'|'PUT'} options.method
 * @param {object} [options.data]   请求体 / 查询参数
 * @param {boolean} [options.auth=true] 是否携带 token
 * @returns {Promise<any>} 响应体（已剥离 HTTP 壳）
 */
export function request(options) {
  const { url, method = 'GET', data = {}, auth = true } = options
  const token = getToken()

  if (USE_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(handleMockRequest(method.toUpperCase(), url, data, { token }))
        } catch (err) {
          reject(err)
        }
      }, 120)
    })
  }

  const header = { 'Content-Type': 'application/json' }
  if (auth && token) header.Authorization = `Bearer ${token}`

  return Taro.request({
    url: `${API_BASE_URL}${url}`,
    method,
    data,
    header,
  }).then((res) => {
    if (res.statusCode >= 200 && res.statusCode < 300) return res.data
    handleError(res.statusCode, res.data)
  })
}

/**
 * multipart 上传单个文件（WeChat wx.uploadFile 一次仅一个文件；多图由调用方逐个上传）。
 * @param {string} url 相对路径
 * @param {object} opts { filePath, name='files', formData={}, auth=true }
 */
export function httpUpload(url, { filePath, name = 'files', formData = {}, auth = true }) {
  const token = getToken()
  const header = {}
  if (auth && token) header.Authorization = `Bearer ${token}`

  return Taro.uploadFile({
    url: `${API_BASE_URL}${url}`,
    filePath,
    name,
    formData,
    header,
  }).then((res) => {
    if (res.statusCode >= 200 && res.statusCode < 300) return parseBody(res.data)
    handleError(res.statusCode, res.data)
  })
}

export const httpGet = (url, data = {}, opts = {}) => request({ url, method: 'GET', data, ...opts })
export const httpPost = (url, data = {}, opts = {}) => request({ url, method: 'POST', data, ...opts })
export const httpPatch = (url, data = {}, opts = {}) => request({ url, method: 'PATCH', data, ...opts })
export const httpDelete = (url, data = {}, opts = {}) => request({ url, method: 'DELETE', data, ...opts })
