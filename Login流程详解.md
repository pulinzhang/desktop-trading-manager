# Login 流程详解：为什么看不到传统的 SELECT 语句？

## 🤔 你的疑问

在 `src/main/ipc.ts` 中，login 的 IPC 处理器看起来很简单：

```typescript
ipcMain.handle('auth:login', async (_, email: string, password: string): Promise<User | null> => {
  return loginUser(email, password)  // 只是调用了一个函数？
})
```

**为什么看不到传统的 SELECT 语句？**

---

## 📍 答案：SELECT 语句在哪里？

**SELECT 语句实际上在 `src/main/auth.ts` 文件中！**

### 完整的调用链

```
React 组件
  ↓
window.electronAPI.login(email, password)
  ↓
Preload (src/preload/index.ts)
  ↓
IPC 调用 (ipcRenderer.invoke('auth:login', email, password))
  ↓
IPC 处理器 (src/main/ipc.ts) ← 你看到的地方
  ↓
loginUser 函数 (src/main/auth.ts) ← SELECT 语句在这里！
  ↓
数据库查询
```

---

## 🔍 详细代码分析

### 第一步：IPC 处理器（`src/main/ipc.ts`）

```typescript
// 登录
ipcMain.handle('auth:login', async (_, email: string, password: string): Promise<User | null> => {
  return loginUser(email, password)  // 👈 这里只是调用函数，不包含 SQL
})
```

**作用：**
- 接收来自渲染进程的 IPC 消息
- 将参数传递给 `loginUser` 函数
- 返回结果给渲染进程

**为什么不在这里写 SQL？**
- **代码分离**：IPC 处理器只负责通信，业务逻辑在 `auth.ts` 中
- **可维护性**：数据库操作集中管理，便于维护和测试
- **可复用性**：`loginUser` 函数可以在其他地方复用（比如命令行工具）

---

### 第二步：登录函数（`src/main/auth.ts`）

```typescript
export async function loginUser(email: string, password: string): Promise<User | null> {
  const db = getDatabase()  // 1. 获取数据库连接
  
  // 2. 👇 这里就是 SELECT 语句！使用预编译语句
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined
  
  if (!user) {
    return null  // 3. 用户不存在，返回 null
  }
  
  // 4. 验证密码（使用 bcrypt 比较）
  const isValid = await verifyPassword(password, user.password_hash)
  return isValid ? user : null  // 5. 密码正确返回用户，否则返回 null
}
```

**这就是你找的 SELECT 语句！**

```sql
SELECT * FROM users WHERE email = ?
```

---

## 💡 为什么使用 `db.prepare().get()` 而不是传统写法？

### 传统写法（不推荐）

```typescript
// ❌ 传统方式（容易受到 SQL 注入攻击）
const user = db.exec(`SELECT * FROM users WHERE email = '${email}'`)
```

**问题：**
1. **SQL 注入风险**：如果 `email` 包含恶意 SQL 代码，会被执行
2. **性能差**：每次都要解析 SQL 语句
3. **类型不安全**：返回结果没有类型检查

---

### 现代写法（推荐，本项目使用）

```typescript
// ✅ 使用预编译语句（Prepared Statement）
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
```

**优势：**
1. **防止 SQL 注入**：`?` 是占位符，参数会被安全地转义
2. **性能更好**：SQL 语句只编译一次，可以重复使用
3. **类型安全**：TypeScript 可以推断返回类型

---

## 📊 better-sqlite3 的查询方法对比

### 1. `.get()` - 获取单条记录

```typescript
// 返回第一条匹配的记录，如果没有则返回 undefined
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
// 类型：User | undefined
```

**使用场景：** 登录、根据 ID 查询等

---

### 2. `.all()` - 获取所有记录

```typescript
// 返回所有匹配的记录数组
const trades = db.prepare('SELECT * FROM trades WHERE user_id = ?').all(userId)
// 类型：Trade[]
```

**使用场景：** 获取交易列表、会话列表等

---

### 3. `.run()` - 执行更新操作

```typescript
// 执行 INSERT、UPDATE、DELETE，返回执行结果
const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hash)
// result.lastInsertRowid 包含新插入记录的 ID
```

**使用场景：** 创建、更新、删除操作

---

## 🔄 完整的 Login 流程（带 SQL 语句）

### 流程图

```
用户输入邮箱和密码
  ↓
React: window.electronAPI.login(email, password)
  ↓
Preload: ipcRenderer.invoke('auth:login', email, password)
  ↓
主进程 IPC: ipcMain.handle('auth:login', ...)
  ↓
调用 loginUser(email, password)
  ↓
┌─────────────────────────────────────┐
│ 1. 获取数据库连接                    │
│    const db = getDatabase()         │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. 执行 SELECT 查询                 │
│    SELECT * FROM users              │
│    WHERE email = ?                  │
│    👆 这就是你找的 SQL 语句！        │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 3. 检查用户是否存在                  │
│    if (!user) return null            │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 4. 验证密码（bcrypt）                │
│    verifyPassword(password, hash)    │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 5. 返回结果                          │
│    return isValid ? user : null     │
└─────────────────────────────────────┘
  ↓
返回给 React 组件
```

