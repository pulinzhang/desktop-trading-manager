/// <reference types="vite/client" />
import type { Trade, Session, User, UserSettings } from '../../types'

declare global {
  interface Window {
    electronAPI: {
      // 认证相关
      register: (email: string, password: string) => Promise<User>
      login: (email: string, password: string) => Promise<User | null>
      getSettings: (userId: number) => Promise<UserSettings | null>
      updateSettings: (userId: number, updates: Partial<UserSettings>) => Promise<UserSettings>

      // 交易相关
      getTrades: (userId: number, sessionId?: number) => Promise<Trade[]>
      getTrade: (id: number) => Promise<Trade | null>
      createTrade: (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>) => Promise<Trade>
      updateTrade: (id: number, updates: Partial<Trade>) => Promise<Trade | null>
      deleteTrade: (id: number) => Promise<boolean>
      clearTrades: (userId: number, sessionId?: number) => Promise<boolean>

      // 会话相关
      getSessions: (userId: number) => Promise<Session[]>
      getActiveSession: (userId: number) => Promise<Session | null>
      createSession: (userId: number, initialCapital: number, currency?: string) => Promise<Session>
      updateSession: (sessionId: number, updates: Partial<Session>) => Promise<Session | null>
      resetSessionCounter: (userId: number) => Promise<void>

      // 计算相关
      calculateNextTradeAmount: (params: {
        currentBalance: number
        previousTradeAmount: number | null
        previousResult: 'win' | 'loss' | null
        riskPercent: number
        recoveryMultiplier: number
        payoutPercent: number
      }) => Promise<number>
      calculateTradeReturn: (params: {
        tradeAmount: number
        result: 'win' | 'loss'
        payoutPercent: number
      }) => Promise<number>

      // 导出
      exportTrades: (userId: number, sessionId?: number) => Promise<string>

      // 菜单事件
      onMenuNewTrade: (callback: () => void) => () => void

      // 语言切换
      sendLanguageChange: (lang: string) => void
    }
  }
}
