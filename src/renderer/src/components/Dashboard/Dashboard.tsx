import { useEffect, useState } from 'react'
import { Layout, Button, Space, Switch } from 'antd'
import { LogoutOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { TradeTable } from '../TradeTable/TradeTable'
import { CalculationsPanel } from '../CalculationsPanel/CalculationsPanel'
import { SessionPanel } from '../SessionPanel/SessionPanel'
import { SessionChart } from '../SessionChart/SessionChart'
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher'
import { useAuthStore } from '../../store/useAuthStore'
import { useSessionStore } from '../../store/useSessionStore'
import type { Session } from '../../../../types'
import './Dashboard.css'

const { Content } = Layout

interface DashboardProps {
  isDark: boolean
  setIsDark: (isDark: boolean) => void
}

export function Dashboard({ isDark, setIsDark }: DashboardProps) {
  const { t } = useTranslation()
  const { logout, user, loadSettings } = useAuthStore()
  const { fetchActiveSession, createSession } = useSessionStore()
  const [showChart, setShowChart] = useState(() => {
    const saved = localStorage.getItem('showChart')
    return saved ? saved === 'true' : true
  })

  useEffect(() => {
    const initialize = async () => {
      if (user) {
        await loadSettings()
        await fetchActiveSession(user.id)
        // Ensure there is an active session; create one if missing
        const currentSettings = await window.electronAPI.getSettings(user.id)
        if (currentSettings) {
          const sessions = await window.electronAPI.getSessions(user.id)
          const activeSession = sessions.find((session: Session) => session.is_active === 1)
          if (!activeSession) {
            await createSession(user.id, currentSettings.initial_capital, currentSettings.currency)
          }
        }
      }
    }
    initialize()
  }, [user, loadSettings, fetchActiveSession, createSession])

  useEffect(() => {
    localStorage.setItem('showChart', showChart.toString())
  }, [showChart])

  return (
    <Layout
      className={`dashboard-layout ${isDark ? 'dark' : 'light'}`}
      style={{ minHeight: '100vh', background: isDark ? '#1f1f1f' : '#f0f0f0' }}
    >
      <div className={`dashboard-header ${isDark ? 'dark' : 'light'}`}>
        <h1>{t('dashboard.title')}</h1>
        <Space>
          <Space size="small">
            <span style={{ color: isDark ? '#fff' : '#000', fontSize: '14px' }}>
              {t('session.chart')}
            </span>
            <Switch checked={showChart} onChange={setShowChart} size="small" />
          </Space>
          <Button
            type="text"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={() => setIsDark(!isDark)}
            title={isDark ? t('settings.lightMode') : t('settings.darkMode')}
            style={{ color: isDark ? '#fff' : '#000' }}
          />
          <LanguageSwitcher />
          <span style={{ color: isDark ? '#8c8c8c' : '#666' }}>{user?.email}</span>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={logout}
            style={{ color: isDark ? '#fff' : '#000' }}
          >
            {t('common.logout')}
          </Button>
        </Space>
      </div>
      <Content
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: 'calc(100vh - 64px)'
        }}
      >
        {showChart && (
          <div style={{ flex: '0 0 auto' }}>
            <SessionChart isDark={isDark} />
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px', flex: '1 1 auto', overflow: 'hidden' }}>
          <div className={`dashboard-left-panel ${isDark ? 'dark' : 'light'}`}>
            <TradeTable />
          </div>
          <div className={`dashboard-middle-panel ${isDark ? 'dark' : 'light'}`}>
            <CalculationsPanel />
          </div>
          <div className={`dashboard-right-panel ${isDark ? 'dark' : 'light'}`}>
            <SessionPanel isDark={isDark} />
          </div>
        </div>
      </Content>
    </Layout>
  )
}
