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
│   │   │   ├── supabase-keep-alive/
│   │   │   └── leancloud-keep-alive/
│   │   ├── layout.tsx         # 根布局（包含 ErrorBoundary）
│   │   ├── page.tsx           # 主页面
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   ├── ErrorBoundary.tsx  # 错误边界
│   │   ├── TaskCard.tsx       # 任务卡片（已优化）
│   │   ├── RollingNumber.tsx  # 滚动数字动画
│   │   ├── SystemStatus.tsx   # 系统状态徽章
│   │   ├── CreateGuide.tsx    # 表创建引导
│   │   └── Footer.tsx         # 页脚
│   ├── lib/                   # 核心逻辑
│   │   ├── services/          # 服务层 (v0.4.0 引入)
│   │   │   ├── BaseService.ts # 服务基类
│   │   │   ├── SupabaseService.ts
│   │   │   └── LeanCloudService.ts
│   │   ├── api-helper.ts      # API 统一处理工具 (v0.4.0)
│   │   ├── utils.ts           # 工具函数（含重试逻辑）
│   │   ├── health-check.ts    # 健康检查核心逻辑
│   │   ├── supabase.ts        # Supabase 客户端初始化
│   │   ├── bark.ts            # Bark 通知推送
│   │   ├── env.ts             # 环境变量验证
│   │   └── __tests__/         # 单元测试 (Jest)
├── docs/                      # 文档
│   ├── DEVELOPMENT.md         # 开发文档（本文件）
│   └── API.md                 # API 文档
├── jest.config.js             # Jest 配置
├── next.config.ts             # Next.js 配置
├── tailwind.config.ts         # Tailwind CSS 配置
├── tsconfig.json              # TypeScript 配置
└── package.json               # 项目依赖
```

---

## 🏗️ 技术栈

### 核心框架

- **Next.js 16** - React 框架（App Router）
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
- **ESLint** - 代码检查

---

## 🚀 开发指南

### 环境设置

1. **克隆仓库**

   ```bash
   git clone <repository-url>
   cd workflow
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **配置环境变量**

   复制 `env.example` 到 `.env.local`：

   ```bash
   cp env.example .env.local
   ```

   填写必需的环境变量：

   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

   # LeanCloud
   LEANCLOUD_APP_ID=your_app_id
   LEANCLOUD_APP_KEY=your_app_key
   LEANCLOUD_SERVER_URL=your_server_url

   # Bark（可选）
   NEXT_PUBLIC_BARK_URL=your_bark_url
   ```

4. **启动开发服务器**

   ```bash
   npm run dev
   ```

   访问 http://localhost:3000

### 开发工作流

1. **创建新分支**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发和测试**

   ```bash
    # 运行开发服务器
    npm run dev

    # 运行 linter 检查
    npm run lint:check

    # 运行类型检查
    npm run type-check

    # 运行单元测试
    npm run test
   ```

3. **构建验证**

   ```bash
   npm run build
   npm run start
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

---

## 🔧 如何添加新服务 (v0.4.0 模式)

### 步骤 1：集成到服务层

在 `src/lib/services/` 创建新类并继承 `BaseService`：

```typescript
import { BaseService } from './BaseService';

export class YourService extends BaseService {
  constructor() {
    super('Your Service Name');
  }

  // 实现保活核心逻辑
  protected async executeKeepAlive(trigger: 'auto' | 'manual') {
    // 1. 实现业务逻辑
    // 2. 返回统计数据
    return { auto_count: 0, manual_count: 0 };
  }

  // 实现健康检查逻辑
  async checkHealth() {
    try {
      // 检查连接
      return {
        status: 'operational',
        stats: { auto_count: 0, manual_count: 0 },
      };
    } catch (e) {
      return { status: 'outage', stats: { auto_count: 0, manual_count: 0 } };
    }
  }
}
```

### 步骤 2：更新 API 路由

在 `src/app/api/your-service/route.ts` 中使用 `handleKeepAliveRequest`：

```typescript
import { handleKeepAliveRequest } from '@/lib/api-helper';
import { yourService } from '@/lib/services/YourService';

export async function GET(req: Request) {
  return handleKeepAliveRequest(req, yourService);
}

export async function POST(req: Request) {
  return handleKeepAliveRequest(req, yourService);
}
```

### 步骤 3：更新 UI 面板

在 `src/app/page.tsx` 中添加 `TaskCard`。得益于 `v0.4.1` 的统一响应格式，UI 集成变得非常简单。

```typescript
const [yourServiceHealth, setYourServiceHealth] = useState<ServiceHealth>({
  status: 'unknown',
  stats: { auto_count: 0, manual_count: 0 }
});

// 在 JSX 中添加
<TaskCard
  category="Your Category"
  title="Your Service"
  description="Description of your service"
  endpoint="/api/your-service-keep-alive"
  method="POST"
  serviceHealth={yourServiceHealth}
  onStatsUpdate={setYourServiceHealth}
/>
```

### 步骤 6：添加测试

在 `src/lib/__tests__/` 创建测试文件：

```typescript
import { checkYourServiceHealth } from '../health-check';

describe('checkYourServiceHealth', () => {
  it('should return operational status', async () => {
    const result = await checkYourServiceHealth();
    expect(result.status).toBe('operational');
  });
});
```

### 步骤 7：配置 Cron Job（可选）

在 `vercel.json` 添加：

```json
{
  "crons": [
    {
      "path": "/api/your-service-keep-alive?trigger=auto",
      "schedule": "0 8 * * *"
    }
  ]
}
```

---

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 编写测试

测试文件位于 `src/lib/__tests__/`，使用 Jest 和 React Testing Library。

**示例测试**：

```typescript
import { withRetry } from '../utils';

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

---

## 📝 代码规范

### TypeScript

- 使用严格模式
- 为所有函数添加类型注解
- 避免使用 `any`（除非必要）
- 使用接口定义复杂类型

### React

- 使用函数组件和 Hooks
- 使用 `React.memo` 优化性能
- 使用 `useCallback` 和 `useMemo` 优化计算
- 组件文件使用 PascalCase 命名

### 样式

- 使用 Tailwind CSS 类名
- 避免内联样式
- 保持设计一致性（米色背景、衬线字体）

### 命名约定

- 文件名：kebab-case（`health-check.ts`）
- 组件：PascalCase（`TaskCard.tsx`）
- 函数：camelCase（`checkHealth`）
- 常量：UPPER_SNAKE_CASE（`MAX_RETRIES`）

---

## 🔍 调试技巧

### 查看日志

开发环境会在控制台输出详细日志：

```typescript
console.log('Health Data:', healthData);
console.error('Failed to fetch:', error);
```

### 使用 React DevTools

安装 React DevTools 浏览器扩展，查看组件状态和性能。

### 测试 API 端点

```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 测试手动触发 (POST 自动识别为 manual)
curl -X POST http://localhost:3000/api/supabase-keep-alive -H "X-App-Key: your_key"
```

---

## 🚀 部署

### Vercel 部署

1.  连接 GitHub 仓库到 Vercel
2.  配置环境变量
3.  自动部署（推送到 main 分支）

### 环境变量配置

在 Vercel 项目设置中添加所有必需的环境变量。

---

## 📚 参考资源

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Supabase 文档](https://supabase.com/docs)
- [SWR 文档](https://swr.vercel.app)
- [Jest 文档](https://jestjs.io)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

## 🤝 贡献指南

1.  Fork 项目
2.  创建特性分支
3.  提交更改
4.  推送到分支
5.  创建 Pull Request

---

**最后更新**: 2026-01-02 (v0.4.1)

```

```
