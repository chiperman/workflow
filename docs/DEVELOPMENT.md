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
│   │   │   ├── health/        # 健康检查 API
│   │   │   ├── cron-all/      # 统一 Cron 入口
│   │   │   ├── service-config/ # 服务配置 API (v0.6.0)
│   │   │   ├── supabase-keep-alive/
│   │   │   ├── leancloud-keep-alive/
│   │   │   └── glados-checkin/
│   │   ├── favicon.ico
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 主页面
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   ├── ErrorBoundary.tsx  # 错误边界
│   │   ├── ErrorTest.tsx      # 错误测试组件
│   │   ├── TaskCard.tsx       # 任务卡片
│   │   ├── CreateGuide.tsx    # 表创建引导
│   │   ├── RollingNumber.tsx  # 数字滚动动画
│   │   ├── SystemStatus.tsx   # 系统状态显示
│   │   └── Footer.tsx         # 页脚
│   ├── config/                # 配置文件
│   │   └── constants.ts       # 全局常量
│   ├── lib/                   # 核心逻辑
│   │   ├── services/          # 服务层
│   │   │   ├── BaseService.ts # 服务基类
│   │   │   ├── SupabaseService.ts
│   │   │   ├── LeanCloudService.ts
│   │   │   └── GladosService.ts # GLaDOS 服务 (v0.5.0)
│   │   ├── api-helper.ts      # API 统一处理工具
│   │   ├── logger.ts          # 统一日志工具 (v0.4.5)
│   │   ├── utils.ts           # 工具函数
│   │   ├── health-check.ts    # 健康检查逻辑
│   │   ├── supabase.ts        # Supabase 客户端
│   │   ├── bark.ts            # Bark 通知推送
│   │   ├── env.ts             # 环境变量验证
│   │   └── __tests__/         # 单元测试
│   │       ├── setup.ts
│   │       ├── health-check.test.ts
│   │       ├── services.test.ts
│   │       └── utils.test.ts
│   └── types/                 # 类型定义
│       └── index.ts
├── docs/                      # 文档
│   ├── DEVELOPMENT.md         # 开发文档
│   ├── API.md                 # API 文档
│   ├── TESTING.md             # 测试文档
│   └── glados-setup.sql       # 数据库初始化脚本
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

**最后更新**: 2026-01-05 (v0.6.0)
