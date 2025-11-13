import { useEffect } from 'react'
import { Table, Button, Select, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import { useTradeStore } from '../../store/useTradeStore'
import { useAuthStore } from '../../store/useAuthStore'
import { useSessionStore } from '../../store/useSessionStore'
import type { Trade } from '../../../../types'
import './TradeTable.css'

export function TradeTable() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { activeSession } = useSessionStore()
  const { trades, loading, fetchTrades, updateTrade, clearTrades } = useTradeStore()

  useEffect(() => {
    if (user && activeSession) {
      fetchTrades(user.id, activeSession.id)
    }
  }, [user, activeSession, fetchTrades])

  const handleResultChange = async (tradeId: number, result: 'win' | 'loss') => {
    if (!user || !activeSession) return

    try {
      const trade = trades.find((t) => t.id === tradeId)
      if (!trade) return

      // Compute the return
      const returnAmount = await window.electronAPI.calculateTradeReturn({
        tradeAmount: trade.trade_amount,
        result,
        payoutPercent: activeSession.payout_percent || 92
      })

      // Compute the updated balance
      const newBalance = trade.current_balance + returnAmount

      await updateTrade(tradeId, {
        result,
        return_amount: returnAmount,
        current_balance: newBalance
      })

      // Update balances for subsequent trades
      const tradeIndex = trades.findIndex((t) => t.id === tradeId)
      if (tradeIndex >= 0) {
        const subsequentTrades = trades.slice(tradeIndex + 1)
        let runningBalance = newBalance
        for (const subsequentTrade of subsequentTrades) {
          runningBalance = runningBalance + subsequentTrade.return_amount
          await updateTrade(subsequentTrade.id, {
            current_balance: runningBalance
          })
        }
      }

      // Refresh trades to update the table
      await fetchTrades(user.id, activeSession.id)

      message.success(t('trade.resultUpdated'))
      setEditingId(null)
    } catch (error) {
      message.error(t('trade.updateFailed'))
    }
  }

  const handleClear = async () => {
    if (!user || !activeSession) return

    try {
      await clearTrades(user.id, activeSession.id)
      message.success(t('trade.tradesCleared'))
    } catch (error) {
      message.error(t('trade.clearFailed'))
    }
  }

  const columns: ColumnsType<Trade> = [
    {
      title: t('trade.no'),
      dataIndex: 'sequence_number',
      key: 'sequence_number',
      width: 60,
      align: 'center'
    },
    {
      title: t('trade.result'),
      dataIndex: 'result',
      key: 'result',
      width: 120,
      render: (result: 'win' | 'loss' | null, record) => (
        <Select
          value={result}
          onChange={(value) => handleResultChange(record.id, value)}
          style={{ width: '100%' }}
          suffixIcon={null}
        >
          <Select.Option value="win">
            <span style={{ color: '#52c41a' }}>W</span>
          </Select.Option>
          <Select.Option value="loss">
            <span style={{ color: '#ff4d4f' }}>L</span>
          </Select.Option>
        </Select>
      )
    },
    {
      title: t('trade.tradeAmount'),
      dataIndex: 'trade_amount',
      key: 'trade_amount',
      width: 150,
      align: 'right',
      render: (amount: number) => `$${amount.toFixed(2)}`
    },
    {
      title: t('trade.return'),
      dataIndex: 'return_amount',
      key: 'return_amount',
      width: 150,
      align: 'right',
      render: (returnAmount: number) => (
        <span style={{ color: returnAmount >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {returnAmount >= 0 ? '+' : ''}${returnAmount.toFixed(2)}
        </span>
      )
    },
    {
      title: t('trade.currentBalance'),
      dataIndex: 'current_balance',
      key: 'current_balance',
      width: 180,
      align: 'right',
      render: (balance: number) => `$${balance.toFixed(2)}`
    }
  ]

  return (
    <div className="trade-table-container">
      <div className="trade-table-header">
        <h3>{t('trade.title')}</h3>
        <Button danger onClick={handleClear} size="small">
          {t('common.clear')}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={trades}
        loading={loading}
        rowKey="id"
        pagination={false}
        size="small"
        className="trade-table"
      />
    </div>
  )
}
