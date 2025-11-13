import bcrypt from 'bcryptjs'
import { getDatabase } from './database'
import type { User, UserSettings } from '../types'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function registerUser(email: string, password: string): Promise<User> {
  const db = getDatabase()

  // Check if the user already exists
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | User
    | undefined
  if (existingUser) {
    throw new Error('User already exists')
  }

  // Create the user
  const passwordHash = await hashPassword(password)
  const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
  const result = stmt.run(email, passwordHash)

  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User

  // Seed default settings
  const settingsStmt = db.prepare(`
    INSERT INTO user_settings (
      user_id, initial_capital, risk_percent, recovery_multiplier,
      daily_profit_target_percent, daily_goal_format, stop_loss_alert_percent,
      session_end_alert, low_trade_alert, auto_copy_balance,
      auto_log_session, auto_count_session, currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  settingsStmt.run(
    newUser.id,
    18000, // initial_capital
    2.0, // risk_percent
    2.0, // recovery_multiplier
    2.0, // daily_profit_target_percent
    '%', // daily_goal_format
    20.0, // stop_loss_alert_percent
    0, // session_end_alert
    0, // low_trade_alert
    1, // auto_copy_balance
    1, // auto_log_session
    1, // auto_count_session
    'USD' // currency
  )

  return newUser
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const db = getDatabase()
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined

  if (!user) {
    return null
  }

  const isValid = await verifyPassword(password, user.password_hash)
  return isValid ? user : null
}

export async function getUserSettings(userId: number): Promise<UserSettings | null> {
  const db = getDatabase()
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as
    | UserSettings
    | undefined
  return settings || null
}

export async function updateUserSettings(
  userId: number,
  updates: Partial<UserSettings>
): Promise<UserSettings> {
  const db = getDatabase()

  const allowedFields = [
    'initial_capital',
    'risk_percent',
    'recovery_multiplier',
    'daily_profit_target_percent',
    'daily_goal_format',
    'stop_loss_alert_percent',
    'session_end_alert',
    'low_trade_alert',
    'auto_copy_balance',
    'auto_log_session',
    'auto_count_session',
    'currency'
  ]

  const fields = Object.keys(updates).filter((key) => allowedFields.includes(key))

  if (fields.length === 0) {
    throw new Error('No valid fields provided for update')
  }

  const setClause = fields.map((field) => `${field} = ?`).join(', ')
  const values = fields.map((field) => {
    const value = updates[field as keyof UserSettings]
    // Persist booleans as integers
    if (typeof value === 'boolean') {
      return value ? 1 : 0
    }
    return value
  })
  values.push(userId)

  const stmt = db.prepare(
    `UPDATE user_settings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`
  )
  stmt.run(...values)

  const updatedSettings = db
    .prepare('SELECT * FROM user_settings WHERE user_id = ?')
    .get(userId) as UserSettings
  return updatedSettings
}
