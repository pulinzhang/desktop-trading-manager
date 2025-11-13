import { useEffect, useState } from 'react'
import { Card, Button, InputNumber, Select, Switch, Statistic, Row, Col, Space, message, Modal } from 'antd'
import { PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, ExportOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'
import { useSessionStore } from '../../store/useSessionStore'
import { useTradeStore } from '../../store/useTradeStore'
import './SessionPanel.css'

interface SessionPanelProps {
  isDark: boolean
}

export function SessionPanel({ isDark }: SessionPanelProps) {
  const { t } = useTranslation()
  const { user, settings, updateSettings } = useAuthStore()
  const { activeSession, sessions, createSession, updateSession, fetchActiveSession, fetchSessions } = useSessionStore()
  const { trades, addTrade, fetchTrades } = useTradeStore()

  const [sessionNumber, setSessionNumber] = useState(1)
  const [newTradeModalVisible, setNewTradeModalVisible] = useState(false)
  const [newTradeAmount, setNewTradeAmount] = useState<number>(0)
  const [newSessionModalVisible, setNewSessionModalVisible] = useState(false)
  const [newSessionInitialCapital, setNewSessionInitialCapital] = useState<number>(0)

  useEffect(() => {
    if (user) {
      fetchSessions(user.id)
    }
  }, [user])

  useEffect(() => {
    if (user && activeSession) {
      setSessionNumber(activeSession.session_number)
      fetchTrades(user.id, activeSession.id)
    }
  }, [user, activeSession])

  useEffect(() => {
    // 初始化新会话的初始资金为设置中的值
    if (settings) {
      setNewSessionInitialCapital(settings.initial_capital)
    }
  }, [settings])

  useEffect(() => {
    if (activeSession && settings && trades.length > 0) {
      // 自动计算下一个交易金额
      const lastTrade = trades[trades.length - 1]
      window.electronAPI.calculateNextTradeAmount({
        currentBalance: lastTrade.current_balance,
        previousTradeAmount: lastTrade.trade_amount,
        previousResult: lastTrade.result,
        riskPercent: settings.risk_percent,
        recoveryMultiplier: settings.recovery_multiplier,
        payoutPercent: activeSession.payout_percent || 92
      }).then(amount => {
        setNewTradeAmount(amount)
      })
    } else if (activeSession && settings) {
      // 首次交易，使用风险百分比
      const currentBalance = activeSession.initial_capital
      setNewTradeAmount(currentBalance * (settings.risk_percent / 100))
    }
  }, [activeSession, settings, trades])

  const handleNewSession = () => {
    if (!user || !settings) return
    // 打开确认对话框
    setNewSessionModalVisible(true)
    setNewSessionInitialCapital(settings.initial_capital)
  }

  const handleConfirmNewSession = async () => {
    if (!user || !settings) return

    if (newSessionInitialCapital <= 0) {
      message.error(t('session.invalidInitialCapital'))
      return
    }

    try {
      // 创建新会话（createSession会自动更新activeSession，useEffect会自动刷新交易列表）
      await createSession(user.id, newSessionInitialCapital, settings.currency)
      message.success(t('session.newSessionCreated'))
      setNewSessionModalVisible(false)
    } catch (error) {
      message.error(t('session.createSessionFailed'))
    }
  }

  // 计算当前会话的统计信息
  const getCurrentSessionStats = () => {
    if (!activeSession) return null

    const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null
    const currentBalance = lastTrade 
      ? lastTrade.current_balance 
      : activeSession.initial_capital
    
    const totalTrades = trades.length
    const completedTrades = trades.filter(t => t.result !== null).length
    const winTrades = trades.filter(t => t.result === 'win').length
    const lossTrades = trades.filter(t => t.result === 'loss').length
    
    const totalProfit = trades
      .filter(t => t.result === 'win')
      .reduce((sum, t) => sum + (t.return_amount - t.trade_amount), 0)
    const totalLoss = trades
      .filter(t => t.result === 'loss')
      .reduce((sum, t) => sum + t.trade_amount, 0)
    
    const netProfit = totalProfit - totalLoss
    const profitPercent = activeSession.initial_capital > 0 
      ? (netProfit / activeSession.initial_capital) * 100 
      : 0

    return {
      currentBalance,
      totalTrades,
      completedTrades,
      winTrades,
      lossTrades,
      netProfit,
      profitPercent,
      initialCapital: activeSession.initial_capital
    }
  }

  const handleAddTrade = async () => {
    if (!user || !activeSession) return

    try {
      const sequenceNumber = trades.length + 1
      const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null
      const currentBalance = lastTrade 
        ? lastTrade.current_balance 
        : activeSession.initial_capital

      await addTrade({
        user_id: user.id,
        session_id: activeSession.id,
        result: null,
        trade_amount: newTradeAmount,
        return_amount: 0,
        current_balance: currentBalance - newTradeAmount,
        sequence_number: sequenceNumber
      })

      setNewTradeModalVisible(false)
      message.success(t('session.tradeAdded'))
    } catch (error) {
      message.error(t('session.addTradeFailed'))
    }
  }

  const handleSessionNumberChange = async (delta: number) => {
    if (!user || !activeSession) return

    const currentNumber = activeSession.session_number
    const newNumber = Math.max(1, currentNumber + delta)
    
    // 如果新号码和当前号码相同，不需要切换
    if (newNumber === currentNumber) return

    try {
      // 如果会话列表为空，先加载它
      let sessionsList = sessions
      if (sessionsList.length === 0) {
        await fetchSessions(user.id)
        sessionsList = useSessionStore.getState().sessions
      }

      // 查找目标会话号的会话
      const targetSession = sessionsList.find(s => s.session_number === newNumber)
      
      if (targetSession) {
        // 将所有会话设为非活动
        const updatePromises = sessionsList
          .filter(s => s.is_active)
          .map(s => updateSession(s.id, { is_active: false }))
        await Promise.all(updatePromises)
        
        // 将目标会话设为活动
        await updateSession(targetSession.id, { is_active: true })
        
        // 刷新活动会话和会话列表
        await Promise.all([
          fetchActiveSession(user.id),
          fetchSessions(user.id)
        ])
        
        message.success(t('session.sessionSwitched', { number: newNumber }))
      } else {
        message.warning(t('session.sessionNotFound', { number: newNumber }))
      }
    } catch (error) {
      message.error(t('session.switchSessionFailed'))
    }
  }

  const handleResetSession = () => {
    setSessionNumber(1)
  }

  const handleExport = async () => {
    if (!user || !activeSession) return

    try {
      const csv = await window.electronAPI.exportTrades(user.id, activeSession.id)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trades_${activeSession.date}.csv`
      a.click()
      URL.revokeObjectURL(url)
      message.success(t('session.exportSuccess'))
    } catch (error) {
      message.error(t('session.exportFailed'))
    }
  }

  const dailyProfitTarget = settings?.daily_profit_target_percent || 2
  const sessionsRequired = Math.ceil(dailyProfitTarget / (settings?.risk_percent || 2))
  const accountGain = activeSession 
    ? ((activeSession.capital_final || activeSession.initial_capital) - activeSession.initial_capital) / activeSession.initial_capital * 100
    : 0
  const capitalFinal = activeSession
    ? (dailyProfitTarget / 100) * activeSession.initial_capital + activeSession.initial_capital
    : 0

  return (
    <div className={`session-panel ${isDark ? 'dark' : 'light'}`}>
      <Card className="panel-card">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Button
            type="primary"
            danger
            icon={<PlusOutlined />}
            onClick={handleNewSession}
            block
            size="large"
          >
            + {t('session.newSession')}
          </Button>
          
          <Space>
            <Button size="small">{t('session.logSession')}</Button>
            <Button size="small">CB</Button>
          </Space>

          <div className="session-counter">
            <div className="session-counter-label">{t('session.sessionCounter')}</div>
            <div className="session-counter-value">
              <span>{activeSession?.session_number || sessionNumber}</span>
              <Space direction="vertical" size="small">
                <Button
                  type="text"
                  icon={<ArrowUpOutlined />}
                  onClick={() => handleSessionNumberChange(1)}
                  size="small"
                />
                <Button
                  type="text"
                  icon={<ArrowDownOutlined />}
                  onClick={() => handleSessionNumberChange(-1)}
                  size="small"
                />
              </Space>
            </div>
            <Button size="small" onClick={handleResetSession} block>
              {t('common.reset')}
            </Button>
          </div>
        </Space>
      </Card>

      <Card title={t('session.dailyGoals')} className="panel-card">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div className="setting-item">
              <span>{t('session.profitTarget')}:</span>
              <InputNumber
                value={dailyProfitTarget}
                min={0}
                max={100}
                precision={1}
                suffix="%"
                size="small"
                style={{ width: 100 }}
                onChange={(value) => {
                  if (value && settings) {
                    updateSettings({ daily_profit_target_percent: value })
                  }
                }}
              />
            </div>
          </Col>
          <Col span={24}>
            <div className="setting-item">
              <span>{t('session.dailyGoalFormat')}:</span>
              <Select
                value={settings?.daily_goal_format || '%'}
                size="small"
                style={{ width: 100 }}
                onChange={(value) => {
                  if (settings) {
                    updateSettings({ daily_goal_format: value })
                  }
                }}
              >
                <Select.Option value="%">%</Select.Option>
                <Select.Option value="$">$</Select.Option>
              </Select>
            </div>
          </Col>
          <Col span={24}>
            <Statistic
              title={t('session.sessionsRequired')}
              value={sessionsRequired}
            />
          </Col>
          <Col span={24}>
            <Statistic
              title={t('session.accountGain')}
              value={accountGain}
              precision={2}
              suffix="%"
            />
          </Col>
          <Col span={24}>
            <Statistic
              title={t('session.capitalFinal')}
              value={capitalFinal}
              precision={2}
              prefix="$"
            />
          </Col>
        </Row>
      </Card>

      <Card title={t('session.options')} className="panel-card">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div className="setting-item">
            <span>{t('session.stopLossAlert')}:</span>
            <InputNumber
              value={settings?.stop_loss_alert_percent || 20}
              min={0}
              max={100}
              precision={1}
              suffix="%"
              size="small"
              style={{ width: 100 }}
              onChange={(value) => {
                if (value && settings) {
                  updateSettings({ stop_loss_alert_percent: value })
                }
              }}
            />
          </div>
          <div className="setting-item">
            <span>{t('session.sessionEndAlert')}:</span>
            <Switch
              checked={settings?.session_end_alert || false}
              onChange={(checked) => {
                if (settings) {
                  updateSettings({ session_end_alert: checked })
                }
              }}
            />
          </div>
          <div className="setting-item">
            <span>{t('session.lowTradeAlert')}:</span>
            <Switch
              checked={settings?.low_trade_alert || false}
              onChange={(checked) => {
                if (settings) {
                  updateSettings({ low_trade_alert: checked })
                }
              }}
            />
          </div>
          <div className="setting-item">
            <span>{t('session.autoCopyBalance')}:</span>
            <Switch
              checked={settings?.auto_copy_balance || true}
              onChange={(checked) => {
                if (settings) {
                  updateSettings({ auto_copy_balance: checked })
                }
              }}
            />
          </div>
          <div className="setting-item">
            <span>{t('session.autoLogSession')}:</span>
            <Switch
              checked={settings?.auto_log_session || true}
              onChange={(checked) => {
                if (settings) {
                  updateSettings({ auto_log_session: checked })
                }
              }}
            />
          </div>
          <div className="setting-item">
            <span>{t('session.autoCountSession')}:</span>
            <Switch
              checked={settings?.auto_count_session || true}
              onChange={(checked) => {
                if (settings) {
                  updateSettings({ auto_count_session: checked })
                }
              }}
            />
          </div>
        </Space>
      </Card>

      <Button
        icon={<PlusOutlined />}
        onClick={() => setNewTradeModalVisible(true)}
        block
        style={{ marginTop: 'auto' }}
      >
        {t('session.addTrade')}
      </Button>

      <Button
        icon={<ExportOutlined />}
        onClick={handleExport}
        block
        style={{ marginTop: 8 }}
      >
        {t('session.exportCSV')}
      </Button>

      <Modal
        title={t('session.addTrade')}
        open={newTradeModalVisible}
        onOk={handleAddTrade}
        onCancel={() => setNewTradeModalVisible(false)}
        okText={t('common.add')}
        cancelText={t('common.cancel')}
      >
        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: 'block', marginBottom: 8, color: isDark ? '#fff' : '#000' }}
          >
            {t('session.tradeAmount')}:
          </label>
          <InputNumber
            value={newTradeAmount}
            onChange={(value) => setNewTradeAmount(value || 0)}
            prefix="$"
            style={{ width: '100%' }}
            precision={2}
            min={0}
            size="large"
          />
        </div>
      </Modal>

      <Modal
        title={t('session.createNewSession')}
        open={newSessionModalVisible}
        onOk={handleConfirmNewSession}
        onCancel={() => setNewSessionModalVisible(false)}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {activeSession && getCurrentSessionStats() && (
            <Card size="small" title={t('session.currentSessionStats')}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={t('session.initialCapital')}
                    value={getCurrentSessionStats()?.initialCapital}
                    prefix="$"
                    precision={2}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t('session.currentBalance')}
                    value={getCurrentSessionStats()?.currentBalance}
                    prefix="$"
                    precision={2}
                    valueStyle={{ 
                      color: (getCurrentSessionStats()?.currentBalance || 0) >= (getCurrentSessionStats()?.initialCapital || 0) 
                        ? '#52c41a' 
                        : '#ff4d4f' 
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t('session.totalTrades')}
                    value={getCurrentSessionStats()?.totalTrades}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t('session.completedTrades')}
                    value={getCurrentSessionStats()?.completedTrades}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t('session.winTrades')}
                    value={getCurrentSessionStats()?.winTrades}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={t('session.lossTrades')}
                    value={getCurrentSessionStats()?.lossTrades}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={24}>
                  <Statistic
                    title={t('session.netProfit')}
                    value={getCurrentSessionStats()?.netProfit}
                    prefix="$"
                    precision={2}
                    valueStyle={{ 
                      color: (getCurrentSessionStats()?.netProfit || 0) >= 0 ? '#52c41a' : '#ff4d4f' 
                    }}
                  />
                </Col>
                <Col span={24}>
                  <Statistic
                    title={t('session.profitPercent')}
                    value={getCurrentSessionStats()?.profitPercent}
                    suffix="%"
                    precision={2}
                    valueStyle={{ 
                      color: (getCurrentSessionStats()?.profitPercent || 0) >= 0 ? '#52c41a' : '#ff4d4f' 
                    }}
                  />
                </Col>
              </Row>
            </Card>
          )}
          
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                color: isDark ? '#fff' : '#000',
                fontWeight: 'bold'
              }}
            >
              {t('session.newSessionInitialCapital')}:
            </label>
            <InputNumber
              value={newSessionInitialCapital}
              onChange={(value) => setNewSessionInitialCapital(value || 0)}
              prefix="$"
              style={{ width: '100%' }}
              precision={2}
              min={0}
              size="large"
              autoFocus
            />
            <div
              style={{
                marginTop: 8,
                color: isDark ? '#8c8c8c' : '#666',
                fontSize: '12px'
              }}
            >
              {t('session.newSessionHint')}
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  )
}

