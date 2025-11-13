import { ipcMain } from 'electron'
import { getDatabase } from './database'
import { registerUser, loginUser, getUserSettings, updateUserSettings } from './auth'
import type { Trade, Session, User, UserSettings } from '../types'

// Authentication-related IPC handlers
export function setupAuthHandlers(): void {
  // Register user
  ipcMain.handle('auth:register', async (_, email: string, password: string): Promise<User> => {
    return registerUser(email, password)
  })

  // Sign in
  ipcMain.handle('auth:login', async (_, email: string, password: string): Promise<User | null> => {
    return loginUser(email, password)
  })

  // Fetch user settings
  ipcMain.handle('auth:getSettings', async (_, userId: number): Promise<UserSettings | null> => {
    return getUserSettings(userId)
  })

  // Update user settings
  ipcMain.handle('auth:updateSettings', async (_, userId: number, updates: Partial<UserSettings>): Promise<UserSettings> => {
    return updateUserSettings(userId, updates)
  })
}

// Trade-related IPC handlers
export function setupTradeHandlers(): void {
  // Fetch all trades for the user
  ipcMain.handle('db:getTrades', async (_, userId: number, sessionId?: number): Promise<Trade[]> => {
    const db = getDatabase()
    if (sessionId) {
      const stmt = db.prepare('SELECT * FROM trades WHERE user_id = ? AND session_id = ? ORDER BY sequence_number ASC')
      return stmt.all(userId, sessionId) as Trade[]
    }
    const stmt = db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY sequence_number DESC')
    return stmt.all(userId) as Trade[]
  })

  // Fetch a single trade
  ipcMain.handle('db:getTrade', async (_, id: number): Promise<Trade | null> => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM trades WHERE id = ?')
    const trade = stmt.get(id) as Trade | undefined
    return trade || null
  })

  // Create trade
  ipcMain.handle('db:createTrade', async (_, trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>): Promise<Trade> => {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO trades (user_id, session_id, result, trade_amount, return_amount, current_balance, sequence_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      trade.user_id,
      trade.session_id || null,
      trade.result || null,
      trade.trade_amount,
      trade.return_amount,
      trade.current_balance,
      trade.sequence_number
    )

    const newTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid) as Trade
    return newTrade
  })

  // Update trade
  ipcMain.handle('db:updateTrade', async (_, id: number, updates: Partial<Trade>): Promise<Trade | null> => {
    const db = getDatabase()
    
    const allowedFields = ['result', 'trade_amount', 'return_amount', 'current_balance']
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key))
    
    if (fields.length === 0) {
      return null
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => updates[field as keyof Trade])
    values.push(id)

    const stmt = db.prepare(`UPDATE trades SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    stmt.run(...values)

    const updatedTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(id) as Trade
    return updatedTrade || null
  })

  // Delete trade
  ipcMain.handle('db:deleteTrade', async (_, id: number): Promise<boolean> => {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM trades WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  })

  // Delete all trades (clear history)
  ipcMain.handle('db:clearTrades', async (_, userId: number, sessionId?: number): Promise<boolean> => {
    const db = getDatabase()
    if (sessionId) {
      const stmt = db.prepare('DELETE FROM trades WHERE user_id = ? AND session_id = ?')
      const result = stmt.run(userId, sessionId)
      return result.changes > 0
    }
    const stmt = db.prepare('DELETE FROM trades WHERE user_id = ?')
    const result = stmt.run(userId)
    return result.changes > 0
  })
}

// Session-related IPC handlers
export function setupSessionHandlers(): void {
  // Fetch all sessions for the user
  ipcMain.handle('db:getSessions', async (_, userId: number): Promise<Session[]> => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY session_number DESC')
    return stmt.all(userId) as Session[]
  })

  // Fetch the currently active session
  ipcMain.handle('db:getActiveSession', async (_, userId: number): Promise<Session | null> => {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY session_number DESC LIMIT 1')
    const session = stmt.get(userId) as Session | undefined
    return session || null
  })

  // Create a new session
  ipcMain.handle('db:createSession', async (_, userId: number, initialCapital: number, currency: string = 'USD'): Promise<Session> => {
    const db = getDatabase()
    
    // Compute the next session number
    const lastSession = db.prepare('SELECT MAX(session_number) as max_num FROM sessions WHERE user_id = ?').get(userId) as { max_num: number | null } | undefined
    const nextSessionNumber = (lastSession?.max_num ?? 0) + 1

    // Mark existing sessions as inactive
    db.prepare('UPDATE sessions SET is_active = 0 WHERE user_id = ?').run(userId)

    const date = new Date().toISOString().split('T')[0]
    const stmt = db.prepare(`
      INSERT INTO sessions (
        user_id, session_number, date, initial_capital, currency, is_active
      ) VALUES (?, ?, ?, ?, ?, 1)
    `)
    
    const result = stmt.run(userId, nextSessionNumber, date, initialCapital, currency)
    const newSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid) as Session
    return newSession
  })

  // Update session
  ipcMain.handle('db:updateSession', async (_, sessionId: number, updates: Partial<Session>): Promise<Session | null> => {
    const db = getDatabase()
    
    const allowedFields = [
      'capital_final', 'account_gain', 'win_profit', 'stop_loss', 'stop_loss_percent',
      'max_loss_limit', 'total_trades', 'winning_trades', 'losing_trades', 'payout_percent', 'is_active'
    ]
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key))
    
    if (fields.length === 0) {
      return null
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => {
      const value = updates[field as keyof Session]
      if (typeof value === 'boolean') {
        return value ? 1 : 0
      }
      return value
    })
    values.push(sessionId)

    const stmt = db.prepare(`UPDATE sessions SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    stmt.run(...values)

    const updatedSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as Session
    return updatedSession || null
  })

  // Reset session counter
  ipcMain.handle('db:resetSessionCounter', async (_, userId: number): Promise<void> => {
    const db = getDatabase()
    // Intentionally left blank: resetting the counter would impact history
    // Implement this flow if requirements change
  })
}

