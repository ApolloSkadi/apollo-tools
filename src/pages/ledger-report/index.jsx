import React, { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Picker, View, Text } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import TabBar from '../../components/TabBar'
import { useAppStore } from '../../store/useAppStore'
import { buildLineChartUri } from '../../utils/chart'
import {
  buildDailySeries,
  categoryMeta,
  computeRangeMom,
  daysInRange,
  formatMoney,
  rangeLabel,
  rangeSummary,
  resolveRange,
  weekdayLabel,
} from '../../utils/ledger'
import './index.scss'

const TABS = [
  { id: 'mom', label: '类型环比' },
  { id: 'daily', label: '日期收支' },
  { id: 'trend', label: '折线趋势' },
]

const PRESETS = [
  { id: 'week', label: '本周' },
  { id: 'month', label: '本月' },
  { id: 'year', label: '本年' },
  { id: '7d', label: '近7天' },
  { id: '30d', label: '近30天' },
  { id: 'custom', label: '自定义' },
]

const todayKey = () => {
  const d = new Date()
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const monthStartKey = () => {
  const d = new Date()
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

function LedgerReport() {
  const ledgerRecords = useAppStore((state) => state.ledgerRecords)
  const router = Taro.useRouter()
  const [now] = useState(() => Date.now())

  const [activeTab, setActiveTab] = useState('mom')
  const [preset, setPreset] = useState('month')
  const [customStartKey, setCustomStartKey] = useState(monthStartKey)
  const [customEndKey, setCustomEndKey] = useState(todayKey)
  const [expandedDayKey, setExpandedDayKey] = useState('')

  // A specific date can be jumped to from the ledger list (?date=YYYY-MM-DD).
  useEffect(() => {
    const date = router.params && router.params.date
    if (date) {
      setPreset('custom')
      setCustomStartKey(date)
      setCustomEndKey(date)
      setActiveTab('daily')
    }
  }, [router.params])

  const range = useMemo(
    () => resolveRange(preset, customStartKey, customEndKey, now),
    [preset, customStartKey, customEndKey, now]
  )

  const summary = useMemo(
    () => rangeSummary(ledgerRecords, range.start, range.end),
    [ledgerRecords, range.start, range.end]
  )

  const expenseMom = useMemo(
    () => computeRangeMom(ledgerRecords, range.start, range.end, 'expense'),
    [ledgerRecords, range.start, range.end]
  )
  const incomeMom = useMemo(
    () => computeRangeMom(ledgerRecords, range.start, range.end, 'income'),
    [ledgerRecords, range.start, range.end]
  )
  const expenseRows = expenseMom.filter((row) => row.current > 0 || row.prev > 0)
  const incomeRows = incomeMom.filter((row) => row.current > 0 || row.prev > 0)

  const days = useMemo(
    () => daysInRange(ledgerRecords, range.start, range.end),
    [ledgerRecords, range.start, range.end]
  )

  const trend = useMemo(() => {
    const series = buildDailySeries(ledgerRecords, range.start, range.end)
    const uri = buildLineChartUri(
      [
        { name: '支出', color: '#E06A93', values: series.map((s) => s.expense) },
        { name: '收入', color: '#3FA47C', values: series.map((s) => s.income) },
      ],
      { width: 360, height: 190 }
    )
    const expense = series.reduce((sum, s) => sum + s.expense, 0)
    const income = series.reduce((sum, s) => sum + s.income, 0)
    return { uri, series, expense, income }
  }, [ledgerRecords, range.start, range.end])

  const presetMeta = PRESETS.find((p) => p.id === preset) || PRESETS[1]

  const selectPreset = (id) => {
    setPreset(id)
    if (id === 'custom') {
      setCustomStartKey(monthStartKey())
      setCustomEndKey(todayKey())
    }
  }

  const renderMomRow = (row, rows) => {
    const pctClass = row.diff > 0 ? 'mom-row__pct--up' : row.diff < 0 ? 'mom-row__pct--down' : ''
    const max = Math.max(...rows.map((r) => r.current), 1)
    return (
      <View className='mom-row' key={row.id}>
        <View className='mom-row__icon' style={{ background: `${row.color}1a` }}>
          <Reicon name={row.icon} size={18} color={row.color} />
        </View>
        <View className='mom-row__body'>
          <View className='mom-row__label'>{row.label}</View>
          <View className='mom-row__sub'>上期 {formatMoney(row.prev)} → 本期 {formatMoney(row.current)}</View>
          <View className='mom-row__bar'>
            <View
              className='mom-row__bar-fill'
              style={{ width: `${Math.min(100, (row.current / max) * 100)}%`, background: row.color }}
            />
          </View>
        </View>
        <View className={`mom-row__pct ${pctClass}`}>
          {row.diff > 0 ? '+' : ''}{row.diff === 0 ? '0' : row.pct}
          <View className='mom-row__pct-label'>环比</View>
        </View>
      </View>
    )
  }

  const renderRangePicker = () => (
    <View className='report-range'>
      <View className='report-range__presets'>
        {PRESETS.map((p) => {
          const active = p.id === preset
          return (
            <View
              className={`report-range__chip ${active ? 'report-range__chip--active' : ''}`}
              key={p.id}
              onClick={() => selectPreset(p.id)}
            >
              {p.label}
            </View>
          )
        })}
      </View>

      {preset === 'custom' && (
        <View className='report-range__custom'>
          <Picker mode='date' value={customStartKey} onChange={(e) => setCustomStartKey(e.detail.value)}>
            <View className='report-range__date'>
              <Reicon name='CalendarCheck' size={14} color='#4d4d4d' />
              <Text>{customStartKey}</Text>
            </View>
          </Picker>
          <View className='report-range__tilde'>至</View>
          <Picker mode='date' value={customEndKey} onChange={(e) => setCustomEndKey(e.detail.value)}>
            <View className='report-range__date'>
              <Reicon name='CalendarCheck' size={14} color='#4d4d4d' />
              <Text>{customEndKey}</Text>
            </View>
          </Picker>
        </View>
      )}

      <View className='report-range__meta'>
        <Text className='report-range__label'>{presetMeta.label}</Text>
        <Text className='report-range__span'>{rangeLabel(range.start, range.end)}</Text>
      </View>
    </View>
  )

  const renderOverview = () => (
    <View className='report-overview'>
      <View className='report-overview__grid'>
        <View className='report-overview__item'>
          <View className='report-overview__num report-overview__num--income'>+{formatMoney(summary.income)}</View>
          <View className='report-overview__label'>收入</View>
        </View>
        <View className='report-overview__item'>
          <View className='report-overview__num report-overview__num--expense'>-{formatMoney(summary.expense)}</View>
          <View className='report-overview__label'>支出</View>
        </View>
        <View className='report-overview__item'>
          <View className='report-overview__num'>{formatMoney(summary.net, true)}</View>
          <View className='report-overview__label'>结余</View>
        </View>
      </View>
      <View className='report-overview__foot'>
        <Text>{summary.count} 笔 · {summary.activeDays} 天有账 · 日均支出 {formatMoney(summary.avg)}</Text>
      </View>
    </View>
  )

  const renderDaily = () => (
    <View>
      {days.length ? (
        days.map((d) => {
          const expanded = expandedDayKey === d.key
          const hasRecords = d.records.length > 0
          return (
            <View className='report-day' key={d.key}>
              <View
                className='report-day__head'
                onClick={() => setExpandedDayKey(expanded ? '' : d.key)}
              >
                <View className='report-day__date'>
                  <View className='report-day__week'>{weekdayLabel(d.key)}</View>
                  <View className='report-day__sub'>{d.key.slice(0, 10).replace('-', '年').replace('-', '月')}日</View>
                </View>
                <View className='report-day__totals'>
                  <Text className='report-day__income'>+{formatMoney(d.income)}</Text>
                  <Text className='report-day__expense'>-{formatMoney(d.expense)}</Text>
                </View>
                <View className={`report-day__chevron ${expanded ? 'report-day__chevron--open' : ''}`}>›</View>
              </View>
              {expanded && hasRecords && (
                <View className='report-day__body'>
                  {d.records
                    .slice()
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((record) => {
                      const meta = categoryMeta(record.category, record.type)
                      const isIncome = record.type === 'income'
                      return (
                        <View className='day-item' key={record.id}>
                          <View className='day-item__icon' style={{ background: `${record.color}1a` }}>
                            <Reicon name={record.icon} size={18} color={record.color} />
                          </View>
                          <View className='day-item__body'>
                            <View className='day-item__title'>{record.title}</View>
                            <View className='day-item__meta'>{meta.label}{record.note ? ` · ${record.note}` : ''}</View>
                          </View>
                          <View className={`day-item__amount ${isIncome ? 'day-item__amount--income' : 'day-item__amount--expense'}`}>
                            {isIncome ? '+' : '-'}{formatMoney(record.amount)}
                          </View>
                        </View>
                      )
                    })}
                </View>
              )}
            </View>
          )
        })
      ) : (
        <View className='empty-state'>该时间范围内没有记账记录</View>
      )}
    </View>
  )

  const renderTrend = () => (
    <View>
      <View className='trend-total'>
        <View className='trend-total__item'>
          <View className='trend-total__dot trend-total__dot--expense' />
          <View className='trend-total__label'>支出</View>
          <View className='trend-total__value'>{formatMoney(trend.expense)}</View>
        </View>
        <View className='trend-total__item'>
          <View className='trend-total__dot trend-total__dot--income' />
          <View className='trend-total__label'>收入</View>
          <View className='trend-total__value'>{formatMoney(trend.income)}</View>
        </View>
      </View>

      {trend.uri ? (
        <View className='trend-chart' style={{ backgroundImage: `url("${trend.uri}")` }} />
      ) : (
        <View className='empty-state'>暂无趋势数据</View>
      )}

      <View className='trend-axis'>
        <Text>{weekdayLabel(trend.series[0].key)}</Text>
        <Text>{weekdayLabel(trend.series[Math.floor(trend.series.length / 2)].key)}</Text>
        <Text>{weekdayLabel(trend.series[trend.series.length - 1].key)}</Text>
      </View>
    </View>
  )

  return (
    <View className='page report-page page--with-tabbar'>
      <View className='hero'>
        <View className='title'>报表</View>
        <View className='subtitle'>选择一个时间范围，查看分类环比、按日收支和折线趋势。</View>
      </View>

      {renderRangePicker()}
      {renderOverview()}

      <View className='report-tabs'>
        {TABS.map((tab) => (
          <View
            className={`report-tab ${activeTab === tab.id ? 'report-tab--active' : ''}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      {activeTab === 'mom' && (
        <View>
          <View className='section-title'>支出类型环比</View>
          {expenseRows.length ? expenseRows.map((row) => renderMomRow(row, expenseRows)) : <View className='empty-state'>本期暂无支出</View>}
          <View className='section-title'>收入类型环比</View>
          {incomeRows.length ? incomeRows.map((row) => renderMomRow(row, incomeRows)) : <View className='empty-state'>本期暂无收入</View>}
        </View>
      )}

      {activeTab === 'daily' && renderDaily()}
      {activeTab === 'trend' && renderTrend()}

      <TabBar tabKey='report' />
    </View>
  )
}

export default LedgerReport
