# 数据库和 API 详解

## 📊 数据库部分

### 一、数据库初始化

**文件：`src/main/database.ts`**

#### 1. 数据库技术栈
- **数据库类型**：SQLite（本地文件数据库）
- **ORM/驱动**：`better-sqlite3`（高性能的同步 SQLite 驱动）
- **数据库位置**：`%APPDATA%/desktop-trading-manager-app/trades.db`（Windows）

#### 2. 初始化流程

```typescript
// 应用启动时调用
initDatabase()
  ↓
1. 获取用户数据目录路径
   app.getPath('userData')
   // Windows: C:\Users\用户名\AppData\Roaming\desktop-trading-manager-app
  ↓
2. 创建数据库连接
   new Database(dbPath)
  ↓
3. 创建所有表结构（如果不存在）
  ↓
4. 创建索引（优化查询性能）
```

#### 3. 数据库表结构

##### 📋 **users 表**（用户表）
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 用户ID（自增）
  email TEXT NOT NULL UNIQUE,            -- 邮箱（唯一，用于登录）
  password_hash TEXT NOT NULL,           -- 密码哈希值（bcrypt加密）
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**用途**：存储用户账户信息

---

##### ⚙️ **user_settings 表**（用户设置表）
```sql
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                    -- 关联用户ID
  initial_capital REAL NOT NULL DEFAULT 18000, -- 初始资金
  risk_percent REAL NOT NULL DEFAULT 2.0,      -- 风险百分比
  recovery_multiplier REAL NOT NULL DEFAULT 2.0, -- 恢复倍数
  daily_profit_target_percent REAL DEFAULT 2.0,  -- 每日盈利目标百分比
  daily_goal_format TEXT DEFAULT '%',          -- 目标格式（% 或 $）
  stop_loss_alert_percent REAL DEFAULT 20.0,   -- 止损提醒百分比
  session_end_alert INTEGER DEFAULT 0,         -- 会话结束提醒（0/1）
  low_trade_alert INTEGER DEFAULT 0,           -- 低交易提醒（0/1）
  auto_copy_balance INTEGER DEFAULT 1,         -- 自动复制余额（0/1）
  auto_log_session INTEGER DEFAULT 1,          -- 自动记录会话（0/1）
  auto_count_session INTEGER DEFAULT 1,        -- 自动计数会话（0/1）
  currency TEXT DEFAULT 'USD',                 -- 货币类型
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)  -- 每个用户只有一条设置记录
);
```

**用途**：存储用户的交易配置和偏好设置

---

##### 📅 **sessions 表**（交易会话表）
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,              -- 关联用户ID
  session_number INTEGER NOT NULL,        -- 会话编号（第几次交易）
  date TEXT NOT NULL,                     -- 会话日期
  initial_capital REAL NOT NULL,          -- 初始资金
  capital_final REAL,                     -- 最终资金
  account_gain REAL,                      -- 账户收益
  win_profit REAL,                        -- 盈利金额
  stop_loss REAL,                         -- 止损金额
  stop_loss_percent REAL,                 -- 止损百分比
  max_loss_limit INTEGER,                 -- 最大亏损限制
  total_trades INTEGER DEFAULT 0,         -- 总交易数
  winning_trades INTEGER DEFAULT 0,        -- 盈利交易数
  losing_trades INTEGER DEFAULT 0,        -- 亏损交易数
  payout_percent REAL,                    -- 赔付百分比
  currency TEXT DEFAULT 'USD',            -- 货币类型
  is_active INTEGER DEFAULT 1,            -- 是否活动会话（0/1）
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, session_number)  -- 每个用户的会话编号唯一
);
```

**用途**：记录每次交易会话的统计信息

---

##### 💰 **trades 表**（交易记录表）
```sql
CREATE TABLE trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,              -- 关联用户ID
  session_id INTEGER,                    -- 关联会话ID（可为空）
  result TEXT CHECK(result IN ('win', 'loss')), -- 交易结果
  trade_amount REAL NOT NULL,            -- 交易金额
  return_amount REAL NOT NULL,           -- 回报金额
  current_balance REAL NOT NULL,         -- 当前余额
  sequence_number INTEGER NOT NULL,      -- 交易序号
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);
```

**用途**：记录每一笔交易的详细信息

---

#### 4. 数据库索引

为了提高查询性能，创建了以下索引：

```sql
CREATE INDEX idx_users_email ON users(email);           -- 邮箱查询索引
CREATE INDEX idx_trades_user_id ON trades(user_id);     -- 用户交易查询索引
CREATE INDEX idx_trades_session_id ON trades(session_id); -- 会话交易查询索引
CREATE INDEX idx_sessions_user_id ON sessions(user_id);   -- 用户会话查询索引
CREATE INDEX idx_sessions_date ON sessions(date);        -- 日期查询索引
```

---

#### 5. 数据库操作函数

```typescript
// 获取数据库实例
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('数据库未初始化')
  }
  return db
}

