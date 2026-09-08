import React, { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Input, Picker, ScrollView, View, Text } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import { useAppStore } from '../../store/useAppStore'
import { safeEvaluate } from '../../utils/calc'
import {
  LEDGER_COLORS,
  LEDGER_EXPENSE_CATEGORIES,
  LEDGER_ICON_PALETTE,
  LEDGER_INCOME_CATEGORIES,
} from '../../utils/ledger'
import './index.scss'

const CALC_KEYS = [
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '÷', value: '÷', op: true },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '×', value: '×', op: true },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '-', value: '-', op: true },
  { label: '.', value: '.', dot: true },
  { label: '0', value: '0' },
  { label: '⌫', value: '⌫', back: true },
  { label: '+', value: '+', op: true },
]

const LAYOUT = (() => {
  try {
    const sys = Taro.getSystemInfoSync()
    const capsule = Taro.getMenuButtonBoundingClientRect && Taro.getMenuButtonBoundingClientRect()
    const statusBarHeight = sys.statusBarHeight || 20
    const headerHeight = capsule ? capsule.bottom - statusBarHeight + 8 : 44
    const headerPaddingRight = capsule ? sys.windowWidth - capsule.left : 14
    return { statusBarHeight, headerHeight, headerPaddingRight }
  } catch (e) {
    return { statusBarHeight: 20, headerHeight: 44, headerPaddingRight: 14 }
  }
})()

const pad2 = (n) => `${n}`.padStart(2, '0')

const nowDateStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

