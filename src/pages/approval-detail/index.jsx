import React, { useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import {
  formatPrice,
  formatTime,
  ITEM_STATUS_TEXT,
  MEMBER_STATUS_TEXT,
} from '../../utils/approval'
import { apiApprovalDetail, apiFriends, apiInviteGroup } from '../../services/api'
import { API_BASE_URL } from '../../config'
import './index.scss'

/** 审批详情：数据全部来自服务端（GET /approvals/{id}），决定列表实时同步 */
function ApprovalDetail() {
  const router = Taro.useRouter()
  const approvalId = router.params.id

  const user = useAppStore((state) => state.user)

  const [approval, setApproval] = useState(null)
  const [decisions, setDecisions] = useState([])
  const [images, setImages] = useState([])
  const [missing, setMissing] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [invitedIds, setInvitedIds] = useState([])

  const itemStat = useMemo(() => {
    const total = decisions.length
    const approved = decisions.filter((d) => d.decision === 'approved').length
    const rejected = decisions.filter((d) => d.decision === 'rejected').length
    const pending = total - approved - rejected
    return { total, approved, rejected, pending }
  }, [decisions])

  const myDecision = useMemo(
    () => decisions.find((d) => d.userId === (user && user.id)) || null,
    [decisions, user]
  )

  // plaza 为开放投票（任意登录用户可直接审）；group 仅审批名单内的人可审
  const canDecide = !approval
    ? false
    : approval.scope === 'plaza'
      ? !myDecision || myDecision.decision === 'pending'
      : Boolean(myDecision && myDecision.decision === 'pending')

  const load = async () => {
    if (!approvalId) return
    try {
      const res = await apiApprovalDetail(approvalId)
      setApproval(res.approval || null)
      setDecisions(res.decisions || [])
      setImages(res.images || [])
    } catch (e) {
      if (e.code === 404) setMissing(true)
      else Taro.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  }

  // useDidShow 首次展示与从审批页返回时都会触发，保证决定列表实时同步
  useDidShow(() => {
    load()
  })

  const goReview = () => {
    Taro.navigateTo({ url: `/pages/approval-review/index?approvalId=${approvalId}` })
  }

  const decidedLabel = !approval
    ? ''
    : approval.status === 'rejected'
      ? `这笔消费被劝退了，省下了 ${formatPrice(approval.price)}`
      : approval.status === 'approved'
        ? '审批已通过，放心入手吧'
        : `还有 ${itemStat.pending} 位待决定`

  const toggleInvite = async () => {
    const next = !showInvite
    setShowInvite(next)
    if (!next) return
    try {
      const { friends } = await apiFriends()
      setCandidates(friends || [])
    } catch (e) {
      Taro.showToast({ title: e.message || '好友列表加载失败', icon: 'none' })
    }
  }

  const inviteFriend = async (friend) => {
    if (!approval || !approval.groupId) return
    try {
      await apiInviteGroup(approval.groupId, [friend.id])
      setInvitedIds((prev) => [...prev, friend.id])
      Taro.showToast({ title: '已邀请进群', icon: 'success' })
    } catch (e) {
      Taro.showToast({ title: e.message || '邀请失败', icon: 'none' })
    }
  }

  if (missing || (!approval && !missing)) {
    return (
      <View className='page'>
        <View className='empty-state'>{missing ? '物品不存在或已被删除' : '加载中…'}</View>
      </View>
    )
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>物品详情</View>
        <View className='subtitle'>{approval.groupName || '审核广场'}</View>
      </View>

      {/* ---- Item card ---- */}
      <View className='panel'>
        <View className='approval-detail__top'>
          <View className='approval-detail__title'>{approval.title}</View>
          <View className={`approval-item__badge approval-item__badge--${approval.status}`}>
            {ITEM_STATUS_TEXT[approval.status] || approval.status}
          </View>
        </View>
        <View className='approval-detail__price'>{formatPrice(approval.price)}</View>
        {approval.description ? (
          <View className='approval-detail__desc'>{approval.description}</View>
        ) : null}
        {approval.alternative ? (
          <View className='approval-detail__alt'>
            <Text className='approval-detail__alt-label'>替代品</Text>
            <Text className='approval-detail__alt-value'>{approval.alternative}</Text>
          </View>
        ) : null}
        {images.length ? (
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {images.map((img) => (
              <Image
                key={img.id}
                src={`${API_BASE_URL}${img.url}`}
                mode='aspectFill'
                style={{ width: '84px', height: '84px', borderRadius: '8px' }}
              />
            ))}
          </View>
        ) : null}
        <View className='approval-detail__meta'>
          <View className='approval-detail__tag'>{approval.category || '其他'}</View>
          <Text>{approval.publisherName || '—'} 发布于 {formatTime(approval.createdAt)}</Text>
        </View>
        <View className='approval-detail__result'>{decidedLabel}</View>
      </View>

      {/* ---- My decision entry ---- */}
      <View className='approval-detail__actions'>
        {canDecide ? (
          <Button block type='primary' onClick={goReview}>
            {myDecision ? '完成你的审批' : '我来审批'}
          </Button>
        ) : myDecision ? (
          <View className='approval-detail__result'>
            你的决定：{MEMBER_STATUS_TEXT[myDecision.decision]}
            {myDecision.reason ? ` · ${myDecision.reason}` : ''}
          </View>
        ) : approval.scope === 'group' ? (
          <View className='approval-detail__result'>本次审批名单在发布时确定，你不在名单内。</View>
        ) : null}
      </View>

      {/* ---- Summary ---- */}
      <View className='approval-detail__summary'>
        <View className='approval-detail__summary-item'>
          <View className='approval-detail__summary-num'>{itemStat.approved}</View>
          <View className='approval-detail__summary-label'>通过</View>
        </View>
        <View className='approval-detail__summary-item'>
          <View className='approval-detail__summary-num approval-detail__summary-num--reject'>{itemStat.rejected}</View>
          <View className='approval-detail__summary-label'>驳回</View>
        </View>
        <View className='approval-detail__summary-item'>
          <View className='approval-detail__summary-num'>{itemStat.pending}</View>
          <View className='approval-detail__summary-label'>待决定</View>
        </View>
      </View>

      {/* ---- Decisions ---- */}
      <View className='section-title'>审批决定</View>
      <View className='member-list'>
        {decisions.length ? (
          decisions.map((d) => (
            <View className='member-item' key={d.id}>
              <View className='member-avatar'>{(d.nickname || '?').slice(0, 1)}</View>
              <View className='member-content'>
                <View className='member-name'>{d.nickname || '—'}</View>
                <View className='member-note'>
                  {d.decision === 'pending'
                    ? '等待审批'
                    : d.decision === 'rejected'
                      ? `驳回理由：${d.reason || '未填写'}`
                      : `审批时间 ${formatTime(d.decidedAt)}`}
                </View>
              </View>
              <View className={`member-status member-status--${d.decision}`}>
                {MEMBER_STATUS_TEXT[d.decision] || d.decision}
              </View>
            </View>
          ))
        ) : (
          <View className='empty-state'>暂无审批决定</View>
        )}
      </View>

      {/* ---- Invite to group ---- */}
      {approval.groupId ? (
        <View className='approval-detail__actions'>
          <Button block fill='outline' type='primary' onClick={toggleInvite}>
            {showInvite ? '收起邀请' : '邀请好友进群'}
          </Button>
        </View>
      ) : null}

      {showInvite && approval.groupId ? (
        <View className='invite-panel'>
          {candidates.length ? (
            <View className='friend-select'>
              {candidates.map((friend) => {
                const invited = invitedIds.includes(friend.id)
                return (
                  <View
                    className={`friend-chip ${invited ? 'friend-chip--invited' : 'friend-chip--active'}`}
                    key={friend.id}
                    onClick={() => { if (!invited) inviteFriend(friend) }}
                  >
                    <View className='friend-chip__avatar'>{(friend.nickname || '?').slice(0, 1)}</View>
                    <View className='friend-chip__name'>{friend.nickname}</View>
                    <View className='friend-chip__check'>{invited ? '✓' : '+'}</View>
                  </View>
                )
              })}
            </View>
          ) : (
            <View className='empty-state'>暂无可邀请的好友</View>
          )}
          <View className='approval-detail__hint'>新成员加入群组；本次审批名单已在发布时确定。</View>
        </View>
      ) : null}
    </View>
  )
}

export default ApprovalDetail
