import { Spin } from 'antd'
import './SplashScreen.css'

export function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <div className="splash-icon">⚔️</div>
          <h1 className="splash-title">Desktop Trading Manager App</h1>
          <p className="splash-subtitle">Risk & Recovery System · Login Protection</p>
        </div>
        <div className="splash-loading">
          <Spin size="large" />
        </div>
        <div className="splash-version">Securing every session...</div>
        <div className="splashopyright">© Risk & Recovery System</div>
      </div>
    </div>
  )
}
