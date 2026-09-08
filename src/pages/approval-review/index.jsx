import React, { useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Textarea, View, Image } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import { useAppStore } from '../../store/useAppStore'
import { formatPrice, MEMBER_STATUS_TEXT } from '../../utils/approval'
import { apiApprovalDetail, apiDecideApproval } from '../../services/api'
import { API_BASE_URL } from '../../config'
import { silentLogin } from '../../services/auth'
import './index.scss'

/** 审批操作页：数据来自服务端，决定写入当前登录用户（POST /approvals/{id}/decide） */
function ApprovalReview() {
  const router = Taro.useRouter()
  const approvalId = router.params.approvalId

  const user = useAppStore((state) => state.user)

  const [approval, setApproval] = useState(null)
  const [decisions, setDecisions] = useState([])
  const [images, setImages] = useState([])
  const [missing, setMissing] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const myDecision = useMemo(
    () => decisions.find((d) => user && d.userId === user.id) || null,
    [decisions, user]
  )

  const load = async () => {
    if (!approvalId) {
      setMissing(true)
      return
    }
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

  useDidShow(() => {
    load()
  })

  const doLogin = async () => {
    const u = await silentLogin()
    if (u) load()
    else Taro.showToast({ title: '登录失败', icon: 'none' })
  }

  const decide = async (decision, note) => {
    setSubmitting(true)
    try {
      await apiDecideApproval(approvalId, decision, note || '')
      Taro.showToast({ title: decision === 'approved' ? '已通过' : '已驳回', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 600)
    } catch (e) {
      Taro.showToast({ title: e.message || '审批失败', icon: 'none' })
      setSubmitting(false)
    }
  }

  if (missing || (!approval && !missing)) {
    return (
      <View className='page'>
        <View className='empty-state'>{missing ? '这条审批不存在或已被处理' : '加载中…'}</View>
      </View>
    )
  }

  // 可审批判定：plaza 开放投票（服务端会补建决定记录）；group 需在发布时的审批名单内
  const inGroupList = Boolean(myDecision)
  const canDecide = approval.scope === 'plaza' || inGroupList
  const alreadyDecided = Boolean(myDecision && myDecision.decision !== 'pending')

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>好友审批</View>
        <View className='subtitle'>来自「{approval.groupName || '审核广场'}」的审批请求</View>
      </View>

      <View className='panel'>
        <View className='approval-review__tag'>请审批</View>
        <View className='approval-review__title'>{approval.title}</View>
        <View className='approval-review__price'>{formatPrice(approval.price)}</View>
        {approval.description ? (
          <View className='approval-review__desc'>{approval.description}</View>
        ) : null}
        {images.length ? (
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
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
        <View className='approval-review__meta'>
          {approval.category} · {approval.publisherName || '—'} 发布
        </View>
      </View>

      {!user ? (
        <View className='panel'>
          <View className='empty-state'>登录后即可参与审批</View>
          <Button block type='primary' onClick={doLogin}>微信登录</Button>
        </View>
      ) : alreadyDecided ? (
        <View className='approval-review__done'>
          你已作出决定（{MEMBER_STATUS_TEXT[myDecision.decision]}），结果不会改变。
        </View>
      ) : approval.scope === 'group' && !inGroupList ? (
        <View className='approval-review__done'>本次审批名单在发布时确定，你不在名单内。</View>
      ) : canDecide ? (
        <>
          {!rejecting ? (
            <View className='approval-review__actions'>
              <Button block type='primary' disabled={submitting} onClick={() => decide('approved', '')}>
                通过，买它
              </Button>
              <Button block fill='outline' type='danger' disabled={submitting} onClick={() => setRejecting(true)}>
                驳回，别买
              </Button>
            </View>
          ) : (
            <View className='panel'>
              <View className='field'>
                <View className='label'>驳回理由</View>
                <Textarea
                  className='textarea'
                  value={reason}
                  placeholder='告诉好友为什么劝退，例如：预算超了、已经有类似的'
                  onInput={(event) => setReason(event.detail.value)}
                />
              </View>
              <View className='approval-review__actions'>
                <Button block type='danger' disabled={submitting} onClick={() => decide('rejected', reason.trim())}>
                  确认驳回
                </Button>
                <Button block fill='outline' disabled={submitting} onClick={() => setRejecting(false)}>
                  再想想
                </Button>
              </View>
            </View>
          )}
        </>
      ) : null}
    </View>
  )
}

export default ApprovalReview
