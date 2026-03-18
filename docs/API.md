# API 文档

本文档说明所有 API 端点的请求和响应格式。

---

## 📋 目录

- [核心概念](#核心概念)
- [健康检查 API](#健康检查-api)
- [热力图 API](#热力图-api)
- [执行接口 (Supabase/LeanCloud)](#执行接口)
- [变更日志](#变更日志)

---

## 核心概念

在 `v0.4.5` 中，系统采用分级通知策略，极大降低了自动任务的通知噪音。

### 触发模式

| 模式       | 触发源         | 鉴权方式               | 说明                                  |
| :--------- | :------------- | :--------------------- | :------------------------------------ |
| **Manual** | 控制台手动点击 | `X-App-Key` Header     | 更新 manual_count，通常会有成功通知。 |
| **Auto**   | Vercel Cron    | `Authorization` Header | 更新 auto_count，默认仅在失败时通知。 |

---

## 健康检查 API

```
GET /api/health
```

> ⚠️ **鉴权**: 需要有效的 Session Cookie 或 `X-App-Key` Header。

### 响应示例

```json
{
  "status": "Operational",
  "services": {
    "supabase": {
      "status": "operational",
      "stats": { "auto_count": 42, "manual_count": 15 }
    },

    "glados": {
      "status": "operational",
      "stats": { "auto_count": 25, "manual_count": 5 }
    }
  }
}
```

---

## 热力图 API

> v0.8.0 新增

```
GET /api/stats/heatmap
```

> ⚠️ **鉴权**: 需要有效的 Session Cookie 或 `X-App-Key` Header。

返回过去 12 个月的签到记录聚合数据，用于渲染 GitHub 风格的热力图。

### 响应示例

{
"success": true,
"data": [
{
"date": "2026-01-15",
"success_count": 3,
"failure_count": 0,
"services": {
"supabase": "success",

"glados": "success"
}
}
],
"year": 2026
}

### 聚合逻辑

- **服务级最终一致性**: 如果某服务当天有任意一条 `success` 记录，则该服务当天视为成功（即使之前有失败）。
- **失败定义**: 仅当某服务当天只有 `failure` 记录时，才算失败。
- **时区**: 按北京时间 (Asia/Shanghai) 聚合日期。

---

## 服务配置 API

### 更新服务开关状态

- **端点**: `/api/service-config`
- **方法**: PATCH
- **鉴权**: `X-App-Key` Header（必须）
- **请求体**:
  ```json
  { "service": "supabase", "enabled": false }
  ```
- **响应**:
  ```json
  { "success": true, "service": "supabase", "enabled": false }
  ```

**说明**：

- `service` 必须是 `supabase` 或 `glados` 之一。
- `enabled: false` 时，该服务的自动 Cron 任务将被跳过，但手动触发不受影响。

---

## 统一 Cron Job

所有服务的定时任务统一由一个 cron job 触发（免费版 Vercel 限制 2 个 cron job）：

- **端点**: `/api/cron-all`
- **方法**: GET
- **时间**: 每天 UTC 01:00 (北京时间 09:00)
- **执行方式**: 并行执行三个服务

**响应示例：**

```json
{
  "supabase": { "success": true, "message": "..." },

  "glados": { "success": true, "message": "..." }
}
```

**特点：**

- 三个服务并行执行，互不影响
- 一个失败不影响其他服务
- 手动触发仍可使用独立端点

---

## 统一任务执行 API (Task Protocol)

> v0.8.3 统一

所有服务的执行均通过动态任务端点完成。

```
POST /api/tasks/[id]
```

- **id**: 数据库中的 `service` 标识符（如 `supabase`, `glados`）。
- **查询参数**: `trigger=manual` (默认) 或 `trigger=auto`。
- **鉴权**: 需要有效凭证（Session/App-Key/Cron）。

### 响应示例

```json
{
  "success": true,
  "message": "GLaDOS Success: Updated record at 北京时间 10:00",
  "duration": 250,
  "data": { "auto_count": 26, "manual_count": 5, "failure_count": 0 }
}
```

---

## 数据库设置

首次部署时，请在 Supabase Dashboard → SQL Editor 执行初始化脚本：

👉 [**supabase/setup.sql**](../supabase/setup.sql)

---

## 变更日志

### v0.9.0 (2026-03-18)

- ✅ **增强**: `keep_alive_logs` 表结构升级，新增 `message` (反馈详情) 和 `duration` (执行耗时) 字段。
- ✅ **重构**: 日志 `status` 字段由 `boolean` 切换为 `TEXT` (`'success'` / `'failure'`)，对齐 `setup.sql` 规范。
- ✅ **优化**: `DynamicService` 验证失败时自动记录返回内容片段（前 100 字符），极大提升排错效率。
- ✅ **修复**: 修正了 GLaDOS 签到由于 Cookie 缺失导致验证失败的问题。

### v0.8.8 (2026-01-20)

- ✅ **新增**: 热力图年份选择器增强 API (`/api/stats/heatmap/years` 返回值逻辑优化说明)。
- ✅ **新增**: `keep_alive_logs` 表记录完整性 (支持 Unexecuted 状态推断)。
- ✅ **重构**: 全面代码优化 (O1-O8)，包括废弃代码清理、常量提取。
- ✅ **新增**: 统一日志级别控制 `LOG_LEVEL`。
- ✅ **新增**: 标准 API 响应接口定义 `ApiResponse<T>`。
- ✅ **测试**: 开启 UI 组件的测试覆盖率统计。

### v0.8.4 (2026-01-18)

- ✅ **安全加固**: 所有 API 接口现在需要鉴权（Session Cookie 或 `X-App-Key`）。
- ✅ **新增**: T2 API 路由单元测试。

### v0.8.3 (2026-01-17)

- ✅ **移除**: LeanCloud 相关的所有 API 端点 (`/api/leancloud-keep-alive`) 和数据字段。
- ✅ **优化**: 简化了 `/api/health` 和 `/api/cron-all` 的响应结构。

### v0.8.0 (2026-01-16)

- ✅ **新增**: 热力图 API (`/api/stats/heatmap`)，返回过去 12 个月签到数据
- ✅ **新增**: `keep_alive_logs` 表，记录每次签到详细状态
- ✅ **增强**: 服务级最终一致性逻辑，修复后的服务当天显示为绿色
- ✅ **增强**: 独立失败统计，`keep_alive` 表新增 `failure_count` 字段
- ✅ **优化**: 后端日志去重，每天每服务仅记录首次成功

### v0.6.1 (2026-01-14)

- ✅ **修复**: Toggle 开关操作失败时显示错误提示（之前静默失败）
- ✅ **优化**: 统一错误消息为 "Invalid App Key"
- ✅ **修复**: 刷新页面后开关状态正确同步数据库值
- ✅ **优化**: 禁用态 UI 改进，卡片不再变灰，仅显示 "Auto: OFF" 标签
- ✅ **优化**: App Key 编辑中不影响操作（只有保存后才生效）
- ✅ **维护**: 更新 husky 配置为 v9+ 格式

### v0.6.0 (2026-01-05)

- ✅ **新增**: 服务开关功能，可通过 UI 控制每个服务的自动执行（`/api/service-config`）
- ✅ **增强**: 健康检查 API 返回 `enabled` 字段
- ✅ **增强**: `keep_alive` 表增加 `enabled` 字段

### v0.5.0 (2026-01-04)

- ✅ **新增**: GLaDOS 每日签到功能
- ✅ **新增**: `/api/glados-checkin` 端点
- ✅ **增强**: 健康检查 API 包含 GLaDOS 服务状态
- ✅ **优化**: GLaDOS 数据合并到 `keep_alive` 表，通过 `service` 字段区分
- ✅ **优化**: 统一 cron job 触发所有服务（并行执行），解决免费版 Vercel 限制

### v0.4.5 (2026-01-03)

- ✅ **重构**: 引入 `BaseService.notificationLevel` 控制通知噪音。
- ✅ **增强**: 所有的业务操作现在都有精确的 `duration` 记录（毫秒）。
- ✅ **日志**: 引入统一的 `logger` 系统，移除无序的 `console` 输出。

### v0.4.1 (2026-01-02)

- ✅ **重构**: 统一保活端点，支持基于 HTTP 方法的触发模式自动识别。

---

**最后更新**: 2026-03-18
