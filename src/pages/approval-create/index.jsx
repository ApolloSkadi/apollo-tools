import React, { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Input, Textarea, View, Text, Image } from '@tarojs/components'
import Reicon from '../../components/Reicon'
import { useAppStore } from '../../store/useAppStore'
import { APPROVAL_CATEGORIES, needForCount } from '../../utils/approval'
import { apiMyGroups, apiGroupDetail, apiCreateApproval, apiUploadApprovalImage, apiMyApprovals } from '../../services/api'
import './index.scss'

function ApprovalCreate() {
  const setApprovalItems = useAppStore((state) => state.setApprovalItems)
  const myGroups = useAppStore((state) => state.myGroups)
  const setMyGroups = useAppStore((state) => state.setMyGroups)

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(APPROVAL_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [alternative, setAlternative] = useState('')
  const [groupId, setGroupId] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [needCount, setNeedCount] = useState(0)

  const group = useMemo(() => myGroups.find((g) => g.id === groupId) || myGroups[0], [myGroups, groupId])
  const totalMembers = members.length

  useEffect(() => {
    const load = async () => {
      if (myGroups.length) return
      try {
        const { groups } = await apiMyGroups()
        setMyGroups(groups)
      } catch (e) { /* ignore */ }
    }
    load()
  }, [])

  useEffect(() => {
    if (!group) return
    setGroupId(group.id)
    const loadMembers = async () => {
      try {
        const res = await apiGroupDetail(group.id)
        setMembers(res.members)
      } catch (e) { /* ignore */ }
    }
    loadMembers()
  }, [group && group.id])

  const chooseImage = () => {
    const remaining = 3 - images.length
    if (remaining <= 0) return
    Taro.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      success: (res) => {
        setImages((prev) => [...prev, ...(res.tempFilePaths || [])].slice(0, 3))
      },
    })
  }

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const submit = async () => {
    const cleanTitle = title.trim()
    const cleanPrice = Number(price)

    if (!cleanTitle) {
      Taro.showToast({ title: '请输入物品名称', icon: 'none' })
      return
    }
    if (Number.isNaN(cleanPrice) || cleanPrice < 0) {
      Taro.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }
    if (!group) {
      Taro.showToast({ title: '请先创建或加入一个群组', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const { approval } = await apiCreateApproval({
        groupId: group.id,
        title: cleanTitle,
        price: cleanPrice,
        category,
        description: description.trim(),
        alternative: alternative.trim(),
        needCount,
      })

      // 逐个上传图片（WeChat uploadFile 一次一个文件），失败单张不阻断
      for (const path of images) {
        try {
          await apiUploadApprovalImage(approval.id, path)
        } catch (e) {
          Taro.showToast({ title: e.message || '图片上传失败', icon: 'none' })
        }
      }

      // 列表以服务端为准：发布后重新拉取，供首页/记录页展示
      try {
        const res = await apiMyApprovals()
        setApprovalItems(res.approvals || [])
      } catch (e) { /* ignore */ }

      Taro.showToast({ title: '已发布并同步到群组', icon: 'success' })
      Taro.navigateBack()
    } catch (e) {
      Taro.showToast({ title: e.message || '发布失败', icon: 'none' })
      setLoading(false)
    }
  }

  return (
    <View className='page'>
      <View className='hero'>
        <View className='title'>发布购物审批</View>
        <View className='subtitle'>发到你的群里，让群好友一起投票帮你冷静。</View>
      </View>

      <View className='panel'>
        <View className='field'>
          <View className='label'>审批群组</View>
          <View className='approval-groups'>
            {myGroups.length ? (
              myGroups.map((g) => {
                const active = g.id === groupId
                return (
                  <View
                    className={`approval-group ${active ? 'approval-group--active' : ''}`}
                    key={g.id}
                    onClick={() => setGroupId(g.id)}
                  >
                    <Reicon name='Users' size={15} color={active ? '#2c2c2c' : '#707070'} />
                    <Text className='approval-group__name'>{g.name}</Text>
                  </View>
                )
              })
            ) : (
              <View className='approval-groups__empty'>
                还没有群组，去「我的-群组」创建或加入
              </View>
            )}
          </View>
        </View>

        <View className='field'>
          <View className='label'>物品名称</View>
          <Input
            className='input'
            value={title}
            placeholder='例如：新款机械键盘'
            onInput={(event) => setTitle(event.detail.value)}
          />
        </View>

        <View className='field'>
          <View className='label'>价格</View>
          <Input
            className='input'
            type='digit'
            value={price}
            placeholder='例如：899'
            onInput={(event) => setPrice(event.detail.value)}
          />
        </View>

        <View className='field'>
          <View className='label'>分类</View>
          <View className='cat-tags'>
            {APPROVAL_CATEGORIES.map((c) => {
              const active = c === category
              return (
                <View
                  key={c}
                  className={`cat-tag ${active ? 'cat-tag--active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </View>
              )
            })}
          </View>
        </View>

        <View className='field'>
          <View className='label'>描述</View>
          <Textarea
            className='textarea'
            value={description}
            placeholder='为什么想买？用途、理由等'
            onInput={(event) => setDescription(event.detail.value)}
          />
        </View>

        <View className='field'>
          <View className='label'>替代品（选填）</View>
          <Input
            className='input'
            value={alternative}
            placeholder='如果不买，可以用什么替代？'
            onInput={(event) => setAlternative(event.detail.value)}
          />
          <View className='cat-tags__hint'>填写后，若审批被驳回会展示该替代建议</View>
        </View>

        <View className='field'>
          <View className='label'>通过规则</View>
          <View className='cat-tags'>
            <View
              className={`cat-tag ${needCount === 0 ? 'cat-tag--active' : ''}`}
              onClick={() => setNeedCount(0)}
            >
              默认（>50%）
            </View>
            {Array.from({ length: totalMembers }).map((_, i) => {
              const n = i + 1
              return (
                <View
                  key={n}
                  className={`cat-tag ${needCount === n ? 'cat-tag--active' : ''}`}
                  onClick={() => setNeedCount(n)}
                >
                  {n} 人
                </View>
              )
            })}
          </View>
          <View className='cat-tags__hint'>
            {needCount === 0
              ? `需超过 ${needForCount(totalMembers, 0)} 人通过（超过审批人数的 50%）`
              : `需 ${needCount} 人通过`}
          </View>
        </View>

        <View className='field'>
          <View className='label'>图片（至多 3 张）</View>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {images.map((src, index) => (
              <View key={src} style={{ position: 'relative' }}>
                <Image
                  src={src}
                  mode='aspectFill'
                  style={{ width: '84px', height: '84px', borderRadius: '8px' }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#dc3545',
                    color: '#fff',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => removeImage(index)}
                >
                  ×
                </View>
              </View>
            ))}
            {images.length < 3 && (
              <View
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '8px',
                  border: '1px dashed #c8c8c8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                }}
                onClick={chooseImage}
              >
                +
              </View>
            )}
          </View>
        </View>
      </View>

      <View className='group-member-note'>发布后，群内 {members.length || group && group.memberCount || 0} 位成员可审批。</View>

      <View className='approval-create__submit' onClick={submit}>
        <Text>{loading ? '发布中…' : '发布到群组'}</Text>
      </View>
    </View>
  )
}

export default ApprovalCreate
