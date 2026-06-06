# Workflow Operations Center

Workflow Operations Center 是一个私有的任务维护控制台，用来集中配置、触发和观察周期性保活任务。当前项目基于 Next.js App Router 与 Supabase 构建，适合部署在 Vercel 上，由 Vercel Cron 定时调用统一任务入口。

它解决的核心问题很具体：把 Supabase、GLaDOS 或其他 HTTP 型维护任务放到同一个面板里管理，记录每次执行结果，并在需要时通过 Bark 推送通知。

## 当前能力

- 任务配置：通过控制台新增、编辑、启停和删除维护任务。
- 任务执行：支持手动触发单个任务，也支持 `/api/cron-all` 批量执行所有启用任务。
- 任务类型：支持通用 HTTP 任务与 Supabase 内部维护任务。
- 成功判定：支持状态码、JSON 路径、操作符和期望值组合校验。
- 执行记录：保存成功、失败、耗时、触发来源和响应摘要。
- 状态视图：提供任务卡片、系统健康状态和年度热力图。
- 通知策略：支持全局 Bark Key，也支持任务级通知配置。
- 访问控制：控制台使用 `APP_KEY` 登录，自动化入口使用 `CRON_SECRET` 鉴权。

## 技术栈

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4 / Framer Motion / SWR
- Supabase PostgreSQL
- Jest / React Testing Library / Playwright
- ESLint / Prettier / Commitlint / Husky

## 本地开发

### 环境要求

- Node.js 20 及以上，仓库内提供 `.nvmrc`
- npm
- Supabase 项目
- Supabase CLI，可通过 `npx supabase` 使用

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp env.example .env.local
```

至少需要填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_KEY=...
CRON_SECRET=...
```

可选变量：

```bash
BARK_DEVICE_KEY=...
LOG_LEVEL=info
```

注意：`SUPABASE_SERVICE_ROLE_KEY` 只应存在于服务端环境，不要暴露到浏览器或公开日志。

### 初始化数据库

项目使用 Supabase migration 管理表结构：

```bash
npx supabase db push
```

当前 migration 位于 `supabase/migrations/`，包含初始化表结构和任务密钥配置字段。

### 启动开发服务

```bash
npm run dev
```

打开 `http://localhost:3000`，使用 `.env.local` 中的 `APP_KEY` 登录控制台。

## 常用命令

| 命令                 | 用途                               |
| -------------------- | ---------------------------------- |
| `npm run dev`        | 启动本地开发服务                   |
| `npm run lint`       | 运行 ESLint                        |
| `npm run lint:check` | 以零 warning 标准检查 lint         |
| `npm run type-check` | 运行 TypeScript 类型检查           |
| `npm test`           | 运行 Jest 测试                     |
| `npm run test:e2e`   | 运行 Playwright E2E 测试           |
| `npm run build`      | 先 lint、类型检查，再构建生产包    |
| `npm run release`    | 使用 standard-version 生成版本变更 |

## 运行方式

### 控制台登录

控制台通过 `/login` 输入 `APP_KEY` 登录。登录成功后会写入 `workflow_session` Cookie，有效期 7 天。

### 手动触发任务

控制台内可以直接触发单个任务。后端实际调用：

```text
POST /api/tasks/[id]?trigger=manual
```

### 定时触发任务

Vercel Cron 当前配置在 `vercel.json`：

```json
{
  "crons": [
    {
      "path": "/api/cron-all",
      "schedule": "0 1 * * *"
    }
  ]
}
```

`/api/cron-all` 会加载所有启用任务并并行执行。请求需要带上：

```text
Authorization: Bearer <CRON_SECRET>
```

## 目录结构

```text
workflow/
├── docs/                  # API、配置、测试和发布说明
├── e2e/                   # Playwright 测试
├── src/
│   ├── app/               # Next.js 页面与 API Routes
│   ├── components/        # 页面组件与基础 UI
│   ├── config/            # 常量与 SWR 配置
│   ├── hooks/             # 前端数据 hooks
│   ├── lib/               # 鉴权、Supabase、日志、工具函数
│   ├── services/          # 任务执行与服务工厂
│   └── types/             # 共享类型
├── supabase/              # Supabase 配置与 migrations
├── env.example            # 环境变量示例
├── vercel.json            # Vercel Cron 配置
└── package.json           # 脚本与依赖
```

## 文档入口

- [开发指南](./docs/DEVELOPMENT.md)：架构、目录和新增协议说明。
- [任务配置](./docs/TASK_CONFIGURATION.md)：任务字段、HTTP 配置和成功规则。
- [API 文档](./docs/API.md)：核心接口、鉴权方式和响应格式。
- [测试指南](./docs/TESTING.md)：Jest、Playwright 和组件测试范围。
- [Git 工作流](./docs/GIT_WORKFLOW.md)：提交、分支和发布约定。
- [发布检查清单](./docs/RELEASE_SETUP_CHECKLIST.md)：上线前配置核对。

## 部署

推荐部署到 Vercel：

1. 关联代码仓库。
2. 在 Vercel Project Settings 中配置 `.env.local` 对应的环境变量。
3. 确认 Supabase migration 已推送到目标项目。
4. 检查 `vercel.json` 中的 Cron 时间是否符合预期。
5. 部署后访问控制台，创建或校验任务配置。
6. 手动触发一次任务，并确认执行记录、热力图和通知符合预期。

## 维护注意事项

- 新增任务类型前，优先确认现有 `DynamicService` 是否已经能覆盖。
- 涉及敏感值时，优先使用环境变量或 secret 字段，不要把密钥写入普通配置。
- 修改任务执行链路后，至少运行 `npm run type-check`、`npm test`，必要时补充 `npm run test:e2e`。
- 修改 Cron 行为时，同步更新 `vercel.json` 与本文档。
- 发布版本使用 `npm run release`，变更记录维护在 [CHANGELOG.md](./CHANGELOG.md)。