// Calculation-related IPC handlers
export function setupCalculationHandlers(): void {
  // Compute the next trade amount (for recovery plans)
  ipcMain.handle('calc:nextTradeAmount', async (_, params: {
    currentBalance: number
    previousTradeAmount: number | null
    previousResult: 'win' | 'loss' | null
    riskPercent: number
    recoveryMultiplier: number
    payoutPercent: number
  }): Promise<number> => {
    const { currentBalance, previousTradeAmount, previousResult, riskPercent, recoveryMultiplier, payoutPercent } = params

    // On a loss, scale by the recovery multiplier
    if (previousResult === 'loss' && previousTradeAmount) {
      return previousTradeAmount * recoveryMultiplier
    }

    // Otherwise fall back to the risk percentage
    return currentBalance * (riskPercent / 100)
  })

  // Compute trade returns
  ipcMain.handle('calc:tradeReturn', async (_, params: {
    tradeAmount: number
    result: 'win' | 'loss'
    payoutPercent: number
  }): Promise<number> => {
    const { tradeAmount, result, payoutPercent } = params
    
    if (result === 'win') {
      return tradeAmount * (payoutPercent / 100)
    } else {
      return -tradeAmount
    }
  })
}

// Data export
export function setupExportHandlers(): void {
  ipcMain.handle('export:trades', async (_, userId: number, sessionId?: number): Promise<string> => {
    const db = getDatabase()
    let trades: Trade[]
    
    if (sessionId) {
      const stmt = db.prepare('SELECT * FROM trades WHERE user_id = ? AND session_id = ? ORDER BY sequence_number ASC')
      trades = stmt.all(userId, sessionId) as Trade[]
    } else {
      const stmt = db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY sequence_number ASC')
      trades = stmt.all(userId) as Trade[]
    }

    // Assemble the CSV payload
    const headers = ['NO.', 'RESULT', 'TRADE AMOUNT', 'RETURN', 'CURRENT BALANCE']
    const rows = trades.map((trade, index) => [
      index + 1,
      trade.result?.toUpperCase() || '',
      trade.trade_amount.toFixed(2),
      trade.return_amount.toFixed(2),
      trade.current_balance.toFixed(2)
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    return csv
  })
}

// Register every IPC handler
export function setupIpcHandlers(): void {
  setupAuthHandlers()
  setupTradeHandlers()
  setupSessionHandlers()
  setupCalculationHandlers()
  setupExportHandlers()
}
