# 任务配置说明文档

本文档详细介绍了维护协议配置弹窗中各项字段的功能、格式及其对系统行为的影响。

---

## 1. 基础配置 (Basic Configuration)

| 字段名                 | 键名                 | 格式              | 说明                                                                   |
| :--------------------- | :------------------- | :---------------- | :--------------------------------------------------------------------- |
| **Service ID**         | `service`            | String (唯一)     | 系统的唯一标识符（如 `glados`）。创建后不可修改，用于 API 路由定位。   |
| **Display Name**       | `name`               | String            | 在控制面板显示的名称。                                                 |
| **Category**           | `category`           | String            | 任务分类标签，用于视觉区分。                                           |
| **Notification Level** | `notification_level` | Enum              | 定义触发外部通知（如 Bark）的阈值 (`always`, `failure-only`, `none`)。 |
| **Description**        | `description`        | String (TextArea) | 任务的详细描述，解释其具体作用。                                       |
| **Task Type**          | `type`               | Enum              | 核心执行模式 (`http` 外部请求或 `supabase_internal` 内部维护)。        |

---

## 2. HTTP 设置 (HTTP Settings)

_注：仅在 `Task Type` 为 `http` 时生效。_

### 2.1 目标地址 (Target URLs)

- **键名**: `config.urls`
- **说明**: 每行一个 URL。系统将执行轮询逻辑，直到检测到首个成功响应。

### 2.2 请求方法 (Method)

- **键名**: `config.method`
- **可选值**: `GET`, `POST`, `PUT`。默认为 `POST`。

### 2.3 请求头 (Headers)

- **键名**: `config.headers`
- **格式**: **JSON Object**。
- **示例**:
  ```json
  {
    "Content-Type": "application/json",
    "User-Agent": "Workflow-Bot/1.0"
  }
  ```

---

## 3. 校验规则 (Validation Rules)

校验规则直接决定热力图的统计口径与成功判定。

### 3.1 成功判定 (Success Rule)

- **键名**: `rules.success`
- **格式**: **JSON Object**。
- **常见模式**:
  - **仅状态码**: `{"status": 200}`
  - **深度内容校验**:
    ```json
    {
      "status": 200,
      "json": [
        { "path": "code", "operator": "eq", "value": 0 },
        { "path": "message", "operator": "contains", "value": "success" }
      ]
    }
    ```

### 3.2 操作符说明

- `path`: JSON 中的键路径（支持点操作符，如 `data.user_id`）。
- `operator`: 比较方法 (`eq` 等于, `neq` 不等于, `gt` 大于, `lt` 小于, `in` 包含于数组, `contains` 字符串包含)。
- `value`: 预期的目标值。

---

## 4. 最佳实践

1. **命名规范**: `Service ID` 建议使用小写字母、数字和连字符（如 `access-monitor`）。
2. **通知策略**: 对于高频自动任务，建议设置为 `failure-only` 以降低通知噪音。
3. **安全性**: 避免在 `Headers` 或 `Body` 中硬编码明文密钥。优先利用系统的动态环境注入逻辑。
