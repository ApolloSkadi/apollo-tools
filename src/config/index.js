/**
 * 全局配置。
 *
 * 接口主地址 / Mock 开关等环境相关配置全部提取到项目根目录的 .env 系列文件：
 *   .env                所有环境的默认值（本地开发）
 *   .env.development    开发构建（--watch）覆盖
 *   .env.production     发布构建覆盖 —— 上线前改成已备案的 HTTPS 域名即可
 * 变量必须使用 TARO_APP_ 前缀（Taro 构建时注入 process.env）。
 */
// 后端：apollo-miniweb/server（根路径 /api/v1）。
export const API_BASE_URL = process.env.TARO_APP_API_BASE_URL || 'http://localhost:8080/api/v1'

// true 时走本地 Mock（无网络请求）；生产构建强制关闭，避免误打包 Mock 模式。
export const USE_MOCK = process.env.NODE_ENV !== 'production' && process.env.TARO_APP_USE_MOCK === 'true'

export const STORAGE_KEYS = {
  token: 'apollo-token',
  user: 'apollo-user',
  mockDb: 'apollo-mock-db',
}
