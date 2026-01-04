# API 文档

本文档说明所有 API 端点的请求和响应格式。

---

## 📋 目录

- [核心概念](#核心概念)
- [健康检查 API](#健康检查-api)
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

### 响应示例

```json
{
  "status": "Operational",
  "services": {
    "supabase": {
      "status": "operational",
      "stats": { "auto_count": 42, "manual_count": 15 }
    },
    "leancloud": {
      "status": "operational",
      "stats": { "auto_count": 38, "manual_count": 12 }
    },
    "glados": {
      "status": "operational",
      "stats": { "auto_count": 25, "manual_count": 5 }
    }
  }
}
```

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
  "leancloud": { "success": true, "message": "..." },
  "glados": { "success": true, "message": "..." }
}
```

**特点：**

- 三个服务并行执行，互不影响
- 一个失败不影响其他服务
- 手动触发仍可使用独立端点

---

## 手动触发接口

### Supabase 保活

- **端点**: `/api/supabase-keep-alive`
- **方法**: POST (手动) / GET (自动)
- **响应**:
  ```json
  {
    "success": true,
    "message": "Keep-alive successful",
    "duration": 125,
    "data": { "auto_count": 43, "manual_count": 15 }
  }
  ```

### LeanCloud 保活

- **端点**: `/api/leancloud-keep-alive`
- **方法**: POST (手动) / GET (自动)

### GLaDOS 签到

- **端点**: `/api/glados-checkin`
- **方法**: POST (手动) / GET (自动)
- **响应** (首次签到成功):
  ```json
  {
    "success": true,
    "message": "GLaDOS Success: Updated record at 北京时间 10:00 (auto). Auto=26, Manual=5.",
    "duration": 250,
    "data": { "auto_count": 26, "manual_count": 5 }
  }
  ```
- **响应** (重复签到):
  ```json
  {
    "success": true,
    "message": "GLaDOS Checked-in: \"Checkin Repeats! Please Try Tomorrow\" [Executed at 北京时间 10:00 (auto)]",
    "duration": 180,
    "data": { "auto_count": 25, "manual_count": 5 }
  }
  ```

---

## 数据库设置

首次部署时，需要在 Supabase Dashboard → SQL Editor 执行以下脚本：

```sql
-- 创建 keep_alive 表
-- 如果已有旧表，请先删除后再执行此脚本
CREATE TABLE IF NOT EXISTS keep_alive (
  service TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  manual_count INTEGER NOT NULL DEFAULT 0,
  auto_count INTEGER NOT NULL DEFAULT 0
);

-- 初始化服务记录
INSERT INTO keep_alive (service, timestamp, manual_count, auto_count)
VALUES
  ('supabase', NOW(), 0, 0),
  ('glados', NOW(), 0, 0)
ON CONFLICT (service) DO NOTHING;
```

**注意：** 如果之前已存在 `keep_alive` 表（旧结构），请先删除该表再执行上述脚本。

---

## 变更日志

### v0.5.0 (2026-01-04)

- ✅ **新增**: GLaDOS 每日签到功能
- ✅ **新增**: `/api/glados-checkin` 端点
- ✅ **增强**: 健康检查 API 包含 GLaDOS 服务状态
- ✅ **优化**: GLaDOS 数据合并到 `keep_alive` 表，通过 `service` 字段区分，减少表数量
- ✅ **优化**: 统一 cron job 触发所有服务（并行执行），解决免费版 Vercel 限制

### v0.4.5 (2026-01-03)

- ✅ **重构**: 引入 `BaseService.notificationLevel` 控制通知噪音。
- ✅ **增强**: 所有的业务操作现在都有精确的 `duration` 记录（毫秒）。
- ✅ **日志**: 引入统一的 `logger` 系统，移除无序的 `console` 输出。

### v0.4.1 (2026-01-02)

- ✅ **重构**: 统一保活端点，支持基于 HTTP 方法的触发模式自动识别。

---

**最后更新**: 2026-01-05 (v0.5.0)
