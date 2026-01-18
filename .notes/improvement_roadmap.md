# 项目改进与维护路线图 (Project Roadmap)

本文档作为项目持续优化的单一真值来源。

> 📅 **最后更新**: 2026-01-18

---

## ✅ 已完成 (Completed)

以下改进项已经实施并合并到代码库中。

### 🏗️ 架构 (Architecture)
- **移除 LeanCloud 持久化依赖**
  - **状态**: ✅ 已完成
  - **说明**: 移除了 LeanCloud SDK，统一使用 Supabase 进行数据存储和保活。
- **服务名称常量化**
  - **状态**: ✅ 已完成
  - **说明**: 将 `'supabase'`, `'glados'` 等硬编码字符串替换为 `constants.ts` 中的常量。
- **数据库操作逻辑提取**
  - **状态**: ✅ 已完成
  - **说明**: 提取 `updateServiceStats` 到 `BaseService`，消除了 Glados 和 Supabase 服务中的重复数据库逻辑。

### 🎨 UI/UX体验
- **TaskCard 组件拆分**
  - **状态**: ✅ 已完成
  - **说明**: 将庞大的 `TaskCard.tsx` 拆分为 `Header`, `Stats`, `Message`, `Actions` 等子组件。
- **错误消息可关闭**
  - **状态**: ✅ 已完成
  - **说明**: 为 TaskCard 的错误提示添加了关闭按钮。

### ✨ 代码质量 (Code Quality)
- **统一时区处理**
  - **状态**: ✅ 已完成
  - **说明**: 统一了 `BaseService` 和 `heatmap-utils` 中的时区转换逻辑。
- **文档结构同步**
  - **状态**: ✅ 已完成
  - **说明**: 更新 `DEVELOPMENT.md` 以匹配实际目录结构。
- **静态资源优化**
  - **状态**: ✅ 已满足
  - **说明**: 项目已使用 `next/image` 组件，无原生 `<img>` 标签。存在 SVG 资源已优化。

### ⚡ 性能 (Performance)
- **Heatmap 计算缓存**
  - **状态**: ✅ 已完成
  - **说明**: 使用 `useMemo` 缓存热力图日期生成逻辑。
- **SWR 缓存优化**
  - **状态**: ✅ 已完成
  - **说明**: 将 Heatmap 迁移至 SWR，禁用自动刷新，启用缓存，并支持任务完成后自动刷新。

### 🛡️ 安全 (Security)
- **Cookie 安全属性**
  - **状态**: ✅ 已完成
  - **说明**: `sameSite` 策略升级为 `strict`。
- **统一鉴权层**
  - **状态**: ✅ 已完成
  - **说明**: 统一了 Middleware 和 API 的鉴权逻辑。
- **全局 API 鉴权**
  - **状态**: ✅ 已完成
  - **说明**: 所有 API 接口（包括热力图和健康检查）均已强制鉴权。

### 🔧 基础设施 & DX
- **测试覆盖率提升**
  - **状态**: ✅ 已完成
  - **说明**: 覆盖率提升至 ~69%，并添加了 API 路由单元测试。
- **Node.js 版本约束**
  - **状态**: ✅ 已完成
  - **说明**: 添加 `.nvmrc` (v22)。
- **Husky Hooks**
  - **状态**: ✅ 已完成
  - **说明**: 配置了 commit-msg hook。
- **版本与发布自动化**
  - **状态**: ✅ 已完成
  - **说明**: 引入 `standard-version`，实现了自动化版本升级、Changelog 生成和 Git Tag 管理。

---

## ⏳ 待处理 / 计划中 (Pending)

以下项目仍在计划中。

### 🔴 高优先级 (High Priority)

#### 🛡️ 端到端 (E2E) 测试
- **现状**: 仅有单元测试，缺乏对完整用户链路的验证。
- **建议**: 引入 **Playwright**，构建核心链路的 "安全网"。

#### 👁️ 加载骨架屏 (Skeleton Screens)
- **现状**: 页面加载时数据跳变。
- **建议**: 封装通用 `Skeleton` 组件，在 `isLoading` 期间展示占位符。

#### ✨ 类型强化 (Zod Integration)
- **现状**: `env.ts` 目前使用手写校验。
- **建议**: 引入 `zod` 进行运行时环境变量和 API 数据校验。

---

### 🟡 中优先级 (Medium Priority)

#### 🐳 容器化部署 (Dockerizing)
- **现状**: 强依赖 Vercel 环境。
- **建议**: 添加 `Dockerfile` 和 `docker-compose.yml`。

#### 🌓 暗色模式 (Dark Mode)
- **现状**: 仅有浅色主题。
- **建议**: 支持 `prefers-color-scheme: dark` 或手动切换。

---

### 🟢 低优先级 (Low Priority)

#### 🧹 错误处理标准化
- **状态**: 🟡 核心完成
- **说明**: 已定义 `Result<T>`。`BaseService` (`getStats`, `updateServiceStats`)、`auth` (`checkTriggerPermission`) 及相关消费者已迁移至新模式。API 响应格式暂保持兼容。

####  热力图移动端适配
- **现状**: 年份选择器在窄屏可能被遮挡。
- **建议**: 优化移动端布局。
