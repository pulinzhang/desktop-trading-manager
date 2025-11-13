import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

export function initDatabase(): void {
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'trades.db')

  db = new Database(dbPath)

  // Create database schema if missing
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      initial_capital REAL NOT NULL DEFAULT 18000,
      risk_percent REAL NOT NULL DEFAULT 2.0,
      recovery_multiplier REAL NOT NULL DEFAULT 2.0,
      daily_profit_target_percent REAL NOT NULL DEFAULT 2.0,
      daily_goal_format TEXT NOT NULL DEFAULT '%' CHECK(daily_goal_format IN ('%', '$')),
      stop_loss_alert_percent REAL NOT NULL DEFAULT 20.0,
      session_end_alert INTEGER NOT NULL DEFAULT 0,
      low_trade_alert INTEGER NOT NULL DEFAULT 0,
      auto_copy_balance INTEGER NOT NULL DEFAULT 1,
      auto_log_session INTEGER NOT NULL DEFAULT 1,
      auto_count_session INTEGER NOT NULL DEFAULT 1,
      currency TEXT NOT NULL DEFAULT 'USD',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_number INTEGER NOT NULL,
      date TEXT NOT NULL,
      initial_capital REAL NOT NULL,
      capital_final REAL,
      account_gain REAL,
      win_profit REAL,
      stop_loss REAL,
      stop_loss_percent REAL,
      max_loss_limit INTEGER,
      total_trades INTEGER DEFAULT 0,
      winning_trades INTEGER DEFAULT 0,
      losing_trades INTEGER DEFAULT 0,
      payout_percent REAL,
      currency TEXT NOT NULL DEFAULT 'USD',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, session_number)
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id INTEGER,
      result TEXT CHECK(result IN ('win', 'loss')),
      trade_amount REAL NOT NULL,
      return_amount REAL NOT NULL,
      current_balance REAL NOT NULL,
      sequence_number INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
    CREATE INDEX IF NOT EXISTS idx_trades_session_id ON trades(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
  `)

  console.log('Database initialized at:', dbPath)
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    console.log('Database connection closed')
  }
}

