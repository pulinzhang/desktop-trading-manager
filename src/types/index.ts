export interface User {
  id: number
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface Trade {
  id: number
  user_id: number
  session_id: number | null
  result: 'win' | 'loss' | null
  trade_amount: number
  return_amount: number
  current_balance: number
  sequence_number: number
  created_at: string
  updated_at: string
}

export interface Session {
  id: number
  user_id: number
  session_number: number
  date: string
  initial_capital: number
  capital_final: number | null
  account_gain: number | null
  win_profit: number | null
  stop_loss: number | null
  stop_loss_percent: number | null
  max_loss_limit: number | null
  total_trades: number
  winning_trades: number
  losing_trades: number
  payout_percent: number | null
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: number
  user_id: number
  initial_capital: number
  risk_percent: number
  recovery_multiplier: number
  daily_profit_target_percent: number
  daily_goal_format: '%' | '$'
  stop_loss_alert_percent: number
  session_end_alert: boolean
  low_trade_alert: boolean
  auto_copy_balance: boolean
  auto_log_session: boolean
  auto_count_session: boolean
  currency: string
  created_at: string
  updated_at: string
}

export interface RiskCalculationParams {
  accountBalance: number
  riskPercentage: number
  entryPrice: number
  stopLossPrice: number
}

export interface RiskCalculationResult {
  riskAmount: number
  positionSize: number
  maxQuantity: number
}

export interface TradeCalculationParams {
  currentBalance: number
  previousTradeAmount: number | null
  previousResult: 'win' | 'loss' | null
  riskPercent: number
  recoveryMultiplier: number
  payoutPercent: number
}
