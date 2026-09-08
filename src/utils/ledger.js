/**
 * 记账 (Ledger) domain helpers.
 *
 * A ledger record:
 *   {
 *     id,             // unique id
 *     type,           // 'expense' | 'income'
 *     category,       // category id, e.g. 'food'
 *     icon,           // Reicon icon name, e.g. 'ForkKnife'
 *     color,          // icon tint, e.g. '#E78A5A'
 *     title,          // short title
 *     note,           // optional note
 *     amount,         // number
 *     createdAt,      // timestamp
 *   }
 */

export const LEDGER_COLORS = [
  '#E78A5A', '#D24A4A', '#E06A93', '#B56AE8', '#8A6DE8', '#4A7CF0',
  '#3FA4C8', '#3FA47C', '#5A9E6F', '#C58A3C', '#8A8A8A', '#2C2C2C',
]

// Expense categories. Each carries a default Reicon icon + tint.
export const LEDGER_EXPENSE_CATEGORIES = [
  { id: 'food', label: '餐饮', icon: 'ForkKnife', color: '#E78A5A' },
  { id: 'coffee', label: '饮品', icon: 'Coffee', color: '#B5824C' },
  { id: 'transport', label: '交通', icon: 'Bus', color: '#4A7CF0' },
  { id: 'shopping', label: '购物', icon: 'BagShopping', color: '#E06A93' },
  { id: 'medical', label: '医疗', icon: 'MedicalKit', color: '#3FA47C' },
  { id: 'entertainment', label: '娱乐', icon: 'Gamepad', color: '#9A6DE8' },
  { id: 'household', label: '居家', icon: 'Home2', color: '#5A9E6F' },
  { id: 'education', label: '学习', icon: 'Book', color: '#C58A3C' },
  { id: 'phone', label: '通讯', icon: 'Phone', color: '#5A7DE8' },
  { id: 'other', label: '其他', icon: 'More', color: '#8A8A8A' },
]

// Income categories.
export const LEDGER_INCOME_CATEGORIES = [
  { id: 'salary', label: '工资', icon: 'Bill', color: '#2F8A5B' },
  { id: 'bonus', label: '奖金', icon: 'WalletAdd', color: '#E06A93' },
  { id: 'invest', label: '理财', icon: 'Chart', color: '#4A7CF0' },
  { id: 'refund', label: '退款', icon: 'MoneyRecive', color: '#3FA47C' },
  { id: 'redpacket', label: '红包', icon: 'Gift', color: '#D24A4A' },
  { id: 'other', label: '其他', icon: 'Wallet', color: '#8A8A8A' },
]

export const LEDGER_ALL_CATEGORIES = [
  ...LEDGER_EXPENSE_CATEGORIES,
  ...LEDGER_INCOME_CATEGORIES,
]

// Curated Reicon icon picker (the "choose an icon" grid when recording).
export const LEDGER_ICON_PALETTE = [
  'ForkKnife', 'Coffee', 'TeaCup', 'PizzaSlice', 'Cake', 'Gift',
  'Bus', 'Car', 'ShoppingCart', 'BagShopping',
  'MedicalKit', 'Pill', 'Stethoscope', 'HeartPulse',
  'Gamepad', 'Music', 'Film', 'Headphones',
  'Home2', 'Bed', 'Sofa', 'Book', 'GraduationCap', 'Notebook',
  'Bill', 'WalletAdd', 'Chart', 'TrendUp', 'MoneyRecive', 'Money',
  'Dollar', 'Safe', 'Wallet', 'Sparkle', 'Star', 'Heart',
  'GemSparkle', 'MagicWand', 'Phone', 'Computer', 'Tv', 'Moon',
]

const EXPENSE_CATEGORY_MAP = LEDGER_EXPENSE_CATEGORIES.reduce((map, it) => {
  map[it.id] = it
  return map
}, {})
const INCOME_CATEGORY_MAP = LEDGER_INCOME_CATEGORIES.reduce((map, it) => {
  map[it.id] = it
  return map
}, {})

const pad2 = (n) => `${n}`.padStart(2, '0')

