import React, { useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import TabBar from '../../components/TabBar'
import { useAppStore } from '../../store/useAppStore'
import {
  computeApprovalStats,
  formatPrice,
  formatTime,
  ITEM_STATUS_TEXT,
} from '../../utils/approval'
import { apiMyApprovals } from '../../services/api'
import { silentLogin, ensureSession } from '../../services/auth'
import './index.scss'

/** 审批主题的「记录」Tab：我在服务端的全部审批（我发布/我参与） */
function Approval() {
  const token = useAppStore((state) => state.token)
  const approvalItems = useAppStore((state) => state.approvalItems)
  const setApprovalItems = useAppStore((state) => state.setApprovalItems)
  const [loading, setLoading] = useState(false)

  // 服务端数据结构：ApprovalInfo { id, title, price, groupName, publisherName, status, scope, createdAt }
  const stats = useMemo(() => computeApprovalStats(approvalItems), [approvalItems])

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiMyApprovals()
      setApprovalItems(res.approvals || [])
    } catch (e) { /* 服务端不可用时保留本地缓存 */ }
    setLoading(false)
  }

  useDidShow(() => {
    // 先确保会话（无 token 时静默登录），再拉取服务端审批列表
    ensureSession().then((ok) => {
      if (ok) load()
    })
  })

  const goCreate = () => Taro.navigateTo({ url: '/pages/approval-create/index' })

  const doLogin = async () => {
    const u = await silentLogin()
    if (u) load()
    else Taro.showToast({ title: '登录失败', icon: 'none' })
  }

  return (
    <View className='page page--with-tabbar'>
      <View className='hero'>
        <View className='title'>审批记录</View>
        <View className='subtitle'>你发布和参与的购物审批，投票结果实时同步。</View>
      </View>

      <View className='approval-stats'>
        <View className='approval-stats__row'>
          <View className='approval-stat'>
            <View className='approval-stat__num'>{stats.total}</View>
            <View className='approval-stat__label'>物品</View>
          </View>
          <View className='approval-stat'>
            <View className='approval-stat__num'>{stats.passRate}%</View>
            <View className='approval-stat__label'>通过率</View>
          </View>
          <View className='approval-stat'>
            <View className='approval-stat__num'>{stats.rejectRate}%</View>
            <View className='approval-stat__label'>驳回率</View>
          </View>
          <View className='approval-stat'>
            <View className='approval-stat__num approval-stat__num--accent'>{formatPrice(stats.rejectedAmount)}</View>
            <View className='approval-stat__label'>被驳回总额</View>
          </View>
        </View>
        <View className='approval-stats__bar'>
          <View className='approval-stats__bar-fill' style={{ width: `${stats.passRate}%` }} />
          <View className='approval-stats__bar-empty' style={{ width: `${stats.rejectRate}%` }} />
        </View>
      </View>

      <View className='approval-fab'>
        <Button block type='primary' onClick={goCreate}>发布一个物品</Button>
      </View>

      <View className='section-title'>审批列表</View>
      {!token ? (
        <View className='approval-login-row'>
          <View className='approval-login-row__text'>登录后即可查看审批记录</View>
          <Button size='small' type='primary' onClick={doLogin}>微信登录</Button>
        </View>
      ) : approvalItems.length ? (
        approvalItems.map((item) => (
          <View
            className='approval-item'
            key={item.id}
            onClick={() => Taro.navigateTo({ url: `/pages/approval-detail/index?id=${item.id}` })}
          >
            <View className='approval-item__top'>
              <View className='approval-item__title'>{item.title}</View>
              <View className={`approval-item__badge approval-item__badge--${item.status}`}>
                {ITEM_STATUS_TEXT[item.status] || item.status}
              </View>
            </View>
            <View className='approval-item__price'>{formatPrice(item.price)}</View>
            <View className='approval-item__meta'>
              {item.groupName || '审核广场'} · {item.publisherName || '—'} · {formatTime(item.createdAt) || '刚刚'}
            </View>
          </View>
        ))
      ) : (
        <View className='empty-state'>{loading ? '加载中…' : '还没有审批记录，点击上方按钮开始。'}</View>
      )}

      <TabBar tabKey='record' />
    </View>
  )
}

export default Approval
