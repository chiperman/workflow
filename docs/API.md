# API 文档

本文档说明所有 API 端点的请求和响应格式。

---

## 📋 目录

- [核心概念](#核心概念)
- [健康检查 API](#健康检查-api)
- [手动控制台 API (Manual)](#手动控制台-api-manual)
- [定时任务 API (Cron)](#定时任务-api-cron)
- [类型定义](#类型定义)
- [错误处理](#错误处理)
- [重试机制](#重试机制)

---

## 核心概念

在 `v0.4.1` 架构中，所有保活操作都区分 **手动 (Manual)** 和 **自动 (Auto)** 两种模式，它们共享统一的处理逻辑，但执行不同的鉴权和统计策略。

### 触发模式对比

| 模式       | 触发源                | 鉴权方式               | 说明                                          |
| :--------- | :-------------------- | :--------------------- | :-------------------------------------------- |
| **Manual** | 控制台网页 / 手动按钮 | `X-App-Key` Header     | 更新 `manual_count`，用于临时的手动干预。     |
| **Auto**   | Vercel Cron Job       | `Authorization` Header | 更新 `auto_count`，用于每日自动化的定期保活。 |

### 响应格式 (KeepAliveResult)

所有保活相关接口（无论手动或自动）均返回以下标准格式：

```typescript
{
  success: boolean,
  message: string,
  duration: number,  // 执行耗时（毫秒）
  data?: {
    auto_count: number,
    manual_count: number
  },
  error?: string
}
```

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

## 手动控制台 API (Manual)

这些端点专门设计用于网页控制台的手动触发。推荐使用 `POST` 方法，后端会自动识别为手动模式。

### 1. Supabase 手动触发

- **端点**: `POST /api/supabase-keep-alive`
- **Header**: `X-App-Key: <APP_KEY>`
- **说明**: 触发 Supabase 的一次手动活跃信号。

### 2. LeanCloud 手动触发

- **端点**: `POST /api/leancloud-keep-alive`
- **Header**: `X-App-Key: <APP_KEY>`
- **说明**: 触发 LeanCloud 的一次手动活跃信号。

> [!TIP]
> 早期版本使用的 `/api/manual-trigger` 已被废弃，请统一使用上述专属端点。

---

## 定时任务 API (Cron)

这些端点专门配置在 `vercel.json` 中。使用 `GET` 方法时，后端会自动识别为自动触发模式。

### 端点一览

| 服务          | 端点                            | 调度时间 (UTC) |
| :------------ | :------------------------------ | :------------- |
| **Supabase**  | `GET /api/supabase-keep-alive`  | 08:00          |
| **LeanCloud** | `GET /api/leancloud-keep-alive` | 09:00          |

### 鉴权要求

必须携带 Vercel 系统提供的 Cron Secret：

- **Header**: `Authorization: Bearer <CRON_SECRET>`

> [!NOTE]
> 如果需要在 `GET` 请求中显式指定模式，可添加参数 `?trigger=auto` 或 `?trigger=manual`。参数优先级高于 HTTP 方法推断。

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
  MAX_RETRIES: 3, // 最大重试次数
  BASE_DELAY_MS: 1000, // 基础延迟（毫秒）
  BACKOFF_MULTIPLIER: 2, // 指数退避倍数
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

| 特性             | Supabase                                    | LeanCloud                                    |
| ---------------- | ------------------------------------------- | -------------------------------------------- |
| **手动触发端点** | `POST /api/supabase-keep-alive`             | `POST /api/leancloud-keep-alive`             |
| **自动触发端点** | `GET /api/supabase-keep-alive?trigger=auto` | `GET /api/leancloud-keep-alive?trigger=auto` |
| **表/类不存在**  | 返回错误，需手动创建                        | 自动创建                                     |
| **统计查询**     | 通过 `/api/health`                          | 支持 `?mode=status`                          |
| **HTTP 方法**    | POST（手动）/ GET（自动）                   | POST（手动）/ GET（自动）                    |
| **ACL 权限**     | 通过 RLS 策略                               | 自动设置公开读写                             |

---

## 示例代码

### JavaScript/TypeScript

```javascript
// 获取健康状态
async function getHealth() {
  const response = await fetch('/api/health');
  const data = await response.json();
  console.log('System Status:', data.status);
}

// Supabase 手动触发
async function triggerSupabase(appKey: string) {
  const response = await fetch('/api/supabase-keep-alive', {
    method: 'POST',
    headers: {
      'X-App-Key': appKey,
    },
  });
  const data = await response.json();
  console.log(data.success ? 'Success' : 'Error', data.message);
}

// LeanCloud 手动触发
async function triggerLeanCloud(appKey: string) {
  const response = await fetch('/api/leancloud-keep-alive', {
    method: 'POST',
    headers: {
      'X-App-Key': appKey,
    },
  });
  const data = await response.json();
  console.log(data.success ? 'Success' : 'Error', data.message);
}

// 获取服务统计 (公开接口)
async function getStats(servicePath: string) {
  const response = await fetch(`${servicePath}?mode=status`);
  const stats = await response.json();
  console.log('Stats:', stats);
}
```

### cURL 示例

```bash
# 健康检查 (不鉴权)
curl http://localhost:3000/api/health | jq

# Supabase 手动触发
curl -X POST "http://localhost:3000/api/supabase-keep-alive" \
     -H "X-App-Key: your_app_key" | jq

# Supabase 自动触发 (模拟 Cron)
curl "http://localhost:3000/api/supabase-keep-alive?trigger=auto" \
     -H "Authorization: Bearer your_cron_secret" | jq

# LeanCloud 手动触发
curl -X POST "http://localhost:3000/api/leancloud-keep-alive" \
     -H "X-App-Key: your_app_key" | jq

# 统计数据查询 (不鉴权)
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
response = requests.post('http://localhost:3000/api/supabase-keep-alive')
result = response.json()
if result['success']:
    print(f"Success: {result['message']}")
    print(f"Stats: {result['data']}")

# LeanCloud 手动触发
response = requests.post(
    'http://localhost:3000/api/leancloud-keep-alive',
    headers={'X-App-Key': 'your_app_key'}
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

### 认证 (v0.4.0 增强)

为了保护系统资源，所有涉及保活操作的 API 都强制执行身份验证。

#### 1. 自动化任务鉴权 (Cron)

- **Header**: `Authorization: Bearer <CRON_SECRET>`
- **适用场景**: Vercel Cron Job 自动调用。
- **获取方式**: 在 Vercel 项目设置中定义 `CRON_SECRET`。

#### 2. 手动操作鉴权 (Dashboard)

- **Header**: `X-App-Key: <APP_KEY>`
- **适用场景**: 控制台网页手动触发按钮。
- **获取方式**: 在 Vercel 项目设置中定义 `APP_KEY`，并在网页端相应面板输入。

> [!NOTE]
> 健康检查接口 `/api/health` 以及统计查询 `?mode=status` 保持公开访问，以便于状态监控。

---

## 变更日志

### v0.4.1 (2026-01-02)

- ✅ **重构**: 统一保活端点，支持基于 HTTP 方法的触发模式自动识别（POST 为手动，GET 为自动）
- ✅ **重构**: 使用 `api-helper` 统一 API 响应格式和鉴权流程
- ✅ **安全**: 引入 API 访问控制机制 (APP_KEY, CRON_SECRET)
- ✅ **前端**: 增加密钥设置与持久化存储面板
- ✅ **变更**: 废弃并移除冗余的 `/api/manual-trigger` 中转路径
- ✅ **文档**: 重构全站文档以匹配最新的 API 交互规范

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

**最后更新**: 2026-01-02 (v0.4.1)
