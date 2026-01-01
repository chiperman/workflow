# API 文档

本文档说明所有 API 端点的请求和响应格式。

---

## 📋 目录

- [健康检查 API](#健康检查-api)
- [Supabase Keep-Alive API](#supabase-keep-alive-api)
  - [手动触发端点](#手动触发端点)
  - [自动触发端点](#自动触发端点-cron)
- [LeanCloud Keep-Alive API](#leancloud-keep-alive-api)
- [类型定义](#类型定义)
- [错误处理](#错误处理)
- [重试机制](#重试机制)

---

## 健康检查 API

检查所有服务的健康状态和统计数据。

### 端点

```
GET /api/health
```

### 请求参数

无

### 响应格式

```typescript
{
  status: 'Operational' | 'Degraded' | 'Checking',
  services: {
    supabase: ServiceHealth,
    leancloud: ServiceHealth
  }
}
```

### 响应示例

**成功响应（200 OK）**：

```json
{
  "status": "Operational",
  "services": {
    "supabase": {
      "status": "operational",
      "tableExists": true,
      "stats": {
        "auto_count": 42,
        "manual_count": 15
      }
    },
    "leancloud": {
      "status": "operational",
      "tableExists": true,
      "stats": {
        "auto_count": 38,
        "manual_count": 12
      }
    }
  }
}
```

**部分降级响应（200 OK）**：

```json
{
  "status": "Degraded",
  "services": {
    "supabase": {
      "status": "operational",
      "tableExists": true,
      "stats": {
        "auto_count": 42,
        "manual_count": 15
      }
    },
    "leancloud": {
      "status": "misconfigured",
      "tableExists": false,
      "stats": {
        "auto_count": 0,
        "manual_count": 0
      },
      "message": "Class \"keep_alive\" does not exist"
    }
  }
}
```

### 缓存

- 客户端使用 SWR 缓存
- 自动刷新间隔：30 秒
- 网络重连时自动刷新

---

## Supabase Keep-Alive API

Supabase 数据库保活任务，支持手动和自动触发。

### 手动触发端点

用于用户在 UI 上点击按钮手动触发。

#### 端点

```
POST /api/manual-trigger
```

#### 请求参数

无（固定为手动触发）

#### 请求示例

```bash
curl -X POST "http://localhost:3000/api/manual-trigger"
```

#### 响应格式

```typescript
{
  success: boolean,
  message?: string,
  data?: {
    auto_count: number,
    manual_count: number
  }
}
```

#### 响应示例

**成功响应（200 OK）**：

```json
{
  "success": true,
  "message": "Supabase keep-alive task completed successfully",
  "data": {
    "auto_count": 42,
    "manual_count": 16
  }
}
```

**表不存在错误（500 Internal Server Error）**：

```json
{
  "success": false,
  "message": "Table \"keep_alive\" does not exist. Please create the table first."
}
```

#### 副作用

- 更新 Supabase `keep_alive` 表的 `manual_count`
- 发送 Bark 通知（如果配置）

---

### 自动触发端点 (Cron)

用于 Vercel Cron Job 定时自动触发。

#### 端点

```
GET /api/supabase-keep-alive
```

#### 请求参数

**查询参数**：

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `trigger` | string | 否 | `auto` | 触发类型（`auto` 或 `manual`） |

#### 请求示例

```bash
# 自动触发（Cron Job）
curl "http://localhost:3000/api/supabase-keep-alive?trigger=auto"

# 手动触发（也可以使用这个端点）
curl "http://localhost:3000/api/supabase-keep-alive?trigger=manual"
```

#### 响应格式

同 [手动触发端点](#手动触发端点)

#### Cron Job 配置

在 `vercel.json` 中配置：

```json
{
  "crons": [
    {
      "path": "/api/supabase-keep-alive?trigger=auto",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Cron 表达式说明**：
- `0 8 * * *` - 每天 UTC 08:00 执行
- 相当于北京时间 16:00

#### 副作用

- 更新 Supabase `keep_alive` 表的 `auto_count` 或 `manual_count`
- 发送 Bark 通知（如果配置）

---

## LeanCloud Keep-Alive API

LeanCloud 数据库保活任务，支持手动和自动触发。

### 端点

```
GET /api/leancloud-keep-alive
```

### 请求参数

**查询参数**：

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `trigger` | string | 否 | `auto` | 触发类型（`auto` 或 `manual`） |
| `mode` | string | 否 | - | 设置为 `status` 时只返回统计数据 |

### 请求示例

```bash
# 自动触发（Cron Job）
curl "http://localhost:3000/api/leancloud-keep-alive?trigger=auto"

# 手动触发
curl "http://localhost:3000/api/leancloud-keep-alive?trigger=manual"

# 只获取统计数据
curl "http://localhost:3000/api/leancloud-keep-alive?mode=status"
```

### 响应格式

**Keep-Alive 响应**：

```typescript
{
  success: boolean,
  message?: string,
  data?: {
    auto_count: number,
    manual_count: number
  },
  error?: string,
  details?: string
}
```

**统计数据响应（mode=status）**：

```typescript
{
  auto_count: number,
  manual_count: number
}
```

### 响应示例

**成功响应（200 OK）**：

```json
{
  "success": true,
  "message": "LeanCloud keep-alive completed",
  "data": {
    "auto_count": 38,
    "manual_count": 13
  }
}
```

**类不存在（自动创建）**：

```json
{
  "success": true,
  "message": "Class created and initialized",
  "data": {
    "auto_count": 1,
    "manual_count": 0
  }
}
```

**错误响应（500 Internal Server Error）**：

```json
{
  "error": "Keep-alive logic failed",
  "details": "Network timeout"
}
```

### 特殊行为

- 如果 `keep_alive` 类不存在，会自动创建
- 自动设置 ACL 权限（公开读写）
- 支持通过 `mode=status` 只获取统计数据

### Cron Job 配置

```json
{
  "crons": [
    {
      "path": "/api/leancloud-keep-alive?trigger=auto",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### 副作用

- 更新 LeanCloud `keep_alive` 类的 `auto_count` 或 `manual_count`
- 发送 Bark 通知（如果配置）

---

## 类型定义

### ServiceHealth

```typescript
interface ServiceHealth {
  status: 'operational' | 'outage' | 'misconfigured' | 'unknown';
  tableExists?: boolean;
  stats: {
    auto_count: number;
    manual_count: number;
  };
  message?: string;
}
```

**字段说明**：

- `status` - 服务状态
  - `operational` - 正常运行
  - `outage` - 服务中断
  - `misconfigured` - 配置错误
  - `unknown` - 未知状态
- `tableExists` - 表/类是否存在
- `stats` - 统计数据
  - `auto_count` - 自动触发次数
  - `manual_count` - 手动触发次数
- `message` - 错误或状态消息（可选）

### SystemStatus

```typescript
type SystemStatus = 'Operational' | 'Degraded' | 'Checking';
```

**状态说明**：

- `Operational` - 所有服务正常
- `Degraded` - 部分服务降级
- `Checking` - 正在检查状态

### HealthCheckResponse

```typescript
interface HealthCheckResponse {
  status: SystemStatus;
  services: {
    supabase: ServiceHealth;
    leancloud: ServiceHealth;
  };
}
```

---

## 错误处理

### 错误响应格式

所有 API 错误都遵循统一格式：

```typescript
{
  success: false,
  error?: string,      // 错误类型
  message?: string,    // 用户友好的提示
  details?: string     // 详细错误信息
}
```

### 常见错误

#### 1. 表/类不存在

**Supabase 错误码**: `42P01`  
**LeanCloud 错误码**: `404`

**Supabase 响应**：
```json
{
  "success": false,
  "message": "Table \"keep_alive\" does not exist. Please create the table first."
}
```

**LeanCloud 响应**：
```json
{
  "success": true,
  "message": "Class created and initialized",
  "data": { "auto_count": 1, "manual_count": 0 }
}
```

**说明**：
- Supabase 需要手动创建表
- LeanCloud 会自动创建类

#### 2. 环境变量缺失

**响应**：
```json
{
  "success": false,
  "message": "Missing environment variable: SUPABASE_URL"
}
```

**解决方案**：检查 `.env.local` 文件

#### 3. 网络错误

**响应**：
```json
{
  "success": false,
  "message": "Network timeout"
}
```

**解决方案**：检查网络连接和服务状态

#### 4. 认证失败

**响应**：
```json
{
  "success": false,
  "message": "Authentication failed: invalid credentials"
}
```

**解决方案**：检查 API 密钥配置

---

## 重试机制

所有 API 调用都使用智能重试机制。

### 配置

```typescript
const RETRY_CONFIG = {
  MAX_RETRIES: 3,           // 最大重试次数
  BASE_DELAY_MS: 1000,      // 基础延迟（毫秒）
  BACKOFF_MULTIPLIER: 2     // 指数退避倍数
};
```

### 重试策略

**可重试错误**：
- 网络错误
- 超时
- 临时故障
- 5xx 服务器错误

**不可重试错误**：
- 配置错误（环境变量缺失）
- 认证失败
- 表不存在（Supabase）
- 4xx 客户端错误

### 延迟计算

```
延迟 = BASE_DELAY_MS * (BACKOFF_MULTIPLIER ^ (attempt - 1))
```

**示例**：
- 第 1 次重试：1000ms
- 第 2 次重试：2000ms
- 第 3 次重试：4000ms

### 日志输出

```
⟳ Retry attempt 1/3 failed. Retrying in 1000ms...
  Error: Network timeout
⟳ Retry attempt 2/3 failed. Retrying in 2000ms...
  Error: Network timeout
✓ Retry succeeded on attempt 3/3
```

---

## API 对比

### Supabase vs LeanCloud

| 特性 | Supabase | LeanCloud |
|------|----------|-----------|
| **手动触发端点** | `POST /api/manual-trigger` | `GET /api/leancloud-keep-alive?trigger=manual` |
| **自动触发端点** | `GET /api/supabase-keep-alive?trigger=auto` | `GET /api/leancloud-keep-alive?trigger=auto` |
| **表/类不存在** | 返回错误，需手动创建 | 自动创建 |
| **统计查询** | 通过 `/api/health` | 支持 `?mode=status` |
| **HTTP 方法** | POST（手动）/ GET（自动） | GET（统一） |
| **ACL 权限** | 通过 RLS 策略 | 自动设置公开读写 |

---

## 示例代码

### JavaScript/TypeScript

```typescript
// 获取健康状态
async function getHealth() {
  const response = await fetch('/api/health');
  const data = await response.json();
  console.log('System Status:', data.status);
  console.log('Supabase:', data.services.supabase);
  console.log('LeanCloud:', data.services.leancloud);
}

// Supabase 手动触发
async function triggerSupabase() {
  const response = await fetch('/api/manual-trigger', {
    method: 'POST'
  });
  const data = await response.json();
  
  if (data.success) {
    console.log('Success:', data.message);
    console.log('Stats:', data.data);
  } else {
    console.error('Error:', data.message);
  }
}

// LeanCloud 手动触发
async function triggerLeanCloud() {
  const response = await fetch('/api/leancloud-keep-alive?trigger=manual');
  const data = await response.json();
  
  if (data.success) {
    console.log('Success:', data.message);
    console.log('Stats:', data.data);
  } else {
    console.error('Error:', data.error);
  }
}

// 获取 LeanCloud 统计数据
async function getLeanCloudStats() {
  const response = await fetch('/api/leancloud-keep-alive?mode=status');
  const stats = await response.json();
  console.log('Auto count:', stats.auto_count);
  console.log('Manual count:', stats.manual_count);
}
```

### cURL

```bash
# 健康检查
curl http://localhost:3000/api/health | jq

# Supabase 手动触发
curl -X POST "http://localhost:3000/api/manual-trigger" | jq

# Supabase 自动触发
curl "http://localhost:3000/api/supabase-keep-alive?trigger=auto" | jq

# LeanCloud 手动触发
curl "http://localhost:3000/api/leancloud-keep-alive?trigger=manual" | jq

# LeanCloud 自动触发
curl "http://localhost:3000/api/leancloud-keep-alive?trigger=auto" | jq

# LeanCloud 统计数据
curl "http://localhost:3000/api/leancloud-keep-alive?mode=status" | jq
```

### Python

```python
import requests

# 获取健康状态
response = requests.get('http://localhost:3000/api/health')
data = response.json()
print(f"Status: {data['status']}")
print(f"Supabase: {data['services']['supabase']}")
print(f"LeanCloud: {data['services']['leancloud']}")

# Supabase 手动触发
response = requests.post('http://localhost:3000/api/manual-trigger')
result = response.json()
if result['success']:
    print(f"Success: {result['message']}")
    print(f"Stats: {result['data']}")

# LeanCloud 手动触发
response = requests.get(
    'http://localhost:3000/api/leancloud-keep-alive',
    params={'trigger': 'manual'}
)
result = response.json()
if result['success']:
    print(f"Success: {result['message']}")
    print(f"Stats: {result['data']}")
```

---

## 速率限制

目前没有实施速率限制，但建议：

- **手动触发**：每分钟不超过 10 次
- **自动触发**：每天 1-2 次（Cron Job）
- **健康检查**：客户端自动缓存 30 秒

---

## 安全性

### 环境变量

- 敏感信息存储在环境变量中
- 使用 `NEXT_PUBLIC_` 前缀的变量会暴露给客户端
- 服务端密钥（如 `LEANCLOUD_MASTER_KEY`）不会暴露

### CORS

- API 路由默认允许同源请求
- 跨域请求需要额外配置

### 认证

- 当前版本没有实施用户认证
- Supabase 和 LeanCloud 使用各自的 API 密钥
- 建议在生产环境配置 RLS 策略

---

## 变更日志

### v0.3.0 (2025-12-23)

- ✅ 完善 API 文档
- ✅ 统一代码注释语言
- ✅ 添加 API 对比表
- ✅ 补充 LeanCloud 统计查询说明

### v0.2.0 (2025-12-20)

- ✅ 添加 SWR 缓存支持
- ✅ 优化错误处理和消息
- ✅ 添加重试机制
- ✅ 统一响应格式

### v0.1.0 (2025-12-15)

- ✅ 初始版本
- ✅ Supabase 和 LeanCloud keep-alive

---

**最后更新**: 2025-12-23
