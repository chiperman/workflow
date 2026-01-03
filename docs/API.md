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
    }
  }
}
```

---

## 执行接口

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

---

## 变更日志

### v0.4.5 (2026-01-03)

- ✅ **重构**: 引入 `BaseService.notificationLevel` 控制通知噪音。
- ✅ **增强**: 所有的业务操作现在都有精确的 `duration` 记录（毫秒）。
- ✅ **日志**: 引入统一的 `logger` 系统，移除无序的 `console` 输出。

### v0.4.1 (2026-01-02)

- ✅ **重构**: 统一保活端点，支持基于 HTTP 方法的触发模式自动识别。

---

**最后更新**: 2026-01-03 (v0.4.5)
