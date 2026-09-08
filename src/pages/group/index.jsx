import React, { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import { apiGroupDetail, apiInviteGroup, apiFriends } from '../../services/api'
import './index.scss'

function Group() {
  const router = Taro.useRouter()
  const [groupId, setGroupId] = useState('')
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected] = useState([])

  Taro.useShareAppMessage(() => ({
    title: group ? `加入我的「${group.name}」` : '加入群组',
    path: group ? `/pages/group-join/index?groupCode=${group.code}` : '/pages/group/index',
  }))

  useEffect(() => {
    const gid = (router.params && router.params.groupId) || ''
    if (gid) setGroupId(gid)
  }, [router.params])

  const load = async () => {
    if (!groupId) return
    try {
      const res = await apiGroupDetail(groupId)
      setGroup(res.group)
      setMembers(res.members)
      const { friends } = await apiFriends()
      setCandidates(friends.filter((f) => !res.members.some((m) => m.userId === f.id)))
    } catch (e) {
      Taro.showToast({ title: e.message || '加载失败', icon: 'none' })
    }
  }

  useEffect(() => {
    if (groupId) load()
  }, [groupId])

  const copyCode = () => {
    if (!group) return
    Taro.setClipboardData({ data: group.code }).then(() => {
      Taro.showToast({ title: '群组码已复制', icon: 'success' })
    })
  }

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const submitInvite = async () => {
    if (!selected.length) {
      Taro.showToast({ title: '请选择好友', icon: 'none' })
      return
    }
    try {
      await apiInviteGroup(groupId, selected)
      setSelected([])
      setInviteOpen(false)
      Taro.showToast({ title: '已邀请', icon: 'success' })
      load()
    } catch (e) {
      Taro.showToast({ title: e.message || '邀请失败', icon: 'none' })
    }
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>{group ? group.name : '群组'}</View>
        <View className='subtitle'>群组设置、群组码与好友邀请都在这里。</View>
      </View>

      {!group ? (
        <View className='empty-state'>加载中…</View>
      ) : (
        <View>
          <View className='group-card'>
            <View className='group-card__row'>
              <View className='group-card__label'>群组码</View>
              <View className='group-card__code'>{group.code}</View>
              <View className='group-card__copy' onClick={copyCode}>复制</View>
            </View>
            <View className='group-card__row'>
              <View className='group-card__label'>群主</View>
              <View className='group-card__value'>{group.ownerName}</View>
            </View>
            <View className='group-card__row'>
              <View className='group-card__label'>成员</View>
              <View className='group-card__value'>{group.memberCount} 人</View>
            </View>
            {group.remark ? (
              <View className='group-card__row'>
                <View className='group-card__label'>简介</View>
                <View className='group-card__value'>{group.remark}</View>
              </View>
            ) : null}
          </View>

          <View className='group-actions'>
            <View className='group-action' onClick={() => setInviteOpen(true)}>
              <Reicon name='Plus' size={16} color='#2c2c2c' />
              <Text>邀请好友</Text>
            </View>
            <View className='group-action' onClick={copyCode}>
              <Reicon name='Share' size={16} color='#2c2c2c' />
              <Text>发送给好友</Text>
            </View>
          </View>

          <View className='section-title'>群成员</View>
          <View className='group-members'>
            {members.map((m) => (
              <View className='group-member' key={m.id}>
                <View className='group-member__avatar'>
                  {m.avatar ? (
                    <Image className='group-member__img' src={m.avatar} mode='aspectFill' />
                  ) : (
                    <Text>{m.nickname ? m.nickname.slice(0, 1) : '?'}</Text>
                  )}
                </View>
                <View className='group-member__name'>{m.nickname}</View>
                {m.role === 'owner' && <View className='group-member__owner'>群主</View>}
              </View>
            ))}
          </View>

          <View className='group-hint'>用群组码或分享链接邀请好友加入，好友也能用群组码直接加入。</View>
        </View>
      )}

      {inviteOpen && (
        <View className='invite-mask' onClick={() => setInviteOpen(false)}>
          <View className='invite-sheet' onClick={(e) => e.stopPropagation()}>
            <View className='invite-sheet__grab' />
            <View className='invite-sheet__title'>邀请好友加入</View>
            {candidates.length ? (
              <View className='invite-list'>
                {candidates.map((f) => {
                  const active = selected.includes(f.id)
                  return (
                    <View className={`invite-item ${active ? 'invite-item--active' : ''}`} key={f.id} onClick={() => toggleSelect(f.id)}>
                      <View className='invite-item__avatar'>{f.nickname.slice(0, 1)}</View>
                      <View className='invite-item__name'>{f.nickname}</View>
                      <View className='invite-item__check'>{active ? '✓' : '+'}</View>
                    </View>
                  )
                })}
              </View>
            ) : (
              <View className='empty-state'>暂无可邀请的好友</View>
            )}
            <View className='invite-sheet__submit' onClick={submitInvite}>邀请（{selected.length}）</View>
          </View>
        </View>
      )}
    </View>
  )
}

export default Group
