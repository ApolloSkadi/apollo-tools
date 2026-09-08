/**
 * 「真的要吗」审批工具辅助函数
 *
 * 数据模型：
 *   ApprovalItem = {
 *     id,                // 唯一标识
 *     title,             // 物品名称
 *     price,             // 价格（数字）
 *     category,          // 分类
 *     description,       // 描述
 *     groupName,         // 审批群组名称
 *     createdAt,         // 创建时间戳
 *     members: [         // 被邀请审批的好友
 *       { id, name, status, reason, decidedAt }
 *     ],
 *     status,            // pending | approved | rejected
 *   }
 */

// 可邀请的好友池（本地模拟，无后端通讯录）
export const FRIEND_POOL = [
  { id: 'f1', name: '小雨' },
  { id: 'f2', name: '阿哲' },
  { id: 'f3', name: '楠楠' },
  { id: 'f4', name: '老陈' },
  { id: 'f5', name: '乔乔' },
  { id: 'f6', name: '大鹏' },
]

// 物品分类
export const APPROVAL_CATEGORIES = ['数码', '服饰', '家居', '美食', '出行', '其他']

// 状态文案
export const MEMBER_STATUS_TEXT = {
  pending: '待审批',
  approved: '通过',
  rejected: '驳回',
}

export const ITEM_STATUS_TEXT = {
  pending: '审批中',
  approved: '已通过',
  rejected: '已驳回',
}

// 根据好友决定推导整个物品的最终状态
// 采用「一票否决」：只要有人驳回即驳回；全部决定且无人驳回则通过；否则审批中
export function deriveItemStatus(members = []) {
  if (!members || !members.length) return 'pending'
  const decided = members.filter((m) => m.status !== 'pending')
  if (!decided.length) return 'pending'
  if (decided.some((m) => m.status === 'rejected')) return 'rejected'
  return 'approved'
}

// 计算某物品的审批统计
export function computeItemStat(item) {
  const members = item.members || []
  const decided = members.filter((m) => m.status !== 'pending')
  const approved = decided.filter((m) => m.status === 'approved').length
  const rejected = decided.filter((m) => m.status === 'rejected').length
  return {
    total: members.length,
    decided: decided.length,
    pending: members.length - decided.length,
    approved,
    rejected,
  }
}

// 计算整个板块的统计（供首页近况面板使用）
export function computeApprovalStats(items = []) {
  const total = items.length
  let approved = 0
  let rejected = 0
  let rejectedAmount = 0

  items.forEach((item) => {
    if (item.status === 'approved') {
      approved += 1
    } else if (item.status === 'rejected') {
      rejected += 1
      rejectedAmount += Number(item.price) || 0
    }
  })

  const decided = approved + rejected
  const passRate = decided ? Math.round((approved / decided) * 100) : 0
  const rejectRate = decided ? Math.round((rejected / decided) * 100) : 0

  return {
    total,
    decided,
    approved,
    rejected,
    passRate,
    rejectRate,
    rejectedAmount,
  }
}

// 格式化价格
export function formatPrice(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return '¥0'
  return `¥${num.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
}

// 格式化时间
export function formatTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (item) => `${item}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
