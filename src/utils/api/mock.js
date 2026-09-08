import Taro from '@tarojs/taro'
import { STORAGE_KEYS } from '../../config'

const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const genCode = () => Array.from({ length: 6 }, () => codeChars[Math.floor(Math.random() * codeChars.length)]).join('')
const genId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`

const friendSeeds = ['小雨', '阿哲', '楠楠', '老陈', '乔乔', '大鹏']

function loadDb() {
  try {
    const db = Taro.getStorageSync(STORAGE_KEYS.mockDb)
    if (db && db.groups) return db
  } catch (e) { /* ignore */ }
  return buildSeed()
}

function buildSeed() {
  const now = Date.now()
  const users = {}
  friendSeeds.forEach((name, i) => {
    users[`mock_friend_${i}`] = {
      id: `mock_friend_${i}`,
      openid: `openid_friend_${i}`,
      nickname: name,
      avatar: '',
      createdAt: now,
    }
  })
  const db = { users, groups: [], members: [], approvals: [], decisions: [], sessions: {} }
  saveDb(db)
  return db
}

function saveDb(db) {
  Taro.setStorageSync(STORAGE_KEYS.mockDb, db)
}

function requireSession(db, token) {
  const userId = token && db.sessions[token]
  if (!userId || !db.users[userId]) {
    const err = new Error('未登录或登录已过期')
    err.code = 401
    throw err
  }
  return db.users[userId]
}

function findGroupByCode(db, code) {
  return db.groups.find((g) => g.code === String(code).toUpperCase())
}

function groupWithMembers(db, groupId) {
  const group = db.groups.find((g) => g.id === groupId)
  if (!group) {
    const err = new Error('群组不存在')
    err.code = 404
    throw err
  }
  const members = db.members
    .filter((m) => m.groupId === groupId)
    .map((m) => ({ ...m }))
  return { group: { ...group }, members }
}

export function handleMockRequest(method, path, data = {}, session = {}) {
  const db = loadDb()
  const token = session.token || ''
  const body = data || {}

  // ---- auth ----
  if (method === 'POST' && path === '/auth/wechat-login') {
    const openid = `openid_${body.code || 'demo'}`
    let user = Object.values(db.users).find((u) => u.openid === openid)
    if (!user) {
      user = {
        id: genId('u'),
        openid,
        nickname: '新用户',
        avatar: '',
        createdAt: Date.now(),
      }
      db.users[user.id] = user
    }
    const t = `mock_${user.id}`
    db.sessions[t] = user.id
    saveDb(db)
    return { token: t, user }
  }

  if (method === 'POST' && path === '/auth/logout') {
    delete db.sessions[token]
    saveDb(db)
    return { ok: true }
  }

  const user = requireSession(db, token)

  if (method === 'GET' && path === '/users/me') return { user }
  if (method === 'GET' && path === '/users/friends') {
    const friends = Object.values(db.users)
      .filter((u) => u.id !== user.id)
      .map((u) => ({ id: u.id, nickname: u.nickname, avatar: u.avatar, createdAt: u.createdAt }))
    return { friends }
  }
  if (method === 'PATCH' && path === '/users/me') {
    if (body.nickname == null && body.avatar == null) {
      const err = new Error('缺少修改字段')
      err.code = 400
      throw err
    }
    if (body.nickname != null) user.nickname = String(body.nickname).slice(0, 16)
    if (body.avatar != null) user.avatar = String(body.avatar)
    saveDb(db)
    return { user }
  }

  // ---- groups ----
  if (method === 'POST' && path === '/groups') {
    const name = String(body.name || '').trim()
    if (!name) {
      const err = new Error('请输入群组名称')
      err.code = 400
      throw err
    }
    const id = genId('g')
    const group = {
      id,
      name,
      code: genCode(),
      remark: String(body.remark || '').trim(),
      ownerId: user.id,
      ownerName: user.nickname,
      memberCount: 1,
      createdAt: Date.now(),
    }
    db.groups.push(group)
    db.members.push({
      id: genId('gm'),
      groupId: id,
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      role: 'owner',
      joinedAt: Date.now(),
    })
    saveDb(db)
    return { group: { ...group } }
  }

  if (method === 'GET' && path === '/groups/mine') {
    const groups = db.members
      .filter((m) => m.userId === user.id)
      .map((m) => {
        const g = db.groups.find((x) => x.id === m.groupId)
        return { ...g }
      })
      .filter(Boolean)
    return { groups }
  }

  if (method === 'GET' && /^\/groups\/[^/]+$/.test(path)) {
    return groupWithMembers(db, path.split('/')[2])
  }

  if (method === 'GET' && /^\/groups\/by-code\/[^/]+$/.test(path)) {
    const code = path.split('/')[3]
    const group = findGroupByCode(db, code)
    if (!group) {
      const err = new Error('群组码不存在')
      err.code = 409
      throw err
    }
    return { group: { ...group } }
  }

  if (method === 'POST' && path === '/groups/join') {
    const code = String(body.code || '').toUpperCase()
    const group = findGroupByCode(db, code)
    if (!group) {
      const err = new Error('群组码不存在')
      err.code = 409
      throw err
    }
    const exists = db.members.find((m) => m.groupId === group.id && m.userId === user.id)
    if (exists) {
      const err = new Error('你已加入该群组')
      err.code = 409
      throw err
    }
    const member = {
      id: genId('gm'),
      groupId: group.id,
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      role: 'member',
      joinedAt: Date.now(),
    }
    db.members.push(member)
    group.memberCount += 1
    saveDb(db)
    return { group: { ...group }, member }
  }

  if (method === 'POST' && /^\/groups\/[^/]+\/invite$/.test(path)) {
    const groupId = path.split('/')[2]
    const memberIds = Array.isArray(body.memberIds) ? body.memberIds : []
    let invited = 0
    memberIds.forEach((userId) => {
      const u = db.users[userId] || {
        id: userId,
        nickname: `好友${userId.slice(-2)}`,
        avatar: '',
      }
      if (db.users[userId] == null) db.users[userId] = u
      const exists = db.members.some((m) => m.groupId === groupId && m.userId === userId)
      if (!exists) {
        db.members.push({
          id: genId('gm'),
          groupId,
          userId,
          nickname: u.nickname,
          avatar: u.avatar,
          role: 'member',
          joinedAt: Date.now(),
        })
        const g = db.groups.find((x) => x.id === groupId)
        if (g) g.memberCount += 1
        invited += 1
      }
    })
    saveDb(db)
    return { invited }
  }

  // ---- approvals ----
  if (method === 'POST' && path === '/approvals') {
    const title = String(body.title || '').trim()
    const price = Number(body.price)
    if (!title || Number.isNaN(price) || price <= 0) {
      const err = new Error('参数有误')
      err.code = 400
      throw err
    }
    const group = db.groups.find((g) => g.id === body.groupId)
    if (!group) {
      const err = new Error('群组不存在')
      err.code = 404
      throw err
    }
    const approval = {
      id: genId('ap'),
      groupId: group.id,
      groupName: group.name,
      publisherId: user.id,
      publisherName: user.nickname,
      title,
      price,
      category: String(body.category || '其他'),
      description: String(body.description || '').trim(),
      alternative: String(body.alternative || '').trim(),
      status: 'pending',
      images: [],
      createdAt: Date.now(),
    }
    db.approvals.push(approval)
    saveDb(db)
    return { approval: { ...approval } }
  }

  if (method === 'GET' && path === '/approvals/mine') {
    const approvals = db.approvals
      .filter((a) => a.publisherId === user.id)
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((a) => ({ ...a }))
    return { approvals }
  }

  if (method === 'GET' && /^\/approvals\/[^/]+$/.test(path)) {
    const approvalId = path.split('/')[2]
    const approval = db.approvals.find((a) => a.id === approvalId)
    if (!approval) {
      const err = new Error('审批不存在')
      err.code = 404
      throw err
    }
    const decisions = db.decisions
      .filter((d) => d.approvalId === approvalId)
      .map((d) => ({ ...d }))
    return { approval: { ...approval }, decisions, images: approval.images || [] }
  }

  if (method === 'POST' && /^\/approvals\/[^/]+\/decide$/.test(path)) {
    const approvalId = path.split('/')[2]
    const approval = db.approvals.find((a) => a.id === approvalId)
    if (!approval) {
      const err = new Error('审批不存在')
      err.code = 404
      throw err
    }
    const decision = String(body.decision || '')
    if (decision !== 'approved' && decision !== 'rejected') {
      const err = new Error('决定无效')
      err.code = 400
      throw err
    }
    db.decisions = db.decisions.filter(
      (d) => !(d.approvalId === approvalId && d.userId === user.id)
    )
    db.decisions.push({
      id: genId('ad'),
      approvalId,
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      decision,
      reason: String(body.reason || '').trim(),
      decidedAt: Date.now(),
    })
    const decided = db.decisions.filter((d) => d.approvalId === approvalId && d.decision !== 'pending')
    const members = db.members.filter((m) => m.groupId === approval.groupId)
    approval.status = decided.some((d) => d.decision === 'rejected')
      ? 'rejected'
      : decided.length >= members.length
        ? 'approved'
        : 'pending'
    saveDb(db)
    return {
      decision: { ...db.decisions[db.decisions.length - 1] },
      status: approval.status,
    }
  }

  const err = new Error(`Mock 未实现: ${method} ${path}`)
  err.code = 404
  throw err
}
