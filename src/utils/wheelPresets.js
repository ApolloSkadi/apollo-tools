export const defaultWheelOptions = [
  { id: '1', label: '选项 A', weight: 1 },
  { id: '2', label: '选项 B', weight: 1 },
  { id: '3', label: '选项 C', weight: 1 },
]

export const defaultWheelPresetGroups = [
  {
    id: 'default-choices',
    name: '默认选项',
    options: defaultWheelOptions,
  },
  {
    id: 'default-foods',
    name: '今天吃什么',
    options: [
      '米饭套餐',
      '盖浇饭',
      '黄焖鸡米饭',
      '卤肉饭',
      '咖喱饭',
      '鸡排饭',
      '照烧鸡饭',
      '烧腊饭',
      '叉烧饭',
      '煲仔饭',
      '炒饭',
      '蛋炒饭',
      '扬州炒饭',
      '牛肉炒饭',
      '炒面',
      '拌面',
      '油泼面',
      '炸酱面',
      '热干面',
      '重庆小面',
      '兰州拉面',
      '牛肉面',
      '刀削面',
      '臊子面',
      '酸辣粉',
      '螺蛳粉',
      '米线',
      '过桥米线',
      '桂林米粉',
      '肠粉',
      '河粉',
      '汤粉',
      '馄饨',
      '饺子',
      '煎饺',
      '锅贴',
      '小笼包',
      '生煎包',
      '包子',
      '馒头夹菜',
      '肉夹馍',
      '煎饼果子',
      '手抓饼',
      '鸡蛋灌饼',
      '葱油饼',
      '麻辣烫',
      '麻辣香锅',
      '冒菜',
      '火锅',
      '串串香',
      '烧烤',
      '烤鱼',
      '纸包鱼',
      '酸菜鱼',
      '水煮鱼',
      '水煮肉片',
      '毛血旺',
      '宫保鸡丁',
      '鱼香肉丝',
      '回锅肉',
      '小炒肉',
      '辣椒炒肉',
      '番茄炒蛋',
      '地三鲜',
      '麻婆豆腐',
      '红烧肉',
      '糖醋里脊',
      '可乐鸡翅',
      '清蒸鱼',
      '白切鸡',
      '沙县小吃',
      '云吞面',
      '粥',
      '皮蛋瘦肉粥',
      '砂锅粥',
      '汤饭',
      '羊肉泡馍',
      '胡辣汤',
      '汉堡',
      '炸鸡',
      '披萨',
      '意面',
      '牛排',
      '三明治',
      '沙拉',
      '寿司',
      '日式拉面',
      '乌冬面',
      '日式便当',
      '韩式拌饭',
      '部队锅',
      '泡菜汤',
      '泰式炒河粉',
      '冬阴功汤',
      '越南粉',
      '印度咖喱',
      '墨西哥卷饼',
      '轻食碗',
      '烤肉饭',
      '铁板烧',
      '东北炖菜',
      '新疆大盘鸡',
      '羊肉串',
      '凉皮',
      '凉面',
      '关东煮',
      '便利店便当',
    ].map((label, index) => ({ id: `food-${index + 1}`, label, weight: 1 })),
  },
]

const createId = (prefix = 'preset') => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`

export const normalizeWheelOptions = (options = []) =>
  options
    .map((item, index) => ({
      id: `${item.id || createId(`option-${index}`)}`,
      label: `${item.label || item.name || item.title || ''}`.trim(),
      weight: Math.max(0, Number(item.weight ?? item.value ?? 1) || 0),
    }))
    .filter((item) => item.label && item.weight > 0)

export const createWheelPresetGroup = (name, options) => ({
  id: createId('wheel-preset'),
  name: `${name || '未命名预设组'}`.trim() || '未命名预设组',
  options: normalizeWheelOptions(options),
})

export const parseWheelPresetGroups = (text) => {
  const data = JSON.parse(text)
  const source = Array.isArray(data) ? data : [data]

  if (source.every((item) => item && !item.options && (item.label || item.name || item.title))) {
    return [createWheelPresetGroup('导入预设组', source)]
  }

  return source
    .map((item, index) => createWheelPresetGroup(item.name || item.title || `导入预设组 ${index + 1}`, item.options || []))
    .filter((item) => item.options.length)
}

export const stringifyWheelPresetGroup = (group) =>
  JSON.stringify(
    {
      name: group.name,
      options: group.options.map(({ label, weight }) => ({ label, weight })),
    },
    null,
    2
  )
