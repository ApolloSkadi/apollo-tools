import React, { useMemo, useState } from 'react'
import { View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import './index.scss'

const historyTypes = {
  wheel: '转盘',
  xiaoliuren: '小六壬',
  liuyao: '六爻',
  tarot: '今日运势',
}

const formatTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (item) => `${item}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const getDetailRows = (record) => {
  const payload = record.payload || {}
  const rows = [
    ['类型', historyTypes[record.type] || record.type],
    ['标题', record.title],
    ['时间', formatTime(record.createdAt)],
  ]

  if (record.type === 'xiaoliuren' && payload.name) {
    rows.push(
      ['事件', payload.event],
      ['方式', payload.method],
      ['起卦时间', payload.dateText],
      ['计算', payload.formula],
      ['卦象', payload.name],
      ['解释', payload.meaning],
      ['建议', payload.advice]
    )
  } else if (record.type === 'tarot' && payload.past) {
    rows.push(
      ['过去牌', payload.past.name],
      ['现在牌', payload.present.name],
      ['未来牌', payload.future.name],
      ['解读', record.detail]
    )
  } else {
    rows.push(['详情', record.detail])
  }

  return rows.filter(([, value]) => value !== undefined && value !== '')
}

function History() {
  const histories = useAppStore((state) => state.histories)
  const clearHistory = useAppStore((state) => state.clearHistory)
  const [selected, setSelected] = useState(null)
  const records = useMemo(
    () =>
      Object.keys(histories)
        .flatMap((type) => histories[type].map((item) => ({ ...item, type })))
        .sort((a, b) => b.createdAt - a.createdAt),
    [histories]
  )

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>历史</View>
        <View className='subtitle'>按时间保存每一次工具结果，点击记录可以查看详情。</View>
      </View>

      <View className='panel'>
        <View className='result-title'>{records.length} 条记录</View>
        <View className='result-text'>转盘 {histories.wheel.length} 条，小六壬 {histories.xiaoliuren.length} 条，六爻 {histories.liuyao.length} 条，今日运势 {histories.tarot.length} 条。</View>
        <View className='mine-actions'>
          <Button type='danger' fill='outline' onClick={() => clearHistory()}>清空全部历史</Button>
        </View>
      </View>

      <View className='section-title'>全部记录</View>
      {records.length ? (
        records.map((record) => (
          <View className='history-item history-item--clickable' key={`${record.type}-${record.id}`} onClick={() => setSelected(record)}>
            <View className='history-item__top'>
              <View className='history-item__badge'>{historyTypes[record.type] || record.type}</View>
              <View className='history-item__meta'>{formatTime(record.createdAt)}</View>
            </View>
            <View className='history-item__title'>{record.title}</View>
            <View className='history-item__meta'>{record.detail}</View>
          </View>
        ))
      ) : (
        <View className='empty-state'>暂无历史记录</View>
      )}

      {selected && (
        <View className='detail-mask' onClick={() => setSelected(null)}>
          <View className='detail-panel' onClick={(event) => event.stopPropagation()}>
            <View className='detail-header'>
              <View className='detail-title'>记录详情</View>
              <View className='detail-close' onClick={() => setSelected(null)}>×</View>
            </View>
            {getDetailRows(selected).map(([label, value]) => (
              <View className='detail-row' key={label}>
                <View className='detail-label'>{label}</View>
                <View className='detail-value'>{value}</View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

export default History
