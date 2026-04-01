# Workflow Operations Center

一套基于 Next.js 16 的轻量级全栈自动化保活解决方案。旨在通过统一的控制面板管理、监控并自动执行各类保活协议（如 Supabase, GLaDOS 等），彻底解决因不活跃导致的服务停用问题。

---

## 🚀 快速入门 (Quick Start)

### 1. 准备工作 (Prerequisites)

- **Supabase**: 创建一个免费项目。
- **Node.js**: 建议版本 `v20.x` 或以上。

### 2. 克隆与安装 (Installation)

```bash
git clone https://github.com/your-username/workflow.git
cd workflow
npm install
```

### 3. 配置环境变量 (Configuration)

复制示例环境文件并填写您的密钥：

```bash
cp env.example .env.local
```

> ⚠️ **注意**: 必须填写 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`。

登录 [Supabase Dashboard](https://supabase.com/dashboard)，进入 SQL Editor，执行以下文件中的完整初始化脚本：
👉 [**supabase/setup.sql**](./supabase/setup.sql) (包含 4 表分离架构与 RLS 强化策略)

### 5. 启动开发服务器 (Run)

```bash
npm run dev
```

访问 `http://localhost:3000` 即可看到控制面板。

---

## ⚙️ 配置说明 (Configuration)

### 1. 环境变量 (.env)

| 变量名                      | 说明                             | 示例                      |
| :-------------------------- | :------------------------------- | :------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`  | Supabase 项目 API 地址           | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 (不可泄露) | `ey...`                   |
| `APP_KEY`                   | 访问控制面板的专用密钥           | `my-secret-key`           |
| `CRON_SECRET`               | Vercel Cron 任务鉴权密钥         | `cron-secret-123`         |
| `GLADOS_COOKIE`             | GLaDOS 自动签到所需的 Cookie     | `koa:sess=...`            |
| `BARK_DEVICE_KEY`           | Bark iOS 推送设备密钥            | `abc123def456`            |
| `LOG_LEVEL`                 | 日志级别 (debug/info/warn/error) | `info`                    |

### 2. 任务配置项 (Task Settings)

通过 UI 编辑任务时，可配置以下核心参数：

- **Service ID**: 任务唯一标识符，用于 API 定位。
- **Task Type**:
  - `http`: 外部接口保活 (支持多 URL 冗余、自定义 Method/Headers/Body)。
  - `supabase_internal`: 数据库内部保活逻辑。
- **Notification Level**:
  - `always`: 每次执行均推送通知。
  - `failure-only`: 仅在执行失败时推送。
  - `none`: 不推送通知。
- **Success Rules**: 基于 JSON 路径、操作符（eq, neq, gt, lt, in, contains）及期望值灵活定义执行成功标准。

### 3. 在线配置 (Online Configuration)

本系统支持**零代码、免重启**的动态配置：

- **即时生效**: 通过控制面板底部的 `+ Add Task` 或任务卡片上的 `Edit` 按钮即可进入配置界面。所有更改直接保存至 Supabase 数据库，后端 Cron 任务及前端展示将立即同步更新。
- **安全隔离**: 敏感配置项（如 API Keys）建议在 UI 中使用环境变量占位符，避免在数据库中直接明文存储。
- **配置导出**: 如果需要备份或迁移，可直接在 Supabase Dashboard 导出 `service_config` 表的数据。

---

## 🎨 核心功能

- **可视化热力图**: GitHub 风格的签到统计，任务状态一目了然。
- **动态任务系统**: 无需修改代码，通过 UI 直接添加、编辑或删除保活任务。
- **智能化通知策略**: 支持按需触发 Bark 推送，告警精确，拒绝骚扰。
- **增强型日志系统**: 记录每次执行的详细消息、状态和耗时，并支持在验证失败时记录响应片段。
- **安全保障**: 全接口鉴权保护，支持独立 APP Key 访问控制。
- **Anthropic 极简设计**: 沉浸式、极轻量且专注的运维视觉体验。

---

## 📚 详细文档 (Documentation)

为保持简洁，更多细节已迁移至专门的文档：

- 🛠️ [**开发指南**](./docs/DEVELOPMENT.md) - 架构说明、目录结构、如何添加新服务。
- ⚙️ [**配置手册**](./docs/TASK_CONFIGURATION.md) - 深入了解任务 ID、HTTP 配置及校验规则。
- 📋 [**API 参考**](./docs/API.md) - 核心端点定义、鉴权模式及变更日志。
- 🧪 [**测试说明**](./docs/TESTING.md) - 单元测试与 UI 组件验证指南。

---

## 🛠️ 技术栈

- **Frontend**: Next.js 16 (App Router), React 19, Framer Motion, Tailwind CSS 4.
- **Backend**: Next.js API Routes, Supabase (PostgreSQL).
- **Tooling**: Jest, SWR, ESLint, Commitlint.

---

## 📦 部署 (Deployment)

推荐部署至 **Vercel**：

1. 关联 GitHub 仓库。
2. 在 Vercel Settings 中配置环境变量。
3. 检查 `vercel.json` 中的 Cron 调度是否符合您的时区需求。

---

**最后更新**: 2026-04-01 (架构版本 2.0.0)
