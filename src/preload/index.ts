import { contextBridge, ipcRenderer } from 'electron'
import type { Trade, Session, User, UserSettings } from '../types'

// 暴露受保护的方法给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 认证相关 API
  register: (email: string, password: string): Promise<User> =>
    ipcRenderer.invoke('auth:register', email, password),
  login: (email: string, password: string): Promise<User | null> =>
    ipcRenderer.invoke('auth:login', email, password),
  getSettings: (userId: number): Promise<UserSettings | null> =>
    ipcRenderer.invoke('auth:getSettings', userId),
  updateSettings: (userId: number, updates: Partial<UserSettings>): Promise<UserSettings> =>
    ipcRenderer.invoke('auth:updateSettings', userId, updates),

  // 交易相关 API
  getTrades: (userId: number, sessionId?: number): Promise<Trade[]> =>
    ipcRenderer.invoke('db:getTrades', userId, sessionId),
  getTrade: (id: number): Promise<Trade | null> =>
    ipcRenderer.invoke('db:getTrade', id),
  createTrade: (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>): Promise<Trade> =>
    ipcRenderer.invoke('db:createTrade', trade),
  updateTrade: (id: number, updates: Partial<Trade>): Promise<Trade | null> =>
    ipcRenderer.invoke('db:updateTrade', id, updates),
  deleteTrade: (id: number): Promise<boolean> =>
    ipcRenderer.invoke('db:deleteTrade', id),
  clearTrades: (userId: number, sessionId?: number): Promise<boolean> =>
    ipcRenderer.invoke('db:clearTrades', userId, sessionId),

  // 会话相关 API
  getSessions: (userId: number): Promise<Session[]> =>
    ipcRenderer.invoke('db:getSessions', userId),
  getActiveSession: (userId: number): Promise<Session | null> =>
    ipcRenderer.invoke('db:getActiveSession', userId),
  createSession: (userId: number, initialCapital: number, currency?: string): Promise<Session> =>
    ipcRenderer.invoke('db:createSession', userId, initialCapital, currency),
  updateSession: (sessionId: number, updates: Partial<Session>): Promise<Session | null> =>
    ipcRenderer.invoke('db:updateSession', sessionId, updates),
  resetSessionCounter: (userId: number): Promise<void> =>
    ipcRenderer.invoke('db:resetSessionCounter', userId),

  // 计算相关 API
  calculateNextTradeAmount: (params: {
    currentBalance: number
    previousTradeAmount: number | null
    previousResult: 'win' | 'loss' | null
    riskPercent: number
    recoveryMultiplier: number
    payoutPercent: number
  }): Promise<number> =>
    ipcRenderer.invoke('calc:nextTradeAmount', params),
  calculateTradeReturn: (params: {
    tradeAmount: number
    result: 'win' | 'loss'
    payoutPercent: number
  }): Promise<number> =>
    ipcRenderer.invoke('calc:tradeReturn', params),

  // 导出 API
  exportTrades: (userId: number, sessionId?: number): Promise<string> =>
    ipcRenderer.invoke('export:trades', userId, sessionId),

  // 菜单事件监听
  onMenuNewTrade: (callback: () => void) => {
    ipcRenderer.on('menu-new-trade', callback)
    return () => ipcRenderer.removeListener('menu-new-trade', callback)
  },

  // 语言切换
  sendLanguageChange: (lang: string) => {
    ipcRenderer.send('language-changed', lang)
  }
})
