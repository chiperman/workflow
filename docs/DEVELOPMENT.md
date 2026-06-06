# 开发指南

本文档涵盖项目架构、开发流以及如何添加新服务协议。

---

## 📁 项目架构

### 目录结构

```text
workflow/
├── src/
│   ├── app/                    # Next.js App Router (Tailwind v4)
│   │   ├── api/               # 统一 API 处理函数
│   │   ├── globals.css        # "Warm Paper" 设计系统
│   │   └── page.tsx           # 主面板
│   ├── components/            # React 组件
│   │   ├── task-card/         # 任务卡片视图
│   │   ├── task-config-modal/ # 任务配置弹窗
│   │   ├── heatmap/           # 签到热力图
│   │   └── ui/                # 基础 UI 组件 (Button, Switch 等)
│   ├── services/              # 核心业务逻辑
│   │   ├── BaseService.ts     # 协议基类
│   │   ├── DynamicService.ts  # 通用 HTTP 协议
│   │   ├── ServiceExecutor.ts # 执行、日志和通知编排
│   │   └── ServiceFactory.ts  # 服务编排工厂
│   ├── hooks/                 # 业务逻辑 Hooks (`useTasks`)
│   ├── lib/                   # 通用工具 & 客户端
│   └── types/                 # 类型定义
└── supabase/                  # 数据库脚本
```

---

## 🏗️ 技术栈

- **核心框架**: Next.js (App Router)
- **UI/动画**: Tailwind CSS, Framer Motion, Radix UI
- **数据库**: Supabase (PostgreSQL)
- **数据获取**: SWR
- **测试**: Jest, React Testing Library

---

## 🎨 设计与 UI 规范

### "Warm Paper" 美学

项目遵循简约的“温润纸张”风格。

- **背景**: 柔和米色 (`#fdfcf8`)
- **排版**: 标题使用衬线体 (Serif)，正文使用无衬线体 (Sans-serif)
- **色彩**: 碳黑字体 (`#191919`)，静谧灰 (`#888888`)，以及适量的暖橙转场 (`#d97757`)
- **动效**: 使用 `framer-motion` 实现基于 Y 轴偏移和透明度的呼吸感入场。

---

## 🔧 添加新协议

所有维护协议均为数据驱动，由 `DynamicService` 统一支持。

### 第一步：可视化配置

通过仪表盘顶部的 **"New Maintenance Protocol"** 弹窗添加：

- **Service ID**: 唯一的字母数字键。
- **Type**: `http` (外部请求) 或 `supabase_internal` (内部维护)。
- **校验**: 定义基于状态码或 JSON 路径的成功判定规则。

### 第二步：数据库持久化

通过 UI 保存后，配置会自动存储于 `service_configs` 表中；执行结果会写入 `service_stats` 与 `keep_alive_logs`。表结构以 `supabase/migrations/` 为准。

---

## 🚀 快速开始

1. **安装依赖**: `npm install`
2. **配置环境**: 复制 `env.example` 为 `.env.local`。
3. **启动开发**: `npm run dev`
