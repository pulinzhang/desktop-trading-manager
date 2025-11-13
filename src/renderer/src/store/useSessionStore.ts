import { create } from 'zustand'
import type { Session } from '../../../types'

interface SessionStore {
  activeSession: Session | null
  sessions: Session[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchActiveSession: (userId: number) => Promise<void>
  fetchSessions: (userId: number) => Promise<void>
  createSession: (userId: number, initialCapital: number, currency?: string) => Promise<void>
  updateSession: (sessionId: number, updates: Partial<Session>) => Promise<void>
  resetSessionCounter: (userId: number) => Promise<void>
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  activeSession: null,
  sessions: [],
  loading: false,
  error: null,

  fetchActiveSession: async (userId: number) => {
    set({ loading: true, error: null })
    try {
      const session = await window.electronAPI.getActiveSession(userId)
      set({ activeSession: session, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取会话失败', loading: false })
    }
  },

  fetchSessions: async (userId: number) => {
    set({ loading: true, error: null })
    try {
      const sessions = await window.electronAPI.getSessions(userId)
      set({ sessions, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取会话列表失败', loading: false })
    }
  },

  createSession: async (userId: number, initialCapital: number, currency?: string) => {
    set({ loading: true, error: null })
    try {
      const newSession = await window.electronAPI.createSession(userId, initialCapital, currency)
      set({ activeSession: newSession, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建会话失败', loading: false })
      throw error
    }
  },

  updateSession: async (sessionId: number, updates: Partial<Session>) => {
    set({ loading: true, error: null })
    try {
      const updatedSession = await window.electronAPI.updateSession(sessionId, updates)
      if (updatedSession) {
        set((state) => ({
          activeSession: state.activeSession?.id === sessionId ? updatedSession : state.activeSession,
          sessions: state.sessions.map((s) => (s.id === sessionId ? updatedSession : s)),
          loading: false
        }))
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新会话失败', loading: false })
      throw error
    }
  },

  resetSessionCounter: async (userId: number) => {
    set({ loading: true, error: null })
    try {
      await window.electronAPI.resetSessionCounter(userId)
      set({ loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '重置会话计数器失败', loading: false })
    }
  }
}))

