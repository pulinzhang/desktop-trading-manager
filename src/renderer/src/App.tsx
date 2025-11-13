import { useEffect, useState } from 'react'
import { ConfigProvider, theme } from 'antd'
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
    // Persist theme preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    // Show splash screen for 1.5 seconds
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
