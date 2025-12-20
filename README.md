# Workflow Operations System

**v0.2.0**

这是一个用于防止云服务（Supabase, LeanCloud）因不活跃而被暂停的全栈自动化解决方案。它包含每日自动运行的定时任务，具备自动重试机制，以及一个现代化的手动控制台。

## 🚀 功能特性

- **Supabase 自动保活**: 每日 08:00 UTC 自动连接 Supabase 数据库。
- **LeanCloud 自动保活**: 每日 09:00 UTC 自动对 LeanCloud `keep_alive` 表进行 "查-删-增" 操作以保持活跃。
- **高可靠性 (New)**: API 端点集成自动重试机制。如果任务失败，系统将自动重试 3 次（每次间隔 1 秒），显著提高 Cron Job 的成功率。
- **现代化控制台 (v0.2.0)**: 全新的极简主义 UI（参考 Anthropic 风格），提供清晰的系统状态概览和手动触发功能。
- **通知推送**: 任务执行结果（成功/失败）通过 Bark 实时推送到你的设备。

## 🛠️ 部署指南

### 1. 获取环境变量

你需要准备以下环境变量：

- **Supabase 配置**:
  - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase 项目 URL。
  - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (用于后端高权限操作)。

- **Bark 配置**:
  - `BARK_DEVICE_KEY`: 你的 Bark App 推送 Key。

- **LeanCloud 配置**:
  - `LEANCLOUD_APP_ID`: App ID。
  - `LEANCLOUD_APP_KEY`: App Key。
  - `LEANCLOUD_API_SERVER`: REST API Server URL。
  - `LEANCLOUD_MASTER_KEY`: Master Key (可选，但在 API 路由中建议配置以确保权限)。

- **Cron 安全**:
  - `CRON_SECRET`: Vercel Cron Protection 密钥（可选，推荐）。

### 2. 创建 Supabase 表

在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL：

```sql
-- Create keep_alive table
CREATE TABLE IF NOT EXISTS keep_alive (
  id INTEGER PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  manual_count INTEGER NOT NULL DEFAULT 0,
  auto_count INTEGER NOT NULL DEFAULT 0
);

-- Insert initial record
INSERT INTO keep_alive (id, timestamp, manual_count, auto_count)
VALUES (1, NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (without creating policies)
-- Service role automatically bypasses RLS
-- Anon key and regular users cannot access this table
ALTER TABLE keep_alive ENABLE ROW LEVEL SECURITY;
```

> **安全说明**: 此配置启用了 RLS 但不创建任何策略，确保只有使用 Service Role Key 的后端可以访问此表，即使 Anon Key 泄露也无法访问数据。

### 3. 部署到 Vercel

1.  Push 代码到 GitHub。
2.  在 Vercel 导入项目。
3.  配置上述环境变量。
4.  部署。

### 4. 验证 Cron Job

部署后，在 Vercel 控制台的 **Settings -> Cron Jobs** 中查看定时任务。

## 📂 项目结构

- `src/app/api/keep-alive/route.ts`: Supabase 保活 API（含重试逻辑）。
- `src/app/api/leancloud-keep-alive/route.ts`: LeanCloud 保活 API（含重试逻辑）。
- `src/app/page.tsx`: 现代化控制台前端。
- `src/lib/bark.ts`: Bark 通知工具。
- `vercel.json`: Cron 调度配置。

## 📦 版本历史

- **v0.2.0**: UI 重构（Anthropic 风格），增加 API 自动重试机制。
- **v0.1.0**: 初始版本，包含基础 Cron 功能。

## 🧪 本地测试

```bash
cp env.example .env.local
# 填入 keys
npm run dev
```
访问 `http://localhost:3000` 即可使用。

## ❤️ 致谢

本项目由以下服务强力驱动：

- **Vercel**: 提供卓越的 Serverless 部署与 Cron Job 支持。
- **Google Gemini**: 提供智能代码辅助与开发建议。
- **GitHub**: 提供代码托管与开源协作平台。
