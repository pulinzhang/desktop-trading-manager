import { useEffect } from 'react'
import { Card } from 'antd'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useSessionStore } from '../../store/useSessionStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useTranslation } from 'react-i18next'

interface SessionChartProps {
  isDark?: boolean
}

export function SessionChart({ isDark = true }: SessionChartProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { sessions, fetchSessions } = useSessionStore()

  useEffect(() => {
    if (user) {
      fetchSessions(user.id)
    }
  }, [user, fetchSessions])

  const chartData = sessions
    .map((session) => ({
      date: session.date,
      balance: session.capital_final || session.initial_capital,
      profitLoss: session.account_gain || 0,
      trades: session.total_trades
    }))
    .reverse()

  const textColor = isDark ? '#fff' : '#000'
  const gridColor = isDark ? '#303030' : '#e8e8e8'
  const axisColor = isDark ? '#8c8c8c' : '#666'

  if (chartData.length === 0) {
    return (
      <Card title={t('session.chart')}>
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#8c8c8c' : '#999' }}>
          {t('session.noData')}
        </div>
      </Card>
    )
  }

  return (
    <Card title={t('session.chart')}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="date" 
            stroke={axisColor}
            tick={{ fill: textColor }}
          />
          <YAxis 
            yAxisId="left" 
            stroke={axisColor}
            tick={{ fill: textColor }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke={axisColor}
            tick={{ fill: textColor }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: isDark ? '#1f1f1f' : '#fff',
              border: `1px solid ${gridColor}`,
              color: textColor
            }}
            labelStyle={{ color: textColor }}
          />
          <Legend 
            wrapperStyle={{ color: textColor }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="balance"
            stroke="#1890ff"
            name={t('session.balance')}
            strokeWidth={2}
            dot={{ fill: '#1890ff' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="profitLoss"
            stroke="#52c41a"
            name={t('session.profitLoss')}
            strokeWidth={2}
            dot={{ fill: '#52c41a' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

