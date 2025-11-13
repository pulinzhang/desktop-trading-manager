import { Card, Statistic, Row, Col } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTradeStore } from '../../store/useTradeStore'
import { useSessionStore } from '../../store/useSessionStore'
import { StreakTracker } from '../StreakTracker/StreakTracker'
import { AnimatedStatistic } from '../AnimatedStatistic/AnimatedStatistic'
import './CalculationsPanel.css'

export function CalculationsPanel() {
  const { t } = useTranslation()
  const { activeSession } = useSessionStore()
  const { trades } = useTradeStore()

  if (!activeSession) {
    return (
      <div className="calculations-panel">
        <Card title={t('calculations.title')} className="panel-card">
          <p style={{ color: '#8c8c8c' }}>{t('session.pleaseCreateSession')}</p>
        </Card>
      </div>
    )
  }

  const totalTrades = trades.length
  const winTrades = trades.filter((t) => t.result === 'win').length
  const lossTrades = trades.filter((t) => t.result === 'loss').length
  const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0
  const payoutPercent = activeSession.payout_percent || 92

  const currentBalance =
    trades.length > 0 ? trades[trades.length - 1].current_balance : activeSession.initial_capital

  const capitalFinal = currentBalance
  const accountGain =
    activeSession.initial_capital > 0
      ? ((capitalFinal - activeSession.initial_capital) / activeSession.initial_capital) * 100
      : 0

  const winProfit = trades
    .filter((t) => t.result === 'win')
    .reduce((sum, t) => sum + t.return_amount, 0)

  const stopLoss = activeSession.stop_loss || activeSession.initial_capital * 0.8
  const stopLossPercent = activeSession.stop_loss_percent || 20
  const maxLossLimit = activeSession.max_loss_limit || 16

  return (
    <div className="calculations-panel">
      <StreakTracker />
      <Card title={t('calculations.title')} className="panel-card">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <AnimatedStatistic
              title={t('calculations.initialCapital')}
              value={activeSession.initial_capital}
              precision={2}
              prefix="$"
              suffix={`(${activeSession.currency}) ${(activeSession.initial_capital * 0.02).toFixed(2)} min.`}
            />
          </Col>
          <Col span={12}>
            <AnimatedStatistic title={t('calculations.totalTrades')} value={totalTrades} />
          </Col>
          <Col span={12}>
            <AnimatedStatistic
              title={t('calculations.winTrades')}
              value={winTrades}
              suffix={`${winRate.toFixed(0)}% W/R`}
            />
          </Col>
          <Col span={12}>
            <AnimatedStatistic
              title={t('calculations.payoutPercent')}
              value={payoutPercent}
              suffix="%"
            />
          </Col>
          <Col span={24}>
            <Statistic title={t('calculations.currency')} value={activeSession.currency} />
          </Col>
        </Row>
      </Card>

      <Card title={t('calculations.sessionTarget')} className="panel-card">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <AnimatedStatistic
              title={t('calculations.capitalFinal')}
              value={capitalFinal}
              precision={2}
              prefix="$"
            />
          </Col>
          <Col span={24}>
            <AnimatedStatistic
              title={t('calculations.accountGain')}
              value={accountGain}
              precision={2}
              suffix="%"
              valueStyle={{ color: accountGain >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Col>
          <Col span={24}>
            <AnimatedStatistic
              title={t('calculations.winProfit')}
              value={winProfit}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={12}>
            <AnimatedStatistic
              title={t('calculations.stopLoss')}
              value={stopLoss}
              precision={2}
              prefix="$"
              suffix={`${stopLossPercent}%`}
            />
          </Col>
          <Col span={12}>
            <AnimatedStatistic
              title={t('calculations.maxLossLimit')}
              value={maxLossLimit}
              suffix={t('calculations.maxLossBeforeLiquidation')}
            />
          </Col>
        </Row>
      </Card>

      <Card title={t('calculations.sessionPerformance')} className="panel-card">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <AnimatedStatistic
              title={t('calculations.eventsWon')}
              value={winTrades}
              suffix={`${winRate.toFixed(0)}%`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={12}>
            <AnimatedStatistic
              title={t('calculations.eventsLost')}
              value={lossTrades}
              suffix={`${(100 - winRate).toFixed(0)}%`}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>
      </Card>

      <Card className="panel-card about-card">
        <div className="about-content">
          <div className="about-icon">⚔️</div>
          <div>
            <div className="about-title">Desktop Trading Manager App</div>
            <div className="about-version">Risk & Recovery System · Login Protection</div>
            <div className="about-website">www.desktoptrading.app</div>
            <div className="about-copyright">© Risk & Recovery System</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
