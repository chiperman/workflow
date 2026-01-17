# 开发文档

本文档说明项目架构、开发指南和如何添加新服务。

---

## 📁 项目架构

### 目录结构

```
workflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证 API (v0.8.1)
│   │   │   ├── health/        # 健康检查 API
│   │   │   ├── cron-all/      # 统一 Cron 入口
│   │   │   ├── service-config/ # 服务配置 API (v0.6.0)
│   │   │   ├── stats/         # 统计 API (v0.8.0)
│   │   │   │   └── heatmap/   # 热力图数据聚合
│   │   │   ├── supabase-keep-alive/
│   │   │   ├── leancloud-keep-alive/
│   │   │   ├── glados-checkin/
│   │   │   └── tasks/         # 任务管理 API (v0.8.3)
│   │   ├── favicon.ico
│   │   ├── layout.tsx         # 根布局
│   │   ├── login/             # 登录页面 (v0.8.1)
│   │   ├── page.tsx           # 主页面
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   ├── ConfirmDialog.tsx  # 确认对话框
│   │   ├── CreateGuide.tsx    # 表创建引导
│   │   ├── ErrorBoundary.tsx  # 错误边界
│   │   ├── ErrorTest.tsx      # 错误测试组件
│   │   ├── Footer.tsx         # 页脚
│   │   ├── Heatmap.tsx        # 签到热力图 (v0.8.0)
│   │   ├── PageBackground.tsx # 全局背景组件 (v0.7.0)
│   │   ├── RollingNumber.tsx  # 数字滚动动画
│   │   ├── SystemStatus.tsx   # 系统状态显示
│   │   ├── TaskCard.tsx       # 任务卡片
│   │   └── __tests__/         # 组件测试 (v0.8.2)
│   │       ├── TaskCard.test.tsx
│   │       └── Heatmap.test.tsx
│   ├── config/                # 配置文件
│   │   └── constants.ts       # 全局常量
│   ├── lib/                   # 核心逻辑
│   │   ├── services/          # 服务层
│   │   │   ├── BaseService.ts # 服务基类
│   │   │   ├── SupabaseService.ts
│   │   │   ├── LeanCloudService.ts
│   │   │   └── GladosService.ts # GLaDOS 服务 (v0.5.0)
│   │   ├── api-helper.ts      # API 统一处理工具
│   │   ├── heatmap-calendar.ts # 日历计算纯函数 (v0.8.2)
│   │   ├── heatmap-utils.ts   # 热力图聚合逻辑 (v0.8.0)
│   │   ├── logger.ts          # 统一日志工具 (v0.4.5)
│   │   ├── utils.ts           # 工具函数
│   │   ├── health-check.ts    # 健康检查逻辑
│   │   ├── supabase.ts        # Supabase 客户端
│   │   ├── bark.ts            # Bark 通知推送
│   │   ├── env.ts             # 环境变量验证
│   │   └── __tests__/         # 单元测试
│   │       ├── setup.ts
│   │       ├── health-check.test.ts
│   │       ├── heatmap-utils.test.ts
│   │       ├── heatmap-calendar.test.ts # (v0.8.2)
│   │       ├── services.test.ts
│   │       └── utils.test.ts
│   └── types/                 # 类型定义
│       └── index.ts
├── docs/                      # 文档
│   ├── API.md                 # API 文档
│   ├── DEVELOPMENT.md         # 开发文档
│   ├── TESTING.md             # 测试文档
│   └── database-setup.sql     # 数据库初始化脚本
├── public/                    # 静态资源
│   ├── file.svg
│   ├── claude-color.svg
│   ├── next.svg
│   ├── globe.svg
│   ├── gemini-color.svg
│   ├── github.svg
│   ├── window.svg
│   └── vercel.svg
├── .env.local                 # 环境变量 (Git 忽略)
├── .nvmrc                     # Node.js 版本约束
├── commitlint.config.js       # Commitlint 配置
├── eslint.config.mjs          # ESLint 配置
├── jest.config.js             # Jest 配置
├── next.config.ts             # Next.js 配置
├── package.json               # 项目依赖
├── postcss.config.mjs         # PostCSS 配置
├── tailwind.config.ts         # Tailwind CSS 配置
├── tsconfig.json              # TypeScript 配置
├── vercel.json                # Vercel Cron 配置
├── instrumentation.ts         # Next.js Instrumentation
└── next-env.d.ts              # Next.js 类型定义
```

---

## 🏗️ 技术栈

### 核心框架

- **Next.js 16** - React 框架 (App Router)
- **React 19** - UI 库
- **TypeScript 5** - 类型安全

### 数据库和后端

- **Supabase** - PostgreSQL 数据库
- **LeanCloud** - 国际版数据存储

### UI 和样式

- **Tailwind CSS 4** - 样式框架
- **Lucide React** - 图标库

### 开发工具

- **Jest** - 测试框架
- **React Testing Library** - 组件测试
- **SWR** - 数据获取和缓存
- **ESLint** - 代码检查 (Flat Config)
- **Commitlint** - 规范化提交

---

## 🎨 UI 与视觉开发规范 (v0.7.0)

### 背景持久化原则

为了保证全站视觉的极致流畅，项目采用了 **Persistent Background Layer** 模式。所有全局装饰性元素（如极光动画）必须放置在 `src/app/layout.tsx` 及其子组件 `PageBackground` 中。这确保了在 Next.js APP Router 切换页面时，动画状态不会因为组件销毁而重置，从而避免闪烁。

### 动效排版指南

项目统一使用 `framer-motion`。列表类组件推荐使用 Staggered 模式：

- **父容器**: 负责调度。设置 `staggerChildren` 控制子项入场节奏。
- **子元素**: 负责执行。建议统一使用 `y: 15` 的位移偏移配合 `opacity` 实现呼吸感淡入。

---

## 🚀 开发指南

### 环境设置

1. **克隆仓库并安装依赖**

   ```bash
   npm install
   ```

2. **配置环境变量**
   复制 `env.example` 到 `.env.local` 并填写相关 Key。

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

---

## 🔧 如何添加新服务 (v0.4.5 模式)

### 步骤 1：集成到服务层

在 `src/lib/services/` 创建新类并继承 `BaseService`：

```typescript
import { BaseService } from './BaseService';
import { logger } from '@/lib/logger';

export class YourService extends BaseService {
  constructor() {
    super('Your Service Name');
    this.notificationLevel = 'failure-only';
  }

  protected async executeKeepAlive(trigger: 'auto' | 'manual') {
    try {
      // 实现业务逻辑...
      return {
        success: true,
        message: 'Success',
        data: { auto_count: 0, manual_count: 0 },
      };
    } catch (error) {
      logger.error('[YourService] failed:', error);
      throw error;
    }
  }

  async getStats() {
    // 返回 ServiceStats 格式数据以供 /api/health 调用
  }
}
```

### 步骤 2：数据库适配

确保你的服务在 `keep_alive` 表中有对应的记录。注意 v0.5.0 后主键为 `service` (TEXT 类型)。

```sql
INSERT INTO keep_alive (service) VALUES ('your-service-name') ON CONFLICT DO NOTHING;
```

---

**最后更新**: 2026-01-17 (v0.8.3)