---

## 📝 代码位置总结

| 文件 | 代码 | 作用 |
|------|------|------|
| `src/main/ipc.ts` | `ipcMain.handle('auth:login', ...)` | IPC 通信层，接收请求 |
| `src/main/auth.ts` | `loginUser()` 函数 | **业务逻辑层，包含 SELECT 语句** |
| `src/main/auth.ts` | `db.prepare('SELECT * FROM users WHERE email = ?').get(email)` | **实际的 SQL 查询** |
| `src/preload/index.ts` | `login: (email, password) => ipcRenderer.invoke(...)` | 暴露 API 给渲染进程 |

---

## 🎯 为什么这样设计？

### 1. **关注点分离（Separation of Concerns）**

```
IPC 层 (ipc.ts)      → 负责进程间通信
业务逻辑层 (auth.ts) → 负责登录逻辑和数据库操作
数据访问层 (database.ts) → 负责数据库连接管理
```

### 2. **代码复用**

```typescript
// loginUser 可以在多个地方使用
export async function loginUser(email: string, password: string) {
  // ... 登录逻辑
}

// 1. 在 IPC 中使用
ipcMain.handle('auth:login', async (_, email, password) => {
  return loginUser(email, password)
})

// 2. 在命令行工具中使用
const user = await loginUser('test@example.com', 'password')

// 3. 在测试中使用
test('login should work', async () => {
  const user = await loginUser('test@example.com', 'password')
  expect(user).toBeTruthy()
})
```

### 3. **易于测试**

```typescript
// 可以单独测试 loginUser 函数，不需要启动 Electron
import { loginUser } from './auth'

test('login with correct password', async () => {
  const user = await loginUser('test@example.com', 'password123')
  expect(user).not.toBeNull()
})
```

---

## 🔍 如何找到所有 SQL 语句？

### 方法 1：搜索 `db.prepare`

```bash
# 在项目中搜索所有数据库查询
grep -r "db.prepare" src/main/
```

### 方法 2：搜索 SQL 关键字

```bash
# 搜索 SELECT 语句
grep -r "SELECT" src/main/

# 搜索 INSERT 语句
grep -r "INSERT" src/main/

# 搜索 UPDATE 语句
grep -r "UPDATE" src/main/
```

### 方法 3：查看文件

所有数据库操作都在以下文件中：
- `src/main/auth.ts` - 用户认证相关（包含 login 的 SELECT）
- `src/main/ipc.ts` - 其他数据库操作（交易、会话等）

---

## 📋 完整的 SQL 语句清单

### 在 `src/main/auth.ts` 中

```typescript
// 1. 登录查询
db.prepare('SELECT * FROM users WHERE email = ?').get(email)

// 2. 注册时检查用户是否存在
db.prepare('SELECT * FROM users WHERE email = ?').get(email)

// 3. 注册后获取新用户
db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)

// 4. 获取用户设置
db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId)

// 5. 更新用户设置后查询
db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId)
```

### 在 `src/main/ipc.ts` 中

```typescript
// 交易相关
db.prepare('SELECT * FROM trades WHERE user_id = ? AND session_id = ? ORDER BY sequence_number ASC').all(userId, sessionId)
db.prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY sequence_number DESC').all(userId)
db.prepare('SELECT * FROM trades WHERE id = ?').get(id)

// 会话相关
db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY session_number DESC').all(userId)
db.prepare('SELECT * FROM sessions WHERE user_id = ? AND is_active = 1 ORDER BY session_number DESC LIMIT 1').get(userId)
db.prepare('SELECT MAX(session_number) as max_num FROM sessions WHERE user_id = ?').get(userId)
```

---

## ✅ 总结

1. **SELECT 语句在哪里？**
   - 在 `src/main/auth.ts` 的 `loginUser` 函数中
   - 第 60 行：`db.prepare('SELECT * FROM users WHERE email = ?').get(email)`

2. **为什么在 IPC 中看不到？**
   - IPC 层只负责通信，业务逻辑在 `auth.ts` 中
   - 这是良好的代码架构设计（关注点分离）

3. **如何查看所有 SQL？**
   - 搜索 `db.prepare` 或 SQL 关键字
   - 查看 `src/main/auth.ts` 和 `src/main/ipc.ts`

4. **为什么使用 `prepare().get()`？**
   - 防止 SQL 注入
   - 性能更好
   - 类型安全

---

## 🎓 学习要点

- **IPC 处理器**：只负责接收和转发请求
- **业务逻辑函数**：包含实际的数据库操作和业务规则
- **预编译语句**：现代数据库操作的最佳实践

现在你知道 SELECT 语句在哪里了吗？😊