// 关闭数据库连接
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
```

---

## 🔌 API 部分（IPC 通信）

### 一、Electron IPC 架构

Electron 应用分为两个进程：
- **主进程（Main Process）**：可以访问 Node.js API 和数据库
- **渲染进程（Renderer Process）**：运行 React 应用，无法直接访问数据库

**IPC（Inter-Process Communication）** 用于两个进程之间的通信。

---

### 二、API 通信流程

```
渲染进程（React）                   主进程（Node.js）
     │                                  │
     │  1. 调用 window.electronAPI      │
     │     .login(email, password)     │
     │                                  │
     ├─────────────────────────────────>│
     │                                  │
     │                                  │  2. 接收 IPC 消息
     │                                  │     ipcMain.handle('auth:login')
     │                                  │
     │                                  │  3. 执行数据库操作
     │                                  │     loginUser(email, password)
     │                                  │
     │                                  │  4. 返回结果
     │                                  │
     │<─────────────────────────────────┤
     │  5. 接收 Promise<User>           │
     │                                  │
```

---

### 三、Preload 脚本（API 暴露层）

**文件：`src/preload/index.ts`**

#### 作用
- 在渲染进程和主进程之间建立安全的通信桥梁
- 将主进程的 API 安全地暴露给渲染进程
- 使用 `contextBridge` 确保安全性

#### 关键代码

```typescript
// 将 electronAPI 对象暴露到 window 对象上
contextBridge.exposeInMainWorld('electronAPI', {
  // 认证相关 API
  login: (email, password) => 
    ipcRenderer.invoke('auth:login', email, password),
  
  // 交易相关 API
  getTrades: (userId, sessionId) => 
    ipcRenderer.invoke('db:getTrades', userId, sessionId),
  
  // ... 更多 API
})
```

**在渲染进程中使用：**
```typescript
// React 组件中
const user = await window.electronAPI.login(email, password)
```

---

### 四、IPC 处理器（主进程）

**文件：`src/main/ipc.ts`**

#### 1. 认证相关 API（`setupAuthHandlers`）

##### 🔐 **注册用户**
```typescript
ipcMain.handle('auth:register', async (_, email, password) => {
  return registerUser(email, password)
})
```

**流程：**
1. 检查邮箱是否已存在
2. 使用 bcrypt 加密密码
3. 创建用户记录
4. 创建默认用户设置
5. 返回新用户对象

---

##### 🔑 **用户登录**
```typescript
ipcMain.handle('auth:login', async (_, email, password) => {
  return loginUser(email, password)
})
```

**流程：**
1. 根据邮箱查找用户
2. 验证密码（bcrypt 比较）
3. 返回用户对象或 null

---

##### ⚙️ **获取用户设置**
```typescript
ipcMain.handle('auth:getSettings', async (_, userId) => {
  return getUserSettings(userId)
})
```

---

##### 💾 **更新用户设置**
```typescript
ipcMain.handle('auth:updateSettings', async (_, userId, updates) => {
  return updateUserSettings(userId, updates)
})
```

**允许更新的字段：**
- `initial_capital` - 初始资金
- `risk_percent` - 风险百分比
- `recovery_multiplier` - 恢复倍数
- `daily_profit_target_percent` - 每日盈利目标
- `daily_goal_format` - 目标格式（% 或 $）
- `stop_loss_alert_percent` - 止损提醒百分比
- `session_end_alert` - 会话结束提醒
- `low_trade_alert` - 低交易提醒
- `auto_copy_balance` - 自动复制余额
- `auto_log_session` - 自动记录会话
- `auto_count_session` - 自动计数会话
- `currency` - 货币类型

---

#### 2. 交易相关 API（`setupTradeHandlers`）

##### 📋 **获取交易列表**
```typescript
ipcMain.handle('db:getTrades', async (_, userId, sessionId?) => {
  // 如果提供了 sessionId，只获取该会话的交易
  // 否则获取用户的所有交易
})
```

**SQL 查询：**
```sql
-- 有 sessionId
SELECT * FROM trades 
WHERE user_id = ? AND session_id = ? 
ORDER BY sequence_number ASC

