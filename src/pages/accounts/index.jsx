import React, { useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Input, View, Text } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import TabBar from '../../components/TabBar'
import { useAppStore } from '../../store/useAppStore'
import {
  ACCOUNT_TYPES,
  accountBalance,
  accountHasRecords,
  accountTypeMeta,
  totalAssets,
} from '../../utils/accounts'
import { formatMoney } from '../../utils/ledger'
import { formatTime } from '../../utils/approval'
import './index.scss'

const metaColor = (t) => (t && t.color) || '#8a8a8a'

/** 记账主题的「账户」Tab：总资产、账户列表、添加账户与账户间转账 */
function Accounts() {
  const accounts = useAppStore((state) => state.accounts)
  const transfers = useAppStore((state) => state.transfers)
  const ledgerRecords = useAppStore((state) => state.ledgerRecords)
  const addAccount = useAppStore((state) => state.addAccount)
  const removeAccount = useAppStore((state) => state.removeAccount)
  const addTransfer = useAppStore((state) => state.addTransfer)

  const [panel, setPanel] = useState('none') // 'none' | 'add' | 'transfer'
  const [name, setName] = useState('')
  const [type, setType] = useState(ACCOUNT_TYPES[0].id)
  const [initial, setInitial] = useState('')
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')

  const total = useMemo(() => totalAssets(accounts, ledgerRecords, transfers), [accounts, ledgerRecords, transfers])
  const recentTransfers = useMemo(() => transfers.slice(0, 10), [transfers])

  const switchPanel = (next) => {
    setPanel((prev) => (prev === next ? 'none' : next))
    setAmount('')
  }

  const submitAdd = () => {
    const cleanName = name.trim()
    if (!cleanName) {
      Taro.showToast({ title: '请输入账户名称', icon: 'none' })
      return
    }
    const init = Number(initial)
    addAccount({ name: cleanName, type, initial: Number.isNaN(init) || init < 0 ? 0 : init })
    setName('')
    setInitial('')
    setPanel('none')
    Taro.showToast({ title: '账户已添加', icon: 'success' })
  }

  const submitTransfer = () => {
    const amt = Number(amount)
    if (!fromId || !toId) {
      Taro.showToast({ title: '请选择转出与转入账户', icon: 'none' })
      return
    }
    if (fromId === toId) {
      Taro.showToast({ title: '不能转给同一账户', icon: 'none' })
      return
    }
    if (Number.isNaN(amt) || amt <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    const from = accounts.find((a) => a.id === fromId)
    if (from && accountBalance(from, ledgerRecords, transfers) < amt) {
      Taro.showToast({ title: '转出账户余额不足', icon: 'none' })
      return
    }
    addTransfer({ fromId, toId, amount: amt })
    setAmount('')
    setFromId('')
    setToId('')
    setPanel('none')
    Taro.showToast({ title: '转账成功', icon: 'success' })
  }

  const confirmRemove = (account) => {
    if (accountHasRecords(account.id, ledgerRecords)) {
      Taro.showModal({
        title: '删除账户',
        content: `「${account.name}」已有关联账目，删除后这些账目将不再计入任何账户余额，确定删除？`,
        success: (res) => {
          if (res.confirm) removeAccount(account.id)
        },
      })
      return
    }
    Taro.showModal({
      title: '删除账户',
      content: `确定删除「${account.name}」吗？`,
      success: (res) => {
        if (res.confirm) removeAccount(account.id)
      },
    })
  }

  const renderAccount = (account) => {
    const meta = accountTypeMeta(account.type)
    const balance = accountBalance(account, ledgerRecords, transfers)
    return (
      <View className='account-card' key={account.id} onLongPress={() => confirmRemove(account)}>
        <View className='account-card__icon' style={{ background: `${meta.color}1a` }}>
          <Reicon name={meta.icon} size={20} color={meta.color} />
        </View>
        <View className='account-card__body'>
          <View className='account-card__name'>{account.name}</View>
          <View className='account-card__meta'>{meta.label} · 期初 {formatMoney(account.initial)}</View>
        </View>
        <View className={`account-card__balance ${balance < 0 ? 'account-card__balance--neg' : ''}`}>
          {formatMoney(balance)}
        </View>
      </View>
    )
  }

  const renderTransferItem = (t) => {
    const from = accounts.find((a) => a.id === t.fromId)
    const to = accounts.find((a) => a.id === t.toId)
    if (!from && !to) return null
    return (
      <View className='transfer-item' key={t.id}>
        <Reicon name='MoneyRecive' size={15} color='#2f8a5b' />
        <View className='transfer-item__body'>
          <View className='transfer-item__title'>
            {from ? from.name : '已删账户'} → {to ? to.name : '已删账户'}
          </View>
          <View className='transfer-item__time'>{formatTime(t.createdAt)}</View>
        </View>
        <View className='transfer-item__amount'>{formatMoney(t.amount)}</View>
      </View>
    )
  }

  return (
    <View className='page page--with-tabbar'>
      <View className='hero'>
        <Text className='eyebrow'>记账 · 账户</Text>
        <View className='title'>总资产</View>
        <View className='accounts-total'>{formatMoney(total)}</View>
        <View className='subtitle'>支出从这里扣款，收入自动入账，支持账户间转账。</View>
      </View>

      <View className='accounts-actions'>
        <View className={`accounts-action ${panel === 'add' ? 'accounts-action--active' : ''}`} onClick={() => switchPanel('add')}>
          <Reicon name='WalletAdd' size={15} color={panel === 'add' ? '#ffffff' : '#2c2c2c'} />
          <Text>添加账户</Text>
        </View>
        <View className={`accounts-action ${panel === 'transfer' ? 'accounts-action--active' : ''}`} onClick={() => switchPanel('transfer')}>
          <Reicon name='MoneyRecive' size={15} color={panel === 'transfer' ? '#ffffff' : '#2c2c2c'} />
          <Text>转账</Text>
        </View>
      </View>

      {panel === 'add' && (
        <View className='panel'>
          <View className='field'>
            <View className='label'>账户名称</View>
            <Input className='input' value={name} placeholder='如：日常钱包 / 工资卡' onInput={(e) => setName(e.detail.value)} />
          </View>
          <View className='field'>
            <View className='label'>账户类型</View>
            <View className='accounts-type-row'>
              {ACCOUNT_TYPES.map((t) => (
                <View
                  key={t.id}
                  className={`accounts-type ${t.id === type ? 'accounts-type--active' : ''}`}
                  onClick={() => setType(t.id)}
                >
                  <Reicon name={t.icon} size={14} color={t.id === type ? '#ffffff' : metaColor(t)} />
                  <Text>{t.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <View className='field'>
            <View className='label'>期初余额</View>
            <Input className='input' type='digit' value={initial} placeholder='当前已有多少（选填）' onInput={(e) => setInitial(e.detail.value)} />
          </View>
          <View className='accounts-submit' onClick={submitAdd}>添加账户</View>
        </View>
      )}

      {panel === 'transfer' && (
        <View className='panel'>
          <View className='field'>
            <View className='label'>转出账户</View>
            <View className='accounts-type-row'>
              {accounts.map((a) => (
                <View
                  key={a.id}
                  className={`accounts-type ${a.id === fromId ? 'accounts-type--active' : ''}`}
                  onClick={() => setFromId(a.id)}
                >
                  <Text>{a.name}</Text>
                </View>
              ))}
            </View>
          </View>
          <View className='field'>
            <View className='label'>转入账户</View>
            <View className='accounts-type-row'>
              {accounts.map((a) => (
                <View
                  key={a.id}
                  className={`accounts-type accounts-type--in ${a.id === toId ? 'accounts-type--active' : ''}`}
                  onClick={() => setToId(a.id)}
                >
                  <Text>{a.name}</Text>
                </View>
              ))}
            </View>
          </View>
          <View className='field'>
            <View className='label'>金额</View>
            <Input className='input' type='digit' value={amount} placeholder='转账金额' onInput={(e) => setAmount(e.detail.value)} />
          </View>
          <View className='accounts-submit' onClick={submitTransfer}>确认转账</View>
          <View className='accounts-hint'>转账不计入收支统计，只调整账户余额。</View>
        </View>
      )}

      <View className='section-title'>我的账户</View>
      {accounts.length ? (
        accounts.map(renderAccount)
      ) : (
        <View className='empty-state'>还没有账户，添加一个后，记一笔支出会自动从这里扣款。</View>
      )}

      {recentTransfers.length > 0 && (
        <>
          <View className='section-title'>最近转账</View>
          {recentTransfers.map(renderTransferItem)}
        </>
      )}

      <TabBar tabKey='account' />
    </View>
  )
}

export default Accounts