export function dateKeyOf(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function monthKeyOf(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

export function categoryMeta(categoryId, type = 'expense') {
  const map = type === 'income' ? INCOME_CATEGORY_MAP : EXPENSE_CATEGORY_MAP
  const found = map[categoryId]
  if (found) return found
  return type === 'income'
    ? { id: 'other', label: '其他', icon: 'Wallet', color: '#8A8A8A' }
    : { id: 'other', label: '其他', icon: 'More', color: '#8A8A8A' }
}

export function formatMoney(value, withSign = false) {
  const num = Number(value) || 0
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  const fixed = abs.toFixed(2)
  const [intPart, decimal] = fixed.split('.')
  const intGrouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const prefix = withSign ? (num > 0 ? '+' : num < 0 ? '-' : '') : sign
  return `${prefix}¥${intGrouped}${decimal ? `.${decimal}` : ''}`
}

export function sumAmount(records, type) {
  return records
    .filter((r) => (type ? r.type === type : true))
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
}

// Group records into a map: dateKey -> { expense, income, records[] }
export function groupByDate(records) {
  const map = {}
  records.forEach((r) => {
    const key = dateKeyOf(r.createdAt)
    if (!map[key]) map[key] = { expense: 0, income: 0, records: [] }
    const bucket = map[key]
    const amount = Number(r.amount) || 0
    if (r.type === 'income') bucket.income += amount
    else bucket.expense += amount
    bucket.records.push(r)
  })
  const keys = Object.keys(map).sort()
  return keys.map((key) => ({ key, ...map[key] }))
}

export function recordsInMonth(records, monthTs) {
  const mk = monthKeyOf(monthTs)
  return records.filter((r) => monthKeyOf(r.createdAt) === mk)
}

export function shiftMonth(ts, delta) {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth() + delta, 1).getTime()
}

// Per-category totals for a given month.
export function categoryTotalsInMonth(records, monthTs) {
  const mk = monthKeyOf(monthTs)
  const totals = {}
  records.forEach((r) => {
    if (monthKeyOf(r.createdAt) !== mk) return
    const amount = Number(r.amount) || 0
    if (!totals[r.category]) totals[r.category] = 0
    totals[r.category] += amount
  })
  return totals
}

/**
 * Category period-over-period (环比) for a given month vs the previous month.
 * Returns rows sorted by current-amount descending.
 */
export function computeCategoryMom(records, monthTs, type = 'expense') {
  const current = categoryTotalsInMonth(records, monthTs)
  const prev = categoryTotalsInMonth(records, shiftMonth(monthTs, -1))
  const pool = type === 'income' ? LEDGER_INCOME_CATEGORIES : LEDGER_EXPENSE_CATEGORIES
  const rows = []

  pool.forEach((meta) => {
    const cur = current[meta.id] || 0
    const prevVal = prev[meta.id] || 0
    rows.push({
      ...meta,
      current: cur,
      prev: prevVal,
      diff: cur - prevVal,
      pct: prevVal > 0 ? Math.round(((cur - prevVal) / prevVal) * 100) : (cur > 0 ? 100 : 0),
    })
  })

  rows.sort((a, b) => b.current - a.current)
  return rows
}

export function monthSummary(records, monthTs) {
  const list = recordsInMonth(records, monthTs)
  const expense = sumAmount(list, 'expense')
  const income = sumAmount(list, 'income')
  const net = income - expense
  const prev = recordsInMonth(records, shiftMonth(monthTs, -1))
  const prevExpense = sumAmount(prev, 'expense')
  return {
    expense,
    income,
    net,
    count: list.length,
    expenseMom: prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : (expense > 0 ? 100 : 0),
  }
}

// Build an ordered date axis for a range (inclusive of end).
export function dateRangeKeys(startTs, endTs) {
  const keys = []
  const d = new Date(startTs)
  d.setHours(0, 0, 0, 0)
  const end = new Date(endTs)
  end.setHours(0, 0, 0, 0)
  while (d.getTime() <= end.getTime()) {
    keys.push(dateKeyOf(d.getTime()))
    d.setDate(d.getDate() + 1)
  }
  return keys
}

// Series for the trend chart: per-day expense/income over a date range.
export function buildDailySeries(records, startTs, endTs) {
  const grouped = new Map()
  records.forEach((r) => {
    const key = dateKeyOf(r.createdAt)
    if (!grouped.has(key)) grouped.set(key, { expense: 0, income: 0 })
    const bucket = grouped.get(key)
    if (r.type === 'income') bucket.income += Number(r.amount) || 0
    else bucket.expense += Number(r.amount) || 0
  })
  return dateRangeKeys(startTs, endTs).map((key) => {
    const bucket = grouped.get(key) || { expense: 0, income: 0 }
    return { key, ...bucket }
  })
}

export const monthLabel = (ts) => {
  const d = new Date(ts)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
}

export const weekdayLabel = (key) => {
  const d = new Date(`${key}T00:00:00`)
  const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getDate()}日 周${wd}`
}

const DAY = 86400000

const startOfDayTs = (ts) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const endOfDayTs = (ts) => {
  const d = new Date(ts)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/**
 * Resolve a report time-range preset to concrete start / end timestamps,
 * plus an "equal-length immediately-before" window used for 环比 (MoM).
 *
 * @param {'week'|'month'|'year'|'7d'|'30d'|'custom'} preset
 * @param {string} customStartKey   YYYY-MM-DD (custom only)
 * @param {string} customEndKey     YYYY-MM-DD (custom only)
 * @param {number} now
 */
export function resolveRange(preset, customStartKey, customEndKey, now = Date.now()) {
  const nowDate = new Date(now)
  let start = now
  let end = now

  if (preset === 'week') {
    const day = nowDate.getDay()
    const diff = day === 0 ? 6 : day - 1
    start = startOfDayTs(now - diff * DAY)
    end = endOfDayTs(now)
  } else if (preset === 'month') {
    start = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime()
    end = endOfDayTs(now)
  } else if (preset === 'year') {
    start = new Date(nowDate.getFullYear(), 0, 1).getTime()
    end = endOfDayTs(now)
  } else if (preset === '7d') {
    start = startOfDayTs(now - 6 * DAY)
    end = endOfDayTs(now)
  } else if (preset === '30d') {
    start = startOfDayTs(now - 29 * DAY)
    end = endOfDayTs(now)
  } else {
    // custom
    start = startOfDayTs(new Date(`${customStartKey}T00:00:00`).getTime())
    end = endOfDayTs(new Date(`${customEndKey}T23:59:59`).getTime())
    if (start > end) {
      const tmp = start
      start = end
      end = tmp
    }
  }

  const len = end - start
  const prevStart = start - len
  const prevEnd = start - 1
  return { start, end, prevStart, prevEnd }
}

export function recordsInRange(records, startTs, endTs) {
  return records.filter((r) => r.createdAt >= startTs && r.createdAt <= endTs)
}

export function categoryTotalsInRange(records, startTs, endTs, type) {
  const totals = {}
  recordsInRange(records, startTs, endTs).forEach((r) => {
    if (type && r.type !== type) return
    totals[r.category] = (totals[r.category] || 0) + (Number(r.amount) || 0)
  })
  return totals
}

export function computeRangeMom(records, startTs, endTs, type) {
  const pool = type === 'income' ? LEDGER_INCOME_CATEGORIES : LEDGER_EXPENSE_CATEGORIES
  const current = categoryTotalsInRange(records, startTs, endTs, type)
  const prevStart = startTs - (endTs - startTs)
  const prevEnd = startTs - 1
  const prevTotals = categoryTotalsInRange(records, prevStart, prevEnd, type)

  return pool
    .map((meta) => {
      const cur = current[meta.id] || 0
      const prevVal = prevTotals[meta.id] || 0
      return {
        ...meta,
        current: cur,
        prev: prevVal,
        diff: cur - prevVal,
        pct: prevVal > 0 ? Math.round(((cur - prevVal) / prevVal) * 100) : (cur > 0 ? 100 : 0),
      }
    })
    .sort((a, b) => b.current - a.current)
}

// Total per day within a range, grouped (most recent first).
export function daysInRange(records, startTs, endTs) {
  const grouped = new Map()
  recordsInRange(records, startTs, endTs).forEach((r) => {
    const key = dateKeyOf(r.createdAt)
    if (!grouped.has(key)) grouped.set(key, { expense: 0, income: 0, records: [] })
    const bucket = grouped.get(key)
    if (r.type === 'income') bucket.income += Number(r.amount) || 0
    else bucket.expense += Number(r.amount) || 0
    bucket.records.push(r)
  })
  return Array.from(grouped.entries())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => (a.key < b.key ? 1 : -1))
}

export function rangeSummary(records, startTs, endTs) {
  const list = recordsInRange(records, startTs, endTs)
  const expense = sumAmount(list, 'expense')
  const income = sumAmount(list, 'income')
  const activeDays = new Set(list.map((r) => dateKeyOf(r.createdAt))).size
  return {
    expense,
    income,
    net: income - expense,
    count: list.length,
    activeDays,
    avg: activeDays ? expense / activeDays : 0,
  }
}

export function rangeLabel(startTs, endTs) {
  const s = dateKeyOf(startTs)
  const e = dateKeyOf(endTs)
  if (s === e) return weekdayLabel(s)
  return `${s.slice(5).replace('-', '月')}日 - ${e.slice(5).replace('-', '月')}日`
}