-- 无 sessionId
SELECT * FROM trades 
WHERE user_id = ? 
ORDER BY sequence_number DESC
```

---

##### 🔍 **获取单个交易**
```typescript
ipcMain.handle('db:getTrade', async (_, id) => {
  // 根据交易ID查询
})
```

---

##### ➕ **创建交易**
```typescript
ipcMain.handle('db:createTrade', async (_, trade) => {
  // 插入新交易记录
  // 返回创建的交易对象（包含自动生成的 id）
})
```

**插入字段：**
- `user_id` - 用户ID
- `session_id` - 会话ID（可选）
- `result` - 交易结果（'win' 或 'loss'）
- `trade_amount` - 交易金额
- `return_amount` - 回报金额
- `current_balance` - 当前余额
- `sequence_number` - 交易序号

---

##### ✏️ **更新交易**
```typescript
ipcMain.handle('db:updateTrade', async (_, id, updates) => {
  // 只允许更新特定字段
  // 自动更新 updated_at 时间戳
})
```

**允许更新的字段：**
- `result` - 交易结果
- `trade_amount` - 交易金额
- `return_amount` - 回报金额
- `current_balance` - 当前余额

---

##### 🗑️ **删除交易**
```typescript
ipcMain.handle('db:deleteTrade', async (_, id) => {
  // 删除指定ID的交易
  // 返回是否成功删除
})
```

---

##### 🧹 **清空交易**
```typescript
ipcMain.handle('db:clearTrades', async (_, userId, sessionId?) => {
  // 如果提供了 sessionId，只清空该会话的交易
  // 否则清空用户的所有交易
})
```

---

#### 3. 会话相关 API（`setupSessionHandlers`）

##### 📅 **获取所有会话**
```typescript
ipcMain.handle('db:getSessions', async (_, userId) => {
  // 获取用户的所有会话，按会话编号降序排列
})
```

---

##### 🎯 **获取活动会话**
```typescript
ipcMain.handle('db:getActiveSession', async (_, userId) => {
  // 获取用户当前活动的会话（is_active = 1）
})
```

---

##### ➕ **创建新会话**
```typescript
ipcMain.handle('db:createSession', async (_, userId, initialCapital, currency) => {
  // 1. 计算下一个会话编号（MAX(session_number) + 1）
  // 2. 将之前的会话设为非活动（is_active = 0）
  // 3. 创建新会话，设为活动状态
  // 4. 返回新会话对象
})
```

**关键逻辑：**
- 自动递增会话编号
- 新会话创建时，旧会话自动变为非活动状态
- 使用当前日期作为会话日期

---

##### ✏️ **更新会话**
```typescript
ipcMain.handle('db:updateSession', async (_, sessionId, updates) => {
  // 更新会话的统计信息
})
```

**允许更新的字段：**
- `capital_final` - 最终资金
- `account_gain` - 账户收益
- `win_profit` - 盈利金额
- `stop_loss` - 止损金额
- `stop_loss_percent` - 止损百分比
- `max_loss_limit` - 最大亏损限制
- `total_trades` - 总交易数
- `winning_trades` - 盈利交易数
- `losing_trades` - 亏损交易数
- `payout_percent` - 赔付百分比
- `is_active` - 是否活动

---

##### 🔄 **重置会话计数器**
```typescript
ipcMain.handle('db:resetSessionCounter', async (_, userId) => {
  // 重置会话计数器（当前实现为空）
})
```

---

#### 4. 计算相关 API（`setupCalculationHandlers`）

##### 🧮 **计算下一个交易金额**
```typescript
ipcMain.handle('calc:nextTradeAmount', async (_, params) => {
  const { 
    currentBalance,      // 当前余额
    previousTradeAmount, // 上一笔交易金额
    previousResult,      // 上一笔交易结果（'win' 或 'loss'）
    riskPercent,         // 风险百分比
    recoveryMultiplier,  // 恢复倍数
    payoutPercent        // 赔付百分比
  } = params

  // 如果上一笔是亏损，使用恢复倍数
  if (previousResult === 'loss' && previousTradeAmount) {
    return previousTradeAmount * recoveryMultiplier
  }

  // 否则使用风险百分比计算
  return currentBalance * (riskPercent / 100)
})
```

**计算逻辑：**
- **亏损后**：下一笔交易金额 = 上一笔金额 × 恢复倍数
- **盈利后**：下一笔交易金额 = 当前余额 × 风险百分比

---

##### 💵 **计算交易回报**
```typescript
ipcMain.handle('calc:tradeReturn', async (_, params) => {
  const { tradeAmount, result, payoutPercent } = params

  if (result === 'win') {
    // 盈利：回报 = 交易金额 × 赔付百分比
    return tradeAmount * (payoutPercent / 100)
  } else {
    // 亏损：回报 = -交易金额
    return -tradeAmount
  }
})
```

---

#### 5. 导出相关 API（`setupExportHandlers`）

##### 📤 **导出交易数据为 CSV**
```typescript
ipcMain.handle('export:trades', async (_, userId, sessionId?) => {
  // 1. 查询交易数据
  // 2. 格式化为 CSV 格式
  // 3. 返回 CSV 字符串
})
```

**CSV 格式：**
```csv
NO.,RESULT,TRADE AMOUNT,RETURN,CURRENT BALANCE
1,WIN,100.00,80.00,18080.00
2,LOSS,200.00,-200.00,17880.00
...
```

---

### 五、API 调用示例

#### 在 React 组件中使用

```typescript
// 1. 登录
const user = await window.electronAPI.login('user@example.com', 'password123')

