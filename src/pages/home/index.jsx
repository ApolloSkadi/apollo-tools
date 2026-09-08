import React, { useEffect, useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import TabBar from '../../components/TabBar'
import { useAppStore } from '../../store/useAppStore'
import { apiMyApprovals } from '../../services/api'
import { ensureSession } from '../../services/auth'
import { buildLineChartUri } from '../../utils/chart'
import { computeApprovalStats, formatPrice } from '../../utils/approval'
import {
  buildDailySeries,
  categoryMeta,
  formatMoney,
  monthLabel,
  monthSummary,
} from '../../utils/ledger'
import './index.scss'

const DIVINATION_TOOLS = [
  { icon: 'Coins', title: '六爻', desc: '手动摇卦，生成本卦、变卦、动爻。', url: '/pages/liuyao/index' },
  { icon: 'Compass', title: '小六壬', desc: '按事件、起卦方式生成卦象建议。', url: '/pages/xiaoliuren/index' },
  { icon: 'Cards', title: '今日运势', desc: '塔罗三牌占卜，过去·现在·未来。', url: '/pages/tarot/index' },
  { icon: 'Wheel', title: '决策转盘', desc: '自定义选项与权重，一键决策。', url: '/pages/wheel/index' },
]

const DIVINATION_LABEL = { xiaoliuren: '小六壬', liuyao: '六爻', tarot: '今日运势', wheel: '决策转盘' }
const DIVINATION_URL = {
  xiaoliuren: '/pages/xiaoliuren/index',
  liuyao: '/pages/liuyao/index',
  tarot: '/pages/tarot/index',
  wheel: '/pages/wheel/index',
}

const formatTime = (value) => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const HITOKOTO_KEY = 'hitokoto-daily'
const HITOKOTO_FALLBACK = { text: '保持热爱，奔赴山海。', from: 'Hitokoto' }

const todayStamp = () => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/* 每日一言：当日命中缓存，否则请求 hitokoto 接口；失败时用兜底文案 */
function useDailyQuote(active) {
  const [quote, setQuote] = useState(null)
  useEffect(() => {
    if (!active) return
    try {
      const cached = Taro.getStorageSync(HITOKOTO_KEY)
      if (cached && cached.stamp === todayStamp() && cached.text) {
        setQuote(cached)
        return
      }
    } catch (e) { /* ignore */ }
    Taro.request({ url: 'https://v1.hitokoto.cn/?max_length=32', method: 'GET' })
      .then((res) => {
        const body = (res && res.data) || {}
        if (!body.hitokoto) return
        const next = { stamp: todayStamp(), text: body.hitokoto, from: body.from_who || body.from || '' }
        setQuote(next)
        try { Taro.setStorageSync(HITOKOTO_KEY, next) } catch (e) { /* ignore */ }
      })
      .catch(() => { /* 网络失败保留兜底 */ })
  }, [active])
  return quote || HITOKOTO_FALLBACK
}

function Home() {
  const homeTheme = useAppStore((state) => state.homeTheme)
  const histories = useAppStore((state) => state.histories)
  const approvalItems = useAppStore((state) => state.approvalItems)
  const ledgerRecords = useAppStore((state) => state.ledgerRecords)

  // 审批主题：进入首页时确保会话并同步服务端审批数据（我发布/我参与的）
  useDidShow(() => {
    if (homeTheme !== 'approval') return
    ensureSession()
      .then((ok) => {
        if (!ok) return null
        return apiMyApprovals()
      })
      .then((res) => {
        if (res) useAppStore.getState().setApprovalItems(res.approvals || [])
      })
      .catch(() => { /* 服务端不可用时保留本地缓存 */ })
  })

  const now = Date.now()
  const ledgerSummary = useMemo(() => monthSummary(ledgerRecords, now), [ledgerRecords, now])
  const ledgerRecent = useMemo(() => ledgerRecords.slice(0, 5), [ledgerRecords])
  const ledgerTrend = useMemo(() => {
    const end = now
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    const series = buildDailySeries(ledgerRecords, start.getTime(), end)
    return buildLineChartUri(
      [{ name: '支出', color: '#E06A93', values: series.map((s) => s.expense) }],
      { width: 360, height: 120 }
    )
  }, [ledgerRecords, now])

  const approvalStats = useMemo(() => computeApprovalStats(approvalItems), [approvalItems])
  const approvalRecent = useMemo(() => approvalItems.slice(0, 5), [approvalItems])

  const latestDivination = useMemo(() => {
    const records = ['xiaoliuren', 'liuyao', 'tarot']
      .flatMap((type) => histories[type].map((item) => ({ ...item, type })))
      .sort((a, b) => b.createdAt - a.createdAt)
    return records[0] || null
  }, [histories])

  const quote = useDailyQuote(homeTheme === 'divination')

  const go = (url) => Taro.navigateTo({ url })

  const renderLedger = () => (
    <View>
      <View className='hero'>
        <Text className='eyebrow'>记账 · {monthLabel(now)}</Text>
        <View className='title'>今天你记了吗？</View>
        <View className='subtitle'>账本保存在本机，点进去可看类型环比、按日收支和趋势。</View>
      </View>

      <View className='home-ledger-summary'>
        <View className='home-ledger-summary__grid'>
          <View className='home-ledger-summary__item'>
            <View className='home-ledger-summary__num home-ledger-summary__num--income'>+{formatMoney(ledgerSummary.income)}</View>
            <View className='home-ledger-summary__label'>收入</View>
          </View>
          <View className='home-ledger-summary__item'>
            <View className='home-ledger-summary__num home-ledger-summary__num--expense'>-{formatMoney(ledgerSummary.expense)}</View>
            <View className='home-ledger-summary__label'>支出</View>
          </View>
          <View className='home-ledger-summary__item'>
            <View className='home-ledger-summary__num'>{formatMoney(ledgerSummary.net, true)}</View>
            <View className='home-ledger-summary__label'>结余</View>
          </View>
        </View>
        <View className='home-ledger-summary__cta'>
          <View className='home-ledger-summary__btn' onClick={() => go('/pages/ledger-create/index')}>
            <Reicon name='Plus' size={15} color='#ffffff' />
            <Text>记一笔</Text>
          </View>
          <View className='home-ledger-summary__btn home-ledger-summary__btn--ghost' onClick={() => go('/pages/ledger-report/index')}>
            <Reicon name='Chart' size={15} color='#ffffff' />
            <Text>报表</Text>
          </View>
        </View>
      </View>

      {ledgerTrend && (
        <View className='home-panel'>
          <View className='home-panel__head'>
            <View className='home-panel__title'>近 7 天支出趋势</View>
            <View className='home-panel__more' onClick={() => go('/pages/ledger-report/index')}>报表 ›</View>
          </View>
          <View className='home-trend' style={{ backgroundImage: `url("${ledgerTrend}")` }} />
        </View>
      )}

      <View className='section-title'>最近记录</View>
      {ledgerRecent.length ? (
        ledgerRecent.map((record) => {
          const meta = categoryMeta(record.category, record.type)
          const isIncome = record.type === 'income'
          return (
            <View className='home-ledger-item' key={record.id}>
              <View className='home-ledger-item__icon' style={{ background: `${record.color}1a` }}>
                <Reicon name={record.icon} size={18} color={record.color} />
              </View>
              <View className='home-ledger-item__body'>
                <View className='home-ledger-item__title'>{record.title}</View>
                <View className='home-ledger-item__meta'>{meta.label} · {formatTime(record.createdAt)}</View>
              </View>
              <View className={`home-ledger-item__amount ${isIncome ? 'home-ledger-item__amount--income' : 'home-ledger-item__amount--expense'}`}>
                {isIncome ? '+' : '-'}{formatMoney(record.amount)}
              </View>
            </View>
          )
        })
      ) : (
        <View className='empty-state'>这个月还没有记录，点「记一笔」开始。</View>
      )}
    </View>
  )

  const renderDivination = () => {
    const meta = latestDivination
      ? { label: DIVINATION_LABEL[latestDivination.type] || '占卜', url: DIVINATION_URL[latestDivination.type] || '/pages/tarot/index' }
      : null
    return (
      <View>
        <View className='hero'>
          <Text className='eyebrow'>占卜 · 传统智慧</Text>
          <View className='title'>听一听内心的声音</View>
          <View className='subtitle'>在碎片时间里起一卦，给自己一个安静的参照。</View>
        </View>

        <View className='home-panel'>
          <View className='home-panel__head'>
            <View className='home-panel__title'>占卜工具</View>
          </View>
          <View className='home-divination-grid'>
            {DIVINATION_TOOLS.map((tool) => (
              <View className='home-divination-card' key={tool.url} onClick={() => go(tool.url)}>
                <View className='home-divination-card__icon'>
                  <Reicon name={tool.icon} size={22} color='#5a4f8a' />
                </View>
                <View className='home-divination-card__title'>{tool.title}</View>
                <View className='home-divination-card__desc'>{tool.desc}</View>
              </View>
            ))}
          </View>
        </View>

        <View className='home-panel home-quote'>
          <View className='home-panel__head'>
            <View className='home-panel__title'>每日一言</View>
            <View className='home-panel__badge'>Hitokoto</View>
          </View>
          <View className='home-quote__text'>「{quote.text}」</View>
          <View className='home-quote__from'>{quote.from ? `—— ${quote.from}` : '—— Hitokoto'}</View>
        </View>

        {latestDivination && meta ? (
          <View className='home-panel'>
            <View className='home-panel__head'>
              <View className='home-panel__title'>最近占卜</View>
              <View className='home-panel__badge'>{meta.label}</View>
            </View>
            <View className='home-divination-latest__title'>{latestDivination.title}</View>
            <View className='home-divination-latest__detail'>{latestDivination.detail}</View>
            <View className='home-divination-latest__time'>{formatTime(latestDivination.createdAt)}</View>
            <View className='home-cta' onClick={() => go(meta.url)}>再看一次 ›</View>
          </View>
        ) : (
          <View className='home-panel'>
            <View className='home-panel__head'>
              <View className='home-panel__title'>最近占卜</View>
            </View>
            <View className='empty-state'>还没有占卜记录，挑一个工具开始吧。</View>
          </View>
        )}
      </View>
    )
  }

  const renderApproval = () => (
    <View>
      <View className='hero'>
        <Text className='eyebrow'>审批 · 理性消费</Text>
        <View className='title'>你真的要吗？</View>
        <View className='subtitle'>发布想买的物品，邀请好友投票，帮你冷静一下。</View>
      </View>

      <View className='home-panel'>
        <View className='home-panel__head'>
          <View className='home-panel__title'>审批统计</View>
          <View className='home-panel__more' onClick={() => go('/pages/approval/index')}>全部审批 ›</View>
        </View>
        <View className='home-approval-stats'>
          <View className='home-approval-stat'>
            <View className='home-approval-stat__num'>{approvalStats.passRate}%</View>
            <View className='home-approval-stat__label'>通过率</View>
          </View>
          <View className='home-approval-stat'>
            <View className='home-approval-stat__num'>{approvalStats.rejectRate}%</View>
            <View className='home-approval-stat__label'>驳回率</View>
          </View>
          <View className='home-approval-stat'>
            <View className='home-approval-stat__num home-approval-stat__num--accent'>{formatPrice(approvalStats.rejectedAmount)}</View>
            <View className='home-approval-stat__label'>被驳回总额</View>
          </View>
        </View>
        <View className='home-approval-bar'>
          <View className='home-approval-bar__fill' style={{ width: `${approvalStats.passRate}%` }} />
          <View className='home-approval-bar__empty' style={{ width: `${approvalStats.rejectRate}%` }} />
        </View>
        <View className='home-ledger-summary__cta'>
          <View className='home-ledger-summary__btn' onClick={() => go('/pages/approval-create/index')}>
            <Reicon name='Plus' size={15} color='#ffffff' />
            <Text>发布一个</Text>
          </View>
        </View>
      </View>

      <View className='section-title'>最近审批</View>
      {approvalRecent.length ? (
        approvalRecent.map((item) => {
          const statusText = { pending: '审批中', approved: '已通过', rejected: '已驳回' }[item.status] || item.status
          return (
            <View className='home-approval-item' key={item.id} onClick={() => go(`/pages/approval-detail/index?id=${item.id}`)}>
              <View className='home-approval-item__body'>
                <View className='home-approval-item__title'>{item.title}</View>
                <View className='home-approval-item__meta'>{item.groupName} · {formatPrice(item.price)}</View>
              </View>
              <View className={`home-approval-item__badge home-approval-item__badge--${item.status}`}>{statusText}</View>
            </View>
          )
        })
      ) : (
        <View className='empty-state'>还没有发布审批，点「发布一个」开始。</View>
      )}
    </View>
  )

  return (
    <View className='page home-page page--with-tabbar'>
      {homeTheme === 'ledger' && renderLedger()}
      {homeTheme === 'divination' && renderDivination()}
      {homeTheme === 'approval' && renderApproval()}
      <TabBar tabKey='home' />
    </View>
  )
}

export default Home
