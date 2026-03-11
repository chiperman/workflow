# 任务配置说明文档 (Task Configuration Guide)

本文档详细介绍了在 "Edit Task" (编辑任务) 弹窗中各项配置的功能、格式及其对系统行为的影响。

---

## 1. 基础配置 (Basic Configuration)

| 字段名                 | 键名                 | 格式              | 说明                                                                          |
| :--------------------- | :------------------- | :---------------- | :---------------------------------------------------------------------------- |
| **Service ID**         | `service`            | String (唯一)     | 系统的唯一标识符（如 `glados`）。创建后不可修改，用于 API 路由定位。          |
| **Display Name**       | `name`               | String            | 在控制面板显示的名称。如果为空，将回退显示 Service ID。                       |
| **Category**           | `category`           | String            | 任务分类标签，用于视觉区分任务类型。                                          |
| **Notification Level** | `notification_level` | Enum              | 定义何时触发外部通知 (如 Bark)。可选：`always`, `failure-only`, `none`。      |
| **Description**        | `description`        | String (TextArea) | 任务的详细描述，解释该自动化协议的具体作用。                                  |
| **Task Type**          | `type`               | Enum              | 核心执行模式。可选：`http` (请求外部接口) 或 `supabase_internal` (内部维护)。 |

---

## 2. HTTP 设置 (HTTP Settings)

_注：仅在 `Task Type` 为 `http` 时生效并展示。_

### 2.1 目标地址 (Target URLs)

- **字段**: `config.urls`
- **格式**: 每行一个完整的 URL 字符串。
- **行为**: 系统会按顺序尝试请求，直到有一个成功为止（支持多节点冗余）。

### 2.2 请求方法 (Method)

- **字段**: `config.method`
- **可选值**: `GET`, `POST`, `PUT`。默认为 `POST`。

### 2.3 请求头 (Headers)

- **字段**: `config.headers`
- **格式**: **JSON Object**。
- **示例**:
  ```json
  {
    "Content-Type": "application/json",
    "User-Agent": "Workflow-Bot/1.0"
  }
  ```

### 2.4 请求体 (Body)

- **字段**: `config.body`
- **格式**: String 或 JSON 字符串。

---

## 3. 校验规则 (Validation Rules)

校验规则决定了任务执行后是记为“成功”还是“失败”，并直接影响热力图统计。

### 3.1 成功判定 (Success Rule)

- **字段**: `rules.success`
- **格式**: **JSON Object**。
- **常见配置**:
  - **状态码检查**: `{"status": 200}`
  - **内容深度检查**:
    ```json
    {
      "status": 200,
      "json": [
        { "path": "code", "operator": "in", "value": [0, 1] },
        { "path": "message", "operator": "contains", "value": "success" }
      ]
    }
    ```

### 3.2 字段说明

- `path`: JSON 响应中的键路径（支持嵌套，如 `data.user.id`）。
- `operator`: 操作符。支持 `eq` (等于), `neq` (不等于), `gt` (大于), `lt` (小于), `in` (包含于数组), `contains` (字符串包含)。
- `value`: 期望的值。

---

## 4. 最佳实践建议

1. **唯一性**: `Service ID` 建议使用小写字母、数字和连字符（如 `my-web-task`）。
2. **通知策略**: 对于关键保活任务，建议设置为 `failure-only`，以减少不必要的通知干扰。
3. **安全**: 避免在 `Headers` 或 `Body` 中直接硬编码极度敏感的密钥。建议通过环境变量（如 `process.env.XXX`）注入，目前系统对 `glados` 等服务有专门的注入逻辑。
