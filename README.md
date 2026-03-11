# Workflow Operations Center (v0.8.10)

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

### 4. 初始化数据库 (Database Setup)

登录 [Supabase Dashboard](https://supabase.com/dashboard)，进入 SQL Editor，执行以下文件中的完整脚本：
👉 [**docs/database-setup.sql**](./docs/database-setup.sql)

### 5. 启动开发服务器 (Run)

```bash
npm run dev
```

访问 `http://localhost:3000` 即可看到控制面板。

---

## 🎨 核心功能

- **可视化热力图**: GitHub 风格的签到统计，任务状态一目了然。
- **动态任务系统**: 无需修改代码，通过 UI 直接添加、编辑或删除保活任务。
- **智能化通知策略**: 支持按需触发 Bark 推送，告警精确，拒绝骚扰。
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

**最后更新**: 2026-03-12 (Tuesday)
