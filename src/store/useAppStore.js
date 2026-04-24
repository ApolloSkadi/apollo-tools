import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

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
      wheelOptions: [
        { id: '1', label: '选项 A', weight: 1 },
        { id: '2', label: '选项 B', weight: 1 },
        { id: '3', label: '选项 C', weight: 1 },
      ],
      histories: {
        wheel: [],
        xiaoliuren: [],
        liuyao: [],
      },
      setWheelOptions: (wheelOptions) => set({ wheelOptions }),
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
            : { wheel: [], xiaoliuren: [], liuyao: [] },
        })),
    }),
    {
      name: 'apollo-tools-store',
      storage: createJSONStorage(() => taroStorage),
    }
  )
)
