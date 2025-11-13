import { create } from 'zustand'
import type { User, UserSettings } from '../../../types'
import i18n from '../i18n'

interface AuthStore {
  user: User | null
  settings: UserSettings | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  loadSettings: () => Promise<void>
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
}

// Validate that electronAPI is available
const checkElectronAPI = () => {
  if (!window.electronAPI) {
    throw new Error(i18n.t('login.electronApiNotInitialized'))
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  settings: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      checkElectronAPI()
      const user = await window.electronAPI.login(email, password)
      if (!user) {
        throw new Error(i18n.t('login.invalidCredentials'))
      }
      set({ user, isAuthenticated: true, loading: false })
      // Load user settings
      await get().loadSettings()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('login.loginFailed'),
        loading: false
      })
      throw error
    }
  },

  register: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      checkElectronAPI()
      const user = await window.electronAPI.register(email, password)
      set({ user, isAuthenticated: true, loading: false })
      // Load user settings
      await get().loadSettings()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : i18n.t('login.registerFailed'),
        loading: false
      })
      throw error
    }
  },

  logout: () => {
    set({ user: null, settings: null, isAuthenticated: false, error: null })
  },

  loadSettings: async () => {
    const { user } = get()
    if (!user) return

    try {
      checkElectronAPI()
      const settings = await window.electronAPI.getSettings(user.id)
      set({ settings })
    } catch (error) {
      console.error(i18n.t('login.loadSettingsFailed'), error)
    }
  },

  updateSettings: async (updates: Partial<UserSettings>) => {
    const { user } = get()
    if (!user) throw new Error(i18n.t('login.userNotLoggedIn'))

    try {
      checkElectronAPI()
      const updatedSettings = await window.electronAPI.updateSettings(user.id, updates)
      set({ settings: updatedSettings })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : i18n.t('login.updateSettingsFailed') })
      throw error
    }
  }
}))
