import type { RiskCalculationParams, RiskCalculationResult } from '../../../types'

export class RiskService {
  static async calculateRisk(params: RiskCalculationParams): Promise<RiskCalculationResult> {
    return await window.electronAPI.calculateRisk(params)
  }

  static calculatePositionSize(
    accountBalance: number,
    riskPercentage: number,
    entryPrice: number,
    stopLossPrice: number
  ): RiskCalculationResult {
    const riskAmount = accountBalance * (riskPercentage / 100)
    const priceDifference = Math.abs(entryPrice - stopLossPrice)
    const riskPerShare = priceDifference
    const maxQuantity = Math.floor(riskAmount / riskPerShare)
    const positionSize = maxQuantity * entryPrice

    return {
      riskAmount,
      positionSize,
      maxQuantity
    }
  }

  static calculateProfitLoss(
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    direction: 'long' | 'short'
  ): number {
    if (direction === 'long') {
      return (exitPrice - entryPrice) * quantity
    } else {
      return (entryPrice - exitPrice) * quantity
    }
  }

  static calculateWinRate(trades: Array<{ profit_loss: number }>): number {
    if (trades.length === 0) return 0
    const winningTrades = trades.filter((t) => t.profit_loss > 0).length
    return (winningTrades / trades.length) * 100
  }

  static calculateTotalProfitLoss(trades: Array<{ profit_loss: number }>): number {
    return trades.reduce((sum, trade) => sum + trade.profit_loss, 0)
  }
}

