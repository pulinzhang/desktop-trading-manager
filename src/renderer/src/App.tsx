import { useEffect, useState } from 'react'
import { Layout, ConfigProvider, theme } from 'antd'
import { Login } from './components/Login/Login'
import { Dashboard } from './components/Dashboard/Dashboard'
import { SplashScreen } from './components/SplashScreen/SplashScreen'
import { useAuthStore } from './store/useAuthStore'
import './App.css'

function App() {
  const { isAuthenticated } = useAuthStore()
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : true
  })
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // 保存主题偏好
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    // 显示启动画面 1.5 秒
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return <SplashScreen />
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#ff4d4f',
          borderRadius: 4
        }
      }}
    >
      {!isAuthenticated ? <Login /> : <Dashboard isDark={isDark} setIsDark={setIsDark} />}
    </ConfigProvider>
  )
}

export default App
