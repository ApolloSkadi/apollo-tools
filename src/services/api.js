import { httpGet, httpPost, httpPatch, httpDelete, httpUpload } from '../utils/api/request'

// ---- auth & user ----
export const apiWechatLogin = (code) => httpPost('/auth/wechat-login', { code })
export const apiLogout = () => httpPost('/auth/logout')
export const apiGetMe = () => httpGet('/users/me')
export const apiUpdateMe = (patch) => httpPatch('/users/me', patch)
export const apiFriends = () => httpGet('/users/friends')

// ---- groups ----
export const apiCreateGroup = (payload) => httpPost('/groups', payload)
export const apiMyGroups = () => httpGet('/groups/mine')
export const apiGroupDetail = (groupId) => httpGet(`/groups/${groupId}`)
export const apiGroupByCode = (code) => httpGet(`/groups/by-code/${code}`)
export const apiJoinGroup = (code) => httpPost('/groups/join', { code })
export const apiInviteGroup = (groupId, memberIds) => httpPost(`/groups/${groupId}/invite`, { memberIds })

// ---- approvals ----
export const apiCreateApproval = (payload) => httpPost('/approvals', payload)
export const apiMyApprovals = () => httpGet('/approvals/mine')
export const apiApprovalDetail = (approvalId) => httpGet(`/approvals/${approvalId}`)
export const apiDecideApproval = (approvalId, decision, reason = '') =>
  httpPost(`/approvals/${approvalId}/decide`, { decision, reason })

// ---- approval images (单文件上传；多图由页面逐个调用) ----
export const apiUploadApprovalImage = (approvalId, filePath) =>
  httpUpload(`/approvals/${approvalId}/images`, { filePath, name: 'files' })
export const apiDeleteApprovalImage = (approvalId, imageId) =>
  httpDelete(`/approvals/${approvalId}/images/${imageId}`)
