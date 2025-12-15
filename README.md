# Supabase Keep-Alive System

这是一个用于防止 Supabase 免费项目因不活跃而被暂停的全栈解决方案。它包含一个每日自动运行的定时任务，以及一个可以手动触发的前端界面。

## 🚀 功能特性

- **自动保活**: 每日 08:00 UTC 自动连接 Supabase 数据库。
- **手动触发**: 提供网页界面，可随时手动执行保活任务。
- **通知推送**: 任务执行结果（成功/失败）通过 Bark 推送到你的设备。

## 🛠️ 部署指南

### 1. 获取环境变量

你需要准备以下环境变量：

- **Supabase 配置**:
  - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase 项目 URL (Settings -> API)。
  - `SUPABASE_SERVICE_ROLE_KEY`: 你的 Supabase Service Role Key (Settings -> API -> service_role secret)。**注意：不要使用 Anon Key，Service Role Key 权限更高，确保能执行查询。**

- **Bark 配置**:
  - `BARK_DEVICE_KEY`: 你的 Bark App 中的 Key (例如 URL `https://api.day.app/YOUR_KEY/...` 中的 `YOUR_KEY`)。

- **Cron 安全 (可选)**:
  - `CRON_SECRET`: 如果你在 Vercel 项目设置中配置了 Cron Protection，Vercel 会自动生成此变量。如果未配置，代码中默认不强制检查，但建议配置以防止恶意调用。

### 2. 部署到 Vercel

1.  将本项目代码推送到 GitHub。
2.  在 Vercel 中导入项目。
3.  在 **Settings -> Environment Variables** 中添加上述变量。
4.  部署项目。

### 3. 验证 Cron Job

部署完成后，Vercel 会自动识别 `vercel.json` 中的 Cron Job 配置。
你可以在 Vercel 项目控制台的 **Settings -> Cron Jobs** 中查看定时任务状态。

## 📂 项目结构

- `src/app/api/keep-alive/route.ts`: 定时任务 API 端点。
- `src/app/api/manual-trigger/route.ts`: 手动触发 API 端点。
- `src/lib/keep-alive.ts`: 核心保活逻辑。
- `src/lib/bark.ts`: Bark 通知工具函数。
- `src/app/page.tsx`: 前端控制台页面。
- `vercel.json`: Cron Job 调度配置。

## 🧪 本地测试

1.  配置环境变量：
    复制 `env.example` 文件为 `.env.local`，并填入你的真实 Key。
    ```bash
    cp env.example .env.local
    ```
    文件内容示例：
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_url
    SUPABASE_SERVICE_ROLE_KEY=your_key
    BARK_DEVICE_KEY=your_key
    ```
2.  运行开发服务器：
    ```bash
    npm run dev
    ```
3.  访问 `http://localhost:3000` 并点击 "Run Now" 按钮。
