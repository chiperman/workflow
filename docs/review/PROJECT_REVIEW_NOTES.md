# 项目审查笔记

创建日期：2026-07-07

审查范围：项目结构、代码简洁性、工程质量、UI 和用户体验。

## 审查结论

当前项目整体质量稳定，Next.js App Router、Supabase、SWR、组件测试和服务执行层已经形成了清楚的主线。主要风险不在基础代码是否能跑，而在三个地方：公开接口暴露范围偏大，任务配置表单承担了过多职责，移动端管理体验还没有按高频运维工具的标准打磨。

综合评分：7.2 / 10。

| 维度     | 评分 | 说明                                                             |
| -------- | ---: | ---------------------------------------------------------------- |
| 架构     |  7.5 | 模块边界基本清楚，但健康接口和任务配置表单的职责边界偏散。       |
| 代码质量 |  7.0 | 类型、lint、测试都稳定，少数大组件和隐式降级逻辑会增加维护成本。 |
| 工程质量 |  7.0 | 质量门完整，当前测试范围以 Jest 和组件测试为准。                 |
| UI / UX  |  7.0 | 视觉方向明确，桌面端可用，移动端配置弹窗和状态优先级需要优化。   |

## 优先级清单

### P0：收紧公开接口和自动任务入口

1. `/api/health` 未登录时返回了过多内部信息。
   - 位置：`src/config/constants.ts:48`、`src/app/api/health/route.ts:11`
   - 影响：公开访问可以看到服务名、分类、统计、远程 Supabase URL 和部分配置结构。
   - 建议：未登录只返回粗粒度状态，比如 `Operational`、`Degraded`。详细服务数据要求 session、`APP_KEY` 或更明确的只读管理权限。

2. `CRON_SECRET` 缺失时，`/api/cron-all` 会跳过校验。
   - 位置：`src/app/api/cron-all/route.ts:15`、`src/lib/env.ts:65`
   - 影响：生产环境如果漏配 `CRON_SECRET`，自动任务入口会失去保护。
   - 建议：服务端强制要求 `CRON_SECRET`。缺失时启动失败，或者接口固定返回 500，不能进入执行路径。

3. `APP_KEY` 缺失或加密失败时，secret 保护状态不够确定。
   - 位置：`src/lib/env.ts:66`、`src/lib/crypto.ts:52`
   - 影响：`encrypt` 失败后返回原文，会让敏感配置是否加密变成运行时偶然结果。
   - 建议：`APP_KEY` 对服务端强制必填。保存 secret 时加密失败应阻止写入，并向 UI 返回明确错误。

### P1：降低配置表单复杂度

`TaskConfigModal` 当前约 833 行，集中处理表单状态、HTTP 配置、Supabase 配置、JSON 字符串编辑、密钥显隐、测试探测和保存请求。

- 位置：`src/components/task-config-modal/TaskConfigModal.tsx`
- 影响：后续新增字段或修复移动端问题时，很容易牵动整块表单。
- 建议拆分：
  - `useTaskConfigForm`：管理 `config`、`headersStr`、`rulesStr`、校验状态和保存逻辑。
  - `BasicSection`：服务 ID、展示名、分类、通知配置。
  - `HttpSection`：URL、Method、Cookie、Headers、消息模板。
  - `SupabaseSection`：远程 Supabase URL、Service Role Key、表名、探测表。
  - `RulesSection`：智能检测、JSON 规则、测试探测按钮。

移动端建议改成单列布局。当前 `grid-cols-2` 和嵌套两列会把 Notification Level、Bark Key、Method、Cookie 等字段压得过窄。

### P1：补齐弹窗无障碍基础

`ConfirmDialog` 已经有 `role="dialog"`、`aria-modal`、标题关联、portal 和键盘关闭处理，但 `TaskConfigModal` 没有复用这些能力。

- 位置：`src/components/ConfirmDialog.tsx`、`src/components/task-config-modal/TaskConfigModal.tsx`
- 建议：抽出一个通用 `DialogShell`，统一处理：
  - `role="dialog"`
  - `aria-modal="true"`
  - 标题 ID 关联
  - Escape 关闭
  - 初始焦点和返回焦点
  - body 滚动锁定

