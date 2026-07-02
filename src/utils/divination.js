const xiaoLiuRenPalaces = [
  {
    name: '大安',
    meaning: '安稳、守成、事情有基础。',
    advice: '宜稳步推进，先确认资源与节奏，避免临时改向。',
  },
  {
    name: '留连',
    meaning: '迟滞、牵绊、进展较慢。',
    advice: '先处理沟通和遗留问题，重要决定可以放缓。',
  },
  {
    name: '速喜',
    meaning: '好消息、快反馈、适合主动争取。',
    advice: '抓紧窗口期行动，适合邀约、沟通、提交方案。',
  },
  {
    name: '赤口',
    meaning: '口舌、争执、信息有冲突。',
    advice: '少争辩，多留凭证，涉及合同和承诺要反复确认。',
  },
  {
    name: '小吉',
    meaning: '小成、小利、贵人助力。',
    advice: '适合小步试探，先拿到阶段性成果。',
  },
  {
    name: '空亡',
    meaning: '落空、变数、计划未落地。',
    advice: '检查假设是否成立，暂不重仓投入，等待更明确的信号。',
  },
]

const hourBranchNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const trigrams = {
  '111': { name: '乾', symbol: '天', note: '刚健主动' },
  '011': { name: '兑', symbol: '泽', note: '沟通悦纳' },
  '101': { name: '离', symbol: '火', note: '明辨显现' },
  '001': { name: '震', symbol: '雷', note: '启动变化' },
  '110': { name: '巽', symbol: '风', note: '渗透推进' },
  '010': { name: '坎', symbol: '水', note: '风险与流动' },
  '100': { name: '艮', symbol: '山', note: '止步蓄势' },
  '000': { name: '坤', symbol: '地', note: '承载配合' },
}

const lineText = {
  6: '老阴',
  7: '少阳',
  8: '少阴',
  9: '老阳',
}

const getHourBranchIndex = (date) => Math.floor(((date.getHours() + 1) % 24) / 2)

const normalizeNumbers = (numbers = []) =>
  numbers
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))

export const parseDivinationNumbers = (value = '') =>
  value
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))

export const calculateXiaoLiuRen = ({ event, method, dateTime, numbers = [] }) => {
  const date = dateTime ? new Date(dateTime) : new Date()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hourIndex = getHourBranchIndex(date) + 1
  const normalizedNumbers = normalizeNumbers(numbers)
  const numberSeed = normalizedNumbers.reduce((sum, item) => sum + Math.abs(Math.trunc(item)), 0)
  const seed = method === '随机起卦'
    ? Math.floor(Math.random() * 36) + 1
    : method === '数字起卦' && numberSeed > 0
      ? numberSeed
      : month + day + hourIndex
  const palace = xiaoLiuRenPalaces[(seed - 1) % xiaoLiuRenPalaces.length]
  const formula = method === '随机起卦'
    ? `随机数 ${seed}`
    : method === '数字起卦'
      ? `${normalizedNumbers.join(' + ')} = ${seed}`
      : `${month}月 + ${day}日 + ${hourIndex}时辰`

  return {
    event: event || '未命名事件',
    method,
    dateText: `${date.getFullYear()}-${month}-${day} ${hourBranchNames[hourIndex - 1]}时`,
    formula,
    numbers: normalizedNumbers,
    ...palace,
  }
}

const toBits = (lines) => lines.map((line) => (line % 2 === 1 ? '1' : '0'))

const describeHexagram = (lines) => {
  const bits = toBits(lines)
  const lower = trigrams[bits.slice(0, 3).join('')]
  const upper = trigrams[bits.slice(3, 6).join('')]
  return {
    name: `${upper.name}${lower.name}卦`,
    text: `${upper.symbol}上${lower.symbol}下`,
    note: `${upper.note}，${lower.note}`,
  }
}

export const createRandomYao = () => {
  const coins = [0, 0, 0].map(() => (Math.random() > 0.5 ? 3 : 2))
  return coins.reduce((sum, value) => sum + value, 0)
}

export const calculateLiuYao = (lines) => {
  const normalized = lines.length === 6 ? lines : Array.from({ length: 6 }, createRandomYao)
  const changedLines = normalized.map((line, index) => (line === 6 || line === 9 ? index + 1 : null)).filter(Boolean)
  const changed = normalized.map((line) => {
    if (line === 6) return 7
    if (line === 9) return 8
    return line
  })
  const originalHexagram = describeHexagram(normalized)
  const changedHexagram = describeHexagram(changed)

  return {
    lines: normalized,
    lineLabels: normalized.map((line) => lineText[line]),
    originalHexagram,
    changedHexagram,
    changedLines,
    summary: changedLines.length
      ? `动爻在第 ${changedLines.join('、')} 爻，当前局势有变化点，宜重点观察对应的人事与时机。`
      : '无动爻，局势相对稳定，适合按既定节奏推进并持续观察外部反馈。',
  }
}
