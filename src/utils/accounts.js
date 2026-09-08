/**
 * 账户（钱包）辅助函数 —— 记账板块的「账户」页。
 *
 * 账户模型（本地存储，与账本一致）：
 *   Account  = { id, name, type, initial, createdAt }
 *   Transfer = { id, fromId, toId, amount, createdAt }
 *
 * 余额推导：
 *   balance = 初始余额 + Σ(该账户收入) − Σ(该账户支出) − Σ(转出) + Σ(转入)
 *   扣款/入账通过 ledger record 的 accountId 关联；转账单独记录，不计入收支统计。
 */

export const ACCOUNT_TYPES = [
  { id: 'cash', label: '现金', icon: 'WalletMoney', color: '#2f8a5b' },
  { id: 'wechat', label: '微信', icon: 'MoneyRecive', color: '#2f8a5b' },
  { id: 'alipay', label: '支付宝', icon: 'Money', color: '#4a7cf0' },
  { id: 'card', label: '银行卡', icon: 'Safe', color: '#2f5f9e' },
  { id: 'other', label: '其他', icon: 'Wallet', color: '#8a8a8a' },
]

export const accountTypeMeta = (typeId) =>
  ACCOUNT_TYPES.find((t) => t.id === typeId) || ACCOUNT_TYPES[ACCOUNT_TYPES.length - 1]

/** 单个账户当前余额 */
export function accountBalance(account, records = [], transfers = []) {
  let balance = Number(account.initial) || 0
  records.forEach((r) => {
    if (r.accountId !== account.id) return
    balance += r.type === 'income' ? Number(r.amount) || 0 : -(Number(r.amount) || 0)
  })
  transfers.forEach((t) => {
    const amount = Number(t.amount) || 0
    if (t.fromId === account.id) balance -= amount
    if (t.toId === account.id) balance += amount
  })
  return Math.round(balance * 100) / 100
}

/** 总资产：所有账户余额之和 */
export function totalAssets(accounts, records, transfers) {
  return accounts.reduce(
    (sum, a) => sum + accountBalance(a, records, transfers),
    0
  )
}

/** 某账户名下是否还有账目（用于删除前校验提示） */
export function accountHasRecords(accountId, records = []) {
  return records.some((r) => r.accountId === accountId)
}