### P1：任务执行默认值需要更谨慎

`ServiceExecutor.isEnabled` 读取服务开关失败时默认返回 `true`。

- 位置：`src/services/ServiceExecutor.ts:22`
- 影响：数据库短暂异常时，原本被禁用的任务可能被执行。
- 建议：区分“配置记录不存在”和“查询失败”。查询失败时更适合 fail closed，或者只允许手动触发继续。

### P2：首页信息层级更偏展示，不够像运维工作台

首页现在从标题直接进入大热力图，然后才是任务卡片。对私有运维控制台来说，用户打开页面最想确认的是今天是否正常、哪些服务失败、是否需要操作。

- 位置：`src/app/page.tsx:339`
- 建议：在热力图前增加一行紧凑状态摘要：
  - 总任务数
  - 今日成功 / 失败
  - 最近失败服务
  - 下一次 cron 时间或最近自动执行时间

热力图保留，但它更适合做趋势视图，不应该抢走第一屏的状态判断权重。

### P2：滚动数字对辅助技术会重复读值

`RollingNumber` 同时渲染旧值和新值，浏览器可访问文本会出现 `AUTO 164 164` 这样的重复内容。

- 位置：`src/components/RollingNumber.tsx:31`
- 建议：外层提供 `aria-label={String(value)}`，内部动画层加 `aria-hidden="true"`。

### P2：远程装饰资源不可靠

页面背景使用了 `https://grainy-gradients.vercel.app/noise.svg`，本地浏览器检查时该资源返回 404。

- 位置：`src/components/PageBackground.tsx:35`
- 影响：控制台出现资源错误，页面视觉依赖无版本约束的外部资源。
- 建议：删除该噪点层，或把资源放入 `public/` 后本地引用。

### P2：Framer Motion API 有弃用警告

本地浏览器 console 提示 `motion()` 已弃用，当前首页和登录页通过 `motion(Button)` 创建 `MotionButton`。

- 位置：`src/app/page.tsx:20`、`src/app/login/page.tsx:10`
- 建议：按 Framer Motion 当前推荐方式改为 `motion.create(Button)`，避免后续升级时集中处理。

## 建议执行顺序

1. 先处理 P0 安全边界：`/api/health` 分级返回，`CRON_SECRET` 和 `APP_KEY` 强制校验，secret 加密失败阻止保存。
2. 再拆 `TaskConfigModal`，先抽 hook 和 section，不做视觉大改。
3. 然后修移动端配置弹窗，统一单列布局并复用 `DialogShell`。
4. 最后做 UI 层级优化，把首页第一屏调整为“状态摘要 + 趋势 + 任务操作”。

## 已验证命令

审查过程中跑过以下命令，结果都通过：

```bash
git status --short --branch -uall
python3 /Users/XiaoX/.codex/plugins/cache/waza/waza/3.31.1/skills/check/scripts/audit_signals.py --root /Users/XiaoX/Developer/Personal/workflow
npm run type-check
npm run lint:check
npm test -- --runInBand
npm run build
```

补充观察：

- Jest 测试共 12 个 test suite，97 个测试通过。
- `npm run build` 通过。
- 测试和构建都会提示 `baseline-browser-mapping` 数据超过两个月未更新。
- Jest 运行时出现 `.next/standalone/package.json` 与根 `package.json` 的 haste module naming collision 警告，建议在 Jest 配置里忽略 `.next/`。
- 本地浏览器检查发现远程噪点资源 404，以及 Framer Motion `motion()` 弃用警告。

## 不建议现在做的事

- 不建议重写整体视觉风格。当前暖纸张、细边框、低饱和色的方向是统一的，问题在信息优先级和移动端细节。
- 不建议为了拆 `TaskConfigModal` 引入新的表单库。现有字段数量还不需要额外依赖，先用本地 hook 和小组件即可。
- 不建议一次性重构服务执行链路。先修 fail-open 默认值和环境变量强制校验，风险更低。
