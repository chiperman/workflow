# API 开发文档

本文档说明项目所有 API 端点的请求与响应格式。

---

## 📋 目录

- [核心概念](#核心概念)
- [健康检查 API](#健康检查)
- [热力图 API](#热力图)
- [任务执行协议](#任务执行)
- [服务配置 API](#服务配置)

---

## 核心概念

系统采用统一的响应处理高阶函数与标准的鉴权机制。

### 鉴权方式

| 触发源     | 鉴权方式                        | 说明                     |
| :--------- | :------------------------------ | :----------------------- |
| **控制台** | Session Cookie / `X-App-Key`    | 仪表盘手动操作。         |
| **自动化** | `Authorization` Header (Bearer) | Vercel Cron 或外部触发。 |

### 统一响应格式

所有 API 均返回标准 `ApiResponse<T>` 结构：

```json
{
  "success": true,
  "message": "可选的反馈信息",
  "data": { ... },
  "error": "可选的错误详情"
}
```

---

## 健康检查 API

```
GET /api/health
```

返回系统整体运行状态及各维护协议的实时健康度。

### 响应示例

```json
{
  "status": "Operational",
  "services": {
    "supabase": {
      "status": "operational",
      "stats": { "auto_count": 42, "manual_count": 15, "failure_count": 0 }
    }
  }
}
```

---

## 热力图 API

```
GET /api/stats/heatmap
```

返回指定年度的聚合签到数据，默认返回当前年度。

### 响应示例

```json
{
  "success": true,
  "data": {
    "heatmap": [
      {
        "date": "2026-01-15",
        "success_count": 3,
        "failure_count": 0,
        "services": { "supabase": "success" }
      }
    ],
    "services": [{ "service": "supabase", "created_at": "..." }]
  }
}
```

---

## 任务执行协议

```
POST /api/tasks/[id]
```

通过唯一标识符触发特定的维护协议。

- **id**: 服务唯一标识符（如 `glados`）。
- **查询参数**: `trigger=manual` (手动) 或 `trigger=auto` (自动)。

### 响应示例

```json
{
  "success": true,
  "message": "Protocol executed successfully",
  "duration": 250,
  "data": { "auto_count": 26, "manual_count": 5, "failure_count": 0 }
}
```

---

## 服务配置 API

负责维护协议的增删改查。

### 主要端点

- **GET `/api/service-config`**: 罗列所有活动协议。
- **POST `/api/service-config`**: 创建新协议。
- **PUT `/api/service-config`**: 更新现有协议。
- **DELETE `/api/service-config?service=[id]`**: 删除指定协议。
- **PATCH `/api/service-config`**: 切换服务的 `enabled` 状态。
