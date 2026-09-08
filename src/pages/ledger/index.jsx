import React, { useMemo } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import { useAppStore } from '../../store/useAppStore'
import {
  categoryMeta,
  dateKeyOf,
  formatMoney,
  monthLabel,
  monthSummary,
} from '../../utils/ledger'
import './index.scss'

const formatTime = (value) => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Ledger() {
  const ledgerRecords = useAppStore((state) => state.ledgerRecords)
  const removeLedgerRecord = useAppStore((state) => state.removeLedgerRecord)

  const now = Date.now()
  const summary = useMemo(() => monthSummary(ledgerRecords, now), [ledgerRecords, now])
  const recent = useMemo(() => ledgerRecords.slice(0, 50), [ledgerRecords])

  const goCreate = () => Taro.navigateTo({ url: '/pages/ledger-create/index' })
  const goReport = () => Taro.navigateTo({ url: '/pages/ledger-report/index' })

  const onLongPress = (record) => {
    Taro.showModal({
      title: '删除记录',
      content: `删除「${record.title}」这笔记录？`,
      confirmColor: '#C1406F',
      success: (res) => {
        if (res.confirm) {
          removeLedgerRecord(record.id)
          Taro.showToast({ title: '已删除', icon: 'none' })
        }
      },
    })
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>记账</View>
        <View className='subtitle'>每一笔都在本机，看看钱的来龙去脉。</View>
      </View>

      {/* Monthly summary */}
      <View className='ledger-summary'>
        <View className='ledger-summary__top'>
          <View className='ledger-summary__month'>{monthLabel(now)}</View>
          <View
            className={`ledger-summary__mom ${summary.expenseMom > 0 ? 'ledger-summary__mom--up' : 'ledger-summary__mom--down'}`}
          >
            {summary.expenseMom > 0 ? '+' : ''}{summary.expenseMom}% 环比
          </View>
        </View>
        <View className='ledger-summary__grid'>
          <View className='ledger-summary__item'>
            <View className='ledger-summary__num'>{formatMoney(summary.income)}</View>
            <View className='ledger-summary__label'>收入</View>
          </View>
          <View className='ledger-summary__item'>
            <View className='ledger-summary__num ledger-summary__num--expense'>{formatMoney(summary.expense)}</View>
            <View className='ledger-summary__label'>支出</View>
          </View>
          <View className='ledger-summary__item'>
            <View className={`ledger-summary__num ${summary.net >= 0 ? '' : 'ledger-summary__num--expense'}`}>
              {formatMoney(summary.net, true)}
            </View>
            <View className='ledger-summary__label'>结余</View>
          </View>
        </View>
        <View className='ledger-summary__actions'>
          <View className='ledger-summary__btn' onClick={goCreate}>
            <Reicon name='WalletAdd' size={16} color='#ffffff' />
            <Text>记一笔</Text>
          </View>
          <View className='ledger-summary__btn ledger-summary__btn--ghost' onClick={goReport}>
            <Reicon name='Chart' size={16} color='#ffffff' />
            <Text>报表</Text>
          </View>
        </View>
      </View>

      <View className='section-title'>最近记录</View>
      {recent.length ? (
        recent.map((record) => {
          const meta = categoryMeta(record.category, record.type)
          const isIncome = record.type === 'income'
          return (
            <View
              className='ledger-item'
              key={record.id}
              onClick={() => Taro.navigateTo({ url: `/pages/ledger-report/index?date=${dateKeyOf(record.createdAt)}` })}
              onLongPress={() => onLongPress(record)}
            >
              <View className='ledger-item__icon' style={{ background: `${record.color}1a` }}>
                <Reicon name={record.icon} size={20} color={record.color} />
              </View>
              <View className='ledger-item__content'>
                <View className='ledger-item__title'>{record.title}</View>
                <View className='ledger-item__meta'>{meta.label} · {formatTime(record.createdAt)}</View>
              </View>
              <View className={`ledger-item__amount ${isIncome ? 'ledger-item__amount--income' : 'ledger-item__amount--expense'}`}>
                {isIncome ? '+' : '-'}{formatMoney(record.amount)}
              </View>
            </View>
          )
        })
      ) : (
        <View className='empty-state'>还没有记账，点上方「记一笔」开始。</View>
      )}
    </View>
  )
}

export default Ledger
