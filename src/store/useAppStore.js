import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createWheelPresetGroup, defaultWheelOptions, defaultWheelPresetGroups } from '../utils/wheelPresets'
import { ACCOUNT_TYPES } from '../utils/accounts'
import { STORAGE_KEYS } from '../config'

const taroStorage = {
  getItem: (name) => {
    try {
      return Taro.getStorageSync(name) || null
    } catch (error) {
      return null
    }
  },
  setItem: (name, value) => {
    Taro.setStorageSync(name, value)
  },
  removeItem: (name) => {
    Taro.removeStorageSync(name)
  },
}

const keepRecent = (items, limit = 50) => items.slice(0, limit)

export const useAppStore = create(
  persist(
    (set) => ({
      wheelOptions: defaultWheelOptions,
      wheelPresetGroups: defaultWheelPresetGroups,
      approvalItems: [],
      ledgerRecords: [],
      accounts: [],
      transfers: [],
      homeTheme: 'ledger',
      token: '',
      user: null,
      myGroups: [],
      histories: {
        wheel: [],
        xiaoliuren: [],
        liuyao: [],
        tarot: [],
      },
      setSession: ({ token, user }) => {
        Taro.setStorageSync(STORAGE_KEYS.token, token)
        set({ token, user })
      },
      setUser: (user) => set({ user }),
      clearSession: () => {
        Taro.removeStorageSync(STORAGE_KEYS.token)
        set({ token: '', user: null })
      },
      setMyGroups: (myGroups) => set({ myGroups }),
      setHomeTheme: (homeTheme) => set({ homeTheme }),
      addLedgerRecord: (record) =>
        set((state) => ({
          ledgerRecords: [
            {
              id: `ledger-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              createdAt: Date.now(),
              ...record,
            },
            ...(state.ledgerRecords || []),
          ],
        })),
      removeLedgerRecord: (id) =>
        set((state) => ({
          ledgerRecords: (state.ledgerRecords || []).filter((item) => item.id !== id),
        })),
      addAccount: (account) =>
        set((state) => ({
          accounts: [
            {
              id: `acc-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              createdAt: Date.now(),
              type: ACCOUNT_TYPES[0].id,
              initial: 0,
              ...account,
            },
            ...(state.accounts || []),
          ],
        })),
      removeAccount: (id) =>
        set((state) => ({
          accounts: (state.accounts || []).filter((a) => a.id !== id),
          transfers: (state.transfers || []).filter((t) => t.fromId !== id && t.toId !== id),
        })),
      addTransfer: (transfer) =>
        set((state) => ({
          transfers: [
            {
              id: `tr-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              createdAt: Date.now(),
              ...transfer,
            },
            ...(state.transfers || []),
          ],
        })),
      updateLedgerRecord: (id, patch) =>
        set((state) => ({
          ledgerRecords: (state.ledgerRecords || []).map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        })),
      setWheelOptions: (wheelOptions) => set({ wheelOptions }),
      addWheelPresetGroup: (name, options) =>
        set((state) => ({
          wheelPresetGroups: [createWheelPresetGroup(name, options), ...(state.wheelPresetGroups || [])],
        })),
      importWheelPresetGroups: (groups) =>
        set((state) => ({
          wheelPresetGroups: [...groups, ...(state.wheelPresetGroups || [])],
        })),
      updateWheelPresetGroup: (id, patch) =>
        set((state) => ({
          wheelPresetGroups: (state.wheelPresetGroups || []).map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        })),
      removeWheelPresetGroup: (id) =>
        set((state) => ({
          wheelPresetGroups: (state.wheelPresetGroups || []).filter((item) => item.id !== id),
        })),
      addWheelOption: () =>
        set((state) => ({
          wheelOptions: [
            ...state.wheelOptions,
            { id: `${Date.now()}`, label: `选项 ${state.wheelOptions.length + 1}`, weight: 1 },
          ],
        })),
      updateWheelOption: (id, patch) =>
        set((state) => ({
          wheelOptions: state.wheelOptions.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        })),
      removeWheelOption: (id) =>
        set((state) => ({
          wheelOptions: state.wheelOptions.filter((item) => item.id !== id),
        })),
      addHistory: (type, record) =>
        set((state) => ({
          histories: {
            ...state.histories,
            [type]: keepRecent([{ id: `${Date.now()}`, createdAt: Date.now(), ...record }, state.histories[type]]),
          },
        })),
      clearHistory: (type) =>
        set((state) => ({
          histories: type
            ? { ...state.histories, [type]: [] }
            : { wheel: [], xiaoliuren: [], liuyao: [], tarot: [] },
        })),
      // 审批数据以服务端为准（GET /approvals/mine），本字段仅作跨页缓存
      setApprovalItems: (approvalItems) => set({ approvalItems: approvalItems || [] }),
    }),
    {
      name: 'apollo-tools-store',
      storage: createJSONStorage(() => taroStorage),
    }
  )
)