// 2. 获取用户设置
const settings = await window.electronAPI.getSettings(user.id)

// 3. 创建新会话
const session = await window.electronAPI.createSession(user.id, 18000, 'USD')

// 4. 创建交易
const trade = await window.electronAPI.createTrade({
  user_id: user.id,
  session_id: session.id,
  result: 'win',
  trade_amount: 100,
  return_amount: 80,
  current_balance: 18080,
  sequence_number: 1
})

// 5. 获取交易列表
const trades = await window.electronAPI.getTrades(user.id, session.id)

// 6. 计算下一个交易金额
const nextAmount = await window.electronAPI.calculateNextTradeAmount({
  currentBalance: 18080,
  previousTradeAmount: 100,
  previousResult: 'win',
  riskPercent: 2.0,
  recoveryMultiplier: 2.0,
  payoutPercent: 80
})
```

---

### 六、安全机制

#### 1. Context Isolation（上下文隔离）
- 渲染进程无法直接访问 Node.js API
- 只能通过 `contextBridge` 暴露的 API 进行通信

#### 2. 密码加密
- 使用 `bcrypt` 加密存储密码
- 密码哈希值存储在数据库中，原始密码永远不会被存储

#### 3. 数据验证
- 所有 API 调用都进行参数验证
- 只允许更新特定字段，防止恶意修改

#### 4. 外键约束
- 数据库使用外键确保数据完整性
- 删除用户时，相关数据自动级联删除

---

### 七、数据库操作最佳实践

#### 1. 使用 Prepared Statements（预编译语句）
```typescript
// ✅ 正确：防止 SQL 注入
const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
const user = stmt.get(email)

// ❌ 错误：容易受到 SQL 注入攻击
const user = db.prepare(`SELECT * FROM users WHERE email = '${email}'`).get()
```

#### 2. 事务处理
对于需要多个操作的场景，可以使用事务：
```typescript
const transaction = db.transaction((userId, initialCapital) => {
  // 创建会话
  // 更新用户设置
  // 记录日志
  // 要么全部成功，要么全部回滚
})
```

#### 3. 错误处理
所有数据库操作都应该有错误处理：
```typescript
try {
  const user = await window.electronAPI.login(email, password)
} catch (error) {
  console.error('登录失败:', error)
  message.error('登录失败，请检查邮箱和密码')
}
```

---

## 📝 总结

### 数据库部分
- ✅ 使用 SQLite 作为本地数据库
- ✅ 4 个核心表：users, user_settings, sessions, trades
- ✅ 完整的索引优化查询性能
- ✅ 外键约束保证数据完整性

### API 部分
- ✅ 通过 IPC 实现主进程和渲染进程通信
- ✅ 5 大类 API：认证、交易、会话、计算、导出
- ✅ 安全的上下文隔离机制
- ✅ 完整的类型定义支持

### 数据流
```
React 组件
  ↓
window.electronAPI
  ↓
Preload (contextBridge)
  ↓
IPC (ipcRenderer.invoke)
  ↓
主进程 (ipcMain.handle)
  ↓
数据库操作 (better-sqlite3)
  ↓
返回结果
```

---

## 🔍 相关文件清单

- `src/main/database.ts` - 数据库初始化和连接管理
- `src/main/auth.ts` - 用户认证和设置管理
- `src/main/ipc.ts` - IPC 处理器定义
- `src/preload/index.ts` - API 暴露给渲染进程
- `src/renderer/src/env.d.ts` - TypeScript 类型定义
- `src/renderer/src/store/useAuthStore.ts` - 状态管理中使用 API

