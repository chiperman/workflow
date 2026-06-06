# 任务配置说明文档

本文档详细介绍了维护协议配置弹窗中各项字段的功能、格式及其对系统行为的影响。

---

## 1. 系统模型

任务系统采用数据驱动架构，维护协议与执行逻辑解耦：

- 数据库层：`service_configs` 是任务配置的单一事实来源，`keep_alive_logs` 与 `service_stats` 记录执行结果和统计数据。
- 服务层：`DynamicService` 在运行时解析数据库配置，`ServiceExecutor` 统一处理开关、执行、日志记录和通知。
- API 层：`/api/tasks/[id]` 触发单个任务，`/api/cron-all` 批量执行启用任务，`/api/service-config` 管理任务生命周期。
- 表现层：`TaskCard` 展示任务状态，`TaskConfigModal` 负责配置编辑与测试，`Heatmap` 展示年度执行结果。

任务生命周期：

1. 通过控制台创建或更新任务配置。
2. 系统自动把启用任务纳入健康检查与 Cron 执行范围。
3. 手动触发或 Vercel Cron 调用统一任务入口。
4. 执行器应用校验规则，并更新统计、日志、热力图和通知。

---

## 2. 基础配置 (Basic Configuration)

| 字段名                 | 键名                 | 格式              | 说明                                                                   |
| :--------------------- | :------------------- | :---------------- | :--------------------------------------------------------------------- |
| **Service ID**         | `service`            | String (唯一)     | 系统的唯一标识符（如 `glados`）。创建后不可修改，用于 API 路由定位。   |
| **Display Name**       | `name`               | String            | 在控制面板显示的名称。                                                 |
| **Category**           | `category`           | String            | 任务分类标签，用于视觉区分。                                           |
| **Notification Level** | `notification_level` | Enum              | 定义触发外部通知（如 Bark）的阈值 (`always`, `failure-only`, `none`)。 |
| **Description**        | `description`        | String (TextArea) | 任务的详细描述，解释其具体作用。                                       |
| **Task Type**          | `type`               | Enum              | 核心执行模式 (`http` 外部请求或 `supabase_internal` 内部维护)。        |

---

## 3. HTTP 设置 (HTTP Settings)

_注：仅在 `Task Type` 为 `http` 时生效。_

### 3.1 目标地址 (Target URLs)

- **键名**: `config.urls`
- **说明**: 每行一个 URL。系统将执行轮询逻辑，直到检测到首个成功响应。

### 3.2 请求方法 (Method)

- **键名**: `config.method`
- **可选值**: `GET`, `POST`, `PUT`。默认为 `POST`。

### 3.3 请求头 (Headers)

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

## 4. 校验规则 (Validation Rules)

校验规则直接决定热力图的统计口径与成功判定。

### 4.1 成功判定 (Success Rule)

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

### 4.2 操作符说明

- `path`: JSON 中的键路径（支持点操作符，如 `data.user_id`）。
- `operator`: 比较方法 (`eq` 等于, `neq` 不等于, `gt` 大于, `lt` 小于, `in` 包含于数组, `contains` 字符串包含)。
- `value`: 预期的目标值。

---

## 5. 最佳实践

1. **命名规范**: `Service ID` 建议使用小写字母、数字和连字符（如 `access-monitor`）。
2. **通知策略**: 对于高频自动任务，建议设置为 `failure-only` 以降低通知噪音。
3. **安全性**: 避免在 `Headers` 或 `Body` 中硬编码明文密钥。优先利用系统的动态环境注入逻辑。
