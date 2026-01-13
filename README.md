# Workflow Operations System

**v0.7.0**

这是一个用于防止云服务（Supabase, LeanCloud）因不活跃而被暂停的全栈自动化解决方案。它包含每日自动运行的定时任务，具备自动重试机制，以及一个现代化的手动控制台。

## 🚀 功能特性

- **Supabase & LeanCloud 自动保活**: 每日定时自动触发活跃信号。
- **GLaDOS 每日签到 (v0.5.0)**: 自动签到以保持网络访问权限。
- **服务开关控制 (v0.6.0)**: 通过 UI 开关控制每个服务的自动执行，手动触发不受影响。
- **智能化通知策略 (v0.4.5)**:
  - 支持 `always | failure-only | none` 三种通知级别。
  - 默认仅在执行失败或手动运行时通过 Bark 推送通知，彻底解决“通知疲劳”。
- **统一日志监控 (v0.4.5)**: 集成标准化的生产级 `logger` 工具，实时监控保活生命周期。
- **智能重试机制 (v0.3.0)**:
  - 指数退避重试（1s, 2s, 4s）
  - 自动识别配置错误（表不存在、环境变量缺失等）不重试
  - 网络错误自动重试。
- **实时健康监控**: 统一的健康检查 API，实时显示服务状态。
- **现代化控制台 (v0.7.0)**:
  - **背景持久化架构**: 创新性地将装饰性极光组件上移至 `RootLayout` 渲染。这不仅彻底消除了登录/注销及页面跳转时的视觉闪烁（Flicker）问题，还保持了 CSS 动画在物理上的不间断运行，提供极佳的沉浸式连续体验。
  - **交替入场动画 (Staggered)**: 利用 Framer Motion 的 `staggerChildren` 特性，使任务卡片以 100ms 的步进间隔逐一由下而上淡入，创造出有序且富有呼吸感的视觉节奏。
  - **Anthropic 极简美学**: 深度适配 Anthropic (Claude) 的 UI 调性。采用米纸色 (`#fdfcf8`) 为底色，极致简约的排版与淡雅的层叠色彩，打造专业、纯净且无干扰的运维工具。

## 🛠️ 部署指南

### 1. 获取环境变量

你需要准备以下环境变量：

- **Supabase 配置**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Bark 配置**: `BARK_DEVICE_KEY`
- **LeanCloud 配置**: `LEANCLOUD_APP_ID`, `LEANCLOUD_APP_KEY`, `LEANCLOUD_API_SERVER`, `LEANCLOUD_MASTER_KEY`
- **安全配置**: `CRON_SECRET`, `APP_KEY`

### 2. 创建 Supabase 表

在 Supabase Dashboard 执行以下 SQL：

```sql
CREATE TABLE IF NOT EXISTS keep_alive (
  service TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  manual_count INTEGER NOT NULL DEFAULT 0,
  auto_count INTEGER NOT NULL DEFAULT 0
);

-- 初始化服务记录（注意：如果已有旧数据，请先自行备份或清理）
INSERT INTO keep_alive (service, timestamp, manual_count, auto_count)
VALUES
  ('supabase', NOW(), 0, 0),
  ('glados', NOW(), 0, 0)
ON CONFLICT (service) DO NOTHING;

ALTER TABLE keep_alive ENABLE ROW LEVEL SECURITY;
```

### 3. 部署到 Vercel

1. Push 代码到 GitHub。
2. 在 Vercel 导入并配置环境变量。
3. 部署。

## 📂 项目结构

- `src/lib/services/`: 核心业务逻辑（类继承模式）。
- `src/lib/api-helper.ts`: 统一的 API 响应与鉴权处理。
- `src/lib/logger.ts`: 统一日志工具 (v0.4.5)。
- `src/app/api/`: 各项服务的 API 路由。
- `src/app/page.tsx`: 现代化控制台前端。
- `src/components/`: 可复用的 React 组件。
- `docs/`: 详细的 [开发文档](file:///home/chiperman/code/workflow/docs/DEVELOPMENT.md) 和 [API 文档](file:///home/chiperman/code/workflow/docs/API.md)。
- `vercel.json`: Cron 调度配置。

## 📦 版本历史

- **v0.7.0**: UI 重构，实现背景持久化与卡片交替入场动画。
- **v0.6.0**: 引入服务开关控制逻辑。
- **v0.4.5**: 架构重写，支持通知分级与统一日志。

## ❤️ 致谢

- **Vercel**: Serverless & Cron Job 支持。
- **Google Gemini**: 开发辅助。
- **GitHub**: 代码托管。