const nowTimeStr = () => {
  const d = new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function LedgerCreate() {
  const addLedgerRecord = useAppStore((state) => state.addLedgerRecord)
  const accounts = useAppStore((state) => state.accounts)

  const [type, setType] = useState('expense')
  const [category, setCategory] = useState(LEDGER_EXPENSE_CATEGORIES[0].id)
  const [icon, setIcon] = useState(LEDGER_EXPENSE_CATEGORIES[0].icon)
  const [color, setColor] = useState(LEDGER_EXPENSE_CATEGORIES[0].color)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [iconOpen, setIconOpen] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const [dateStr, setDateStr] = useState(nowDateStr)
  const [timeStr, setTimeStr] = useState(nowTimeStr)

  // 默认选中第一个账户（支出从该账户扣款、收入计入该账户）
  useEffect(() => {
    if (!accountId && accounts.length) setAccountId(accounts[0].id)
  }, [accounts.length])

  const categories = type === 'expense' ? LEDGER_EXPENSE_CATEGORIES : LEDGER_INCOME_CATEGORIES
  const evalResult = useMemo(() => safeEvaluate(amount), [amount])
  const showPreview = evalResult != null && /[+\-×÷*/]/.test(amount)

  const switchType = (next) => {
    if (next === type) return
    setType(next)
    const pool = next === 'expense' ? LEDGER_EXPENSE_CATEGORIES : LEDGER_INCOME_CATEGORIES
    const first = pool[0]
    setCategory(first.id)
    setIcon(first.icon)
    setColor(first.color)
    setIconOpen(false)
    setColorOpen(false)
  }

  const selectCategory = (cat) => {
    setCategory(cat.id)
    setIcon(cat.icon)
    setColor(cat.color)
    setIconOpen(false)
    setColorOpen(false)
  }

  const appendKey = (key) => {
    if (key.clear) {
      setAmount('')
      return
    }
    if (key.back) {
      setAmount((prev) => prev.slice(0, -1))
      return
    }
    setAmount((prev) => {
      if (key.dot && prev.endsWith('.')) return prev
      if (key.op && /[+\-×÷*\/]$/.test(prev)) return `${prev.slice(0, -1)}${key.value}`
      return `${prev}${key.value}`
    })
  }

  const clearAll = () => setAmount('')

  const save = ({ stay }) => {
    const expr = amount.replace(/[+\-×÷*\/]+$/, '')
    const evaluated = safeEvaluate(expr)
    const finalAmount = evaluated == null ? Number(expr) : evaluated
    const cleanTitle = title.trim()

    if (!cleanTitle) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (Number.isNaN(finalAmount) || finalAmount <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }

    const recordTime = new Date(`${dateStr}T${timeStr}:00`).getTime()
    const validTime = Number.isNaN(recordTime) ? Date.now() : recordTime

    addLedgerRecord({
      type,
      category,
      icon,
      color,
      title: cleanTitle,
      note: note.trim(),
      amount: finalAmount,
      accountId: accountId || null,
      createdAt: validTime,
    })

    if (stay) {
      setAmount('')
      setTitle('')
      setNote('')
      setIconOpen(false)
      setColorOpen(false)
      setDateStr(nowDateStr())
      setTimeStr(nowTimeStr())
      Taro.showToast({ title: '已记一笔', icon: 'success' })
    } else {
      Taro.showToast({ title: '已保存', icon: 'success' })
      Taro.navigateBack()
    }
  }

  const isExpense = type === 'expense'
  const displayAmount = amount || '0.00'

  return (
    <View className='ledger-create'>
      <View className='lc-header' style={{ paddingTop: `${LAYOUT.statusBarHeight}px` }}>
        <View className='lc-header__inner' style={{ minHeight: `${LAYOUT.headerHeight}px`, paddingRight: `${LAYOUT.headerPaddingRight}px` }}>
          <View className='lc-close' onClick={() => Taro.navigateBack()}>
            <View className='lc-close__x' />
          </View>
          <View className='lc-seg'>
            <View
              className={`lc-seg__item ${isExpense ? 'lc-seg__item--active' : ''}`}
              onClick={() => switchType('expense')}
            >
              支出
            </View>
            <View
              className={`lc-seg__item ${!isExpense ? 'lc-seg__item--active' : ''}`}
              onClick={() => switchType('income')}
            >
              收入
            </View>
          </View>
          <View className='lc-ledger'>
            <Reicon name='Wallet' size={14} color='#707070' />
            <Text>默认账本</Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className='lc-scroll'>
        {/* Category circles */}
        <View className='lc-cats'>
          {categories.map((cat) => {
            const active = cat.id === category
            return (
              <View className='lc-cat' key={cat.id} onClick={() => selectCategory(cat)}>
                <View
                  className={`lc-cat__circle ${active ? 'lc-cat__circle--active' : ''}`}
                  style={active ? { background: cat.color } : undefined}
                >
                  <Reicon name={cat.icon} size={22} color={active ? '#ffffff' : '#8a8a8a'} />
                </View>
                <View className={`lc-cat__label ${active ? 'lc-cat__label--active' : ''}`}>{cat.label}</View>
              </View>
            )
          })}
        </View>

        {/* Quick tools: icon & color are collapsed by default */}
        <View className='lc-tools'>
          <View
            className={`lc-tool ${iconOpen ? 'lc-tool--active' : ''}`}
            onClick={() => { setIconOpen((v) => !v); setColorOpen(false) }}
          >
            <View className='lc-tool__icon' style={{ background: `${color}1a` }}>
              <Reicon name={icon} size={16} color={color} />
            </View>
            <Text>图标</Text>
          </View>
          <View
            className={`lc-tool ${colorOpen ? 'lc-tool--active' : ''}`}
            onClick={() => { setColorOpen((v) => !v); setIconOpen(false) }}
          >
            <View className='lc-tool__swatch' style={{ background: color }} />
            <Text>颜色</Text>
          </View>
          <View className='lc-tool lc-tool--hint'>
            <Reicon name='Pen' size={16} color='#8a8a8a' />
            <Text>标题</Text>
          </View>
        </View>

        {iconOpen && (
          <View className='lc-panel'>
            <View className='lc-panel__title'>选择图标（默认随分类，可自定义）</View>
            <View className='lc-icons'>
              {LEDGER_ICON_PALETTE.map((name) => {
                const active = icon === name
                return (
                  <View
                    className={`lc-icon ${active ? 'lc-icon--active' : ''}`}
                    key={name}
                    onClick={() => { setIcon(name); setIconOpen(false) }}
                  >
                    <Reicon name={name} size={20} color={active ? color : '#8a8a8a'} />
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {colorOpen && (
          <View className='lc-panel'>
            <View className='lc-panel__title'>选择图标颜色</View>
            <View className='lc-colors'>
              {LEDGER_COLORS.map((c) => {
                const active = color === c
                return (
                  <View
                    className={`lc-color ${active ? 'lc-color--active' : ''}`}
                    key={c}
                    style={{ background: c }}
                    onClick={() => { setColor(c); setColorOpen(false) }}
                  >
                    {active && <View className='lc-color__check'>✓</View>}
                  </View>
                )
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <View className={`lc-bottom ${isExpense ? 'lc-bottom--expense' : 'lc-bottom--income'}`}>
        <View className='lc-amount'>
          <View className='lc-amount__currency'>¥</View>
          <View className='lc-amount__value'>{displayAmount}</View>
        </View>

        <View className='lc-time'>
          <Picker mode='date' value={dateStr} onChange={(e) => setDateStr(e.detail.value)}>
            <View className='lc-time__seg'>
              <Reicon name='CalendarCheck' size={15} color='#4d4d4d' />
              <Text>{dateStr}</Text>
            </View>
          </Picker>
          <Picker mode='time' value={timeStr} onChange={(e) => setTimeStr(e.detail.value)}>
            <View className='lc-time__seg lc-time__seg--time'>
              <Reicon name='Clock' size={15} color='#4d4d4d' />
              <Text>{timeStr}</Text>
            </View>
          </Picker>
        </View>

        <View className='lc-fields'>
          {accounts.length > 0 && (
            <View className='lc-fields__account'>
              <View className='lc-fields__account-label'>
                <Reicon name='Wallet' size={12} color='#8a8a8a' />
                <Text>账户</Text>
              </View>
              <ScrollView scrollX enhanced showScrollbar={false} className='lc-accounts-scroll'>
                <View className='lc-accounts'>
                  <View
                    className={`lc-account-chip ${accountId === '' ? 'lc-account-chip--active' : ''}`}
                    onClick={() => setAccountId('')}
                  >
                    不计入账户
                  </View>
                  {accounts.map((a) => (
                    <View
                      key={a.id}
                      className={`lc-account-chip ${accountId === a.id ? 'lc-account-chip--active' : ''}`}
                      onClick={() => setAccountId(a.id)}
                    >
                      {a.name}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          <Input
            className='lc-input'
            value={title}
            placeholder='填写标题（如 午餐 / 地铁）'
            onInput={(e) => setTitle(e.detail.value)}
          />
          <View className='lc-note-row'>
            <Input
              className='lc-input lc-input--note'
              value={note}
              placeholder='点击填写备注'
              onInput={(e) => setNote(e.detail.value)}
            />
          </View>
        </View>

        <View className='lc-calc-status'>
          <View className='lc-clear' onClick={clearAll}>C</View>
          <View className='lc-preview'>{showPreview ? `= ${evalResult}` : ''}</View>
        </View>

        <View className='lc-keypad'>
          {CALC_KEYS.map((key) => (
            <View
              className={`lc-key ${key.op ? 'lc-key--op' : ''} ${key.back ? 'lc-key--back' : ''} ${key.dot ? 'lc-key--dot' : ''}`}
              key={key.label}
              onClick={() => appendKey(key)}
            >
              {key.label}
            </View>
          ))}
        </View>

        <View className='lc-actions'>
          <View className='lc-action lc-action--ghost' onClick={() => save({ stay: true })}>保存再记</View>
          <View className='lc-action lc-action--primary' onClick={() => save({ stay: false })}>完成</View>
        </View>
      </View>
    </View>
  )
}

export default LedgerCreate
