import { useMemo } from 'react'
import { Card, Statistic, Tag } from 'antd'
import { FireOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTradeStore } from '../../store/useTradeStore'
import type { Trade } from '../../../../types'
import './StreakTracker.css'

export function StreakTracker() {
  const { t } = useTranslation()
  const { trades } = useTradeStore()

  const streak = useMemo(() => {
    const calculateStreak = (trades: Trade[]) => {
      if (trades.length === 0) {
        return { type: null, count: 0 }
      }

      // Start calculation from the most recent trade
      const sortedTrades = [...trades].sort((a, b) => {
        if (a.sequence_number !== b.sequence_number) {
          return b.sequence_number - a.sequence_number
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      let currentStreak = 0
      let streakType: 'win' | 'loss' | null = null

      for (const trade of sortedTrades) {
        if (!trade.result) continue

        if (streakType === null) {
          streakType = trade.result
          currentStreak = 1
        } else if (trade.result === streakType) {
          currentStreak++
        } else {
          break
        }
      }

      return { type: streakType, count: currentStreak }
    }

    return calculateStreak(trades)
  }, [trades])

  if (streak.count === 0) {
    return (
      <Card title={t('streak.title')} className="streak-card">
        <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '20px 0' }}>
          {t('streak.noStreak')}
        </div>
      </Card>
    )
  }

  const isWinStreak = streak.type === 'win'

  return (
    <Card title={t('streak.title')} className="streak-card">
      <div className="streak-content">
        <div className="streak-icon">
          {isWinStreak ? (
            <FireOutlined style={{ fontSize: '48px', color: '#ff4d4f' }} />
          ) : (
            <ThunderboltOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          )}
        </div>
        <Statistic
          title={isWinStreak ? t('streak.winStreak') : t('streak.lossStreak')}
          value={streak.count}
          suffix={t('streak.consecutive')}
          valueStyle={{
            color: isWinStreak ? '#52c41a' : '#ff4d4f',
            fontSize: '32px',
            fontWeight: 'bold'
          }}
        />
        <Tag color={isWinStreak ? 'success' : 'error'} style={{ marginTop: '8px' }}>
          {isWinStreak ? t('streak.onFire') : t('streak.recoveryNeeded')}
        </Tag>
      </div>
    </Card>
  )
}

