import { create } from 'zustand'
import type { Trade } from '../../../types'

interface TradeStore {
  trades: Trade[]
  loading: boolean
  error: string | null

  // Actions
  fetchTrades: (userId: number, sessionId?: number) => Promise<void>
  addTrade: (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateTrade: (id: number, updates: Partial<Trade>) => Promise<void>
  deleteTrade: (id: number) => Promise<void>
  clearTrades: (userId: number, sessionId?: number) => Promise<void>
}

export const useTradeStore = create<TradeStore>((set, _get) => ({
  trades: [],
  loading: false,
  error: null,

  fetchTrades: async (userId: number, sessionId?: number) => {
    set({ loading: true, error: null })
    try {
      const trades = await window.electronAPI.getTrades(userId, sessionId)
      set({ trades, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch trades',
        loading: false
      })
    }
  },

  addTrade: async (trade) => {
    set({ loading: true, error: null })
    try {
      const newTrade = await window.electronAPI.createTrade(trade)
      set((state) => ({
        trades: [...state.trades, newTrade].sort((a, b) => a.sequence_number - b.sequence_number),
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create trade',
        loading: false
      })
      throw error
    }
  },

  updateTrade: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const updatedTrade = await window.electronAPI.updateTrade(id, updates)
      if (updatedTrade) {
        set((state) => ({
          trades: state.trades.map((t) => (t.id === id ? updatedTrade : t)),
          loading: false
        }))
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update trade',
        loading: false
      })
      throw error
    }
  },

  deleteTrade: async (id) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.deleteTrade(id)
      set((state) => ({
        trades: state.trades.filter((t) => t.id !== id),
        loading: false
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete trade',
        loading: false
      })
      throw error
    }
  },

  clearTrades: async (userId: number, sessionId?: number) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.clearTrades(userId, sessionId)
      set({ trades: [], loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to clear trades',
        loading: false
      })
      throw error
    }
  }
}))
