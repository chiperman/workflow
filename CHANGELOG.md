# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.9.1](https://github.com/chiperman/workflow/compare/v0.9.0...v0.9.1) (2026-03-18)

### Features

- **ci:** 引入 GitHub Actions 自动化发布流水线 ([eca7197](https://github.com/chiperman/workflow/commit/eca7197d74d76a7e5248f581ff66cfe4e7b17230))

## [0.9.0](https://github.com/chiperman/workflow/compare/v0.8.10...v0.9.0) (2026-03-18)

### Features

- **auth:** 开放首页访客查看权限并收紧操作安全控制 ([b4236c2](https://github.com/chiperman/workflow/commit/b4236c269af2e288ad7f7980225184eddee403dc))
- **core:** 实现多项目保活架构与动态通知系统 ([5981a27](https://github.com/chiperman/workflow/commit/5981a275b9ebbf962a5ea851757e239ff1f3efa2))
- **heatmap:** 在悬浮提示中补全成功签到的服务列表 ([7839b2d](https://github.com/chiperman/workflow/commit/7839b2d8a9b77f3c5464795fc8e9bcf6f4550d0f))
- **heatmap:** 实现基于创建日期的任务生命周期追踪 ([f0b281d](https://github.com/chiperman/workflow/commit/f0b281d8de1fcc861ee34d29991c4b8fc06ec8c6))
- **heatmap:** 实现热力图服务列表动态化并移除硬编码常量 ([d9b8846](https://github.com/chiperman/workflow/commit/d9b8846aba2cbb4de768f35edf60574f0dc6678e))
- **ui:** 优化任务卡片交互反馈与按钮布局 ([2cf49d3](https://github.com/chiperman/workflow/commit/2cf49d3b1795580323c77e870be6faa1a34dfa8f))
- **ui:** 增加敏感信息输入框的密码可见性切换功能 ([96b32c7](https://github.com/chiperman/workflow/commit/96b32c7ef924cff683dcefe5a5ee317115f7d386))
- **ui:** 引入任务分类分组渲染并清理冗余变量 ([df98db3](https://github.com/chiperman/workflow/commit/df98db3af79f7bb1b91ba3fb5690eca9f83d43fa))
- **ui:** 统一并优化任务配置交互面板与卡片样式 ([ddc68ec](https://github.com/chiperman/workflow/commit/ddc68ecec8d986b013e5fee514c8bdef128f98fd))
- 为任务卡片添加删除功能及二次确认弹窗 ([e30ce31](https://github.com/chiperman/workflow/commit/e30ce31b5a5b118561afe73b46870b32e644e5a8))
- 引入智能成功判定与一键探测功能，重构任务配置流程并修复保存失败问题 ([1f9e6f5](https://github.com/chiperman/workflow/commit/1f9e6f56704a72da2017aa985e371cd1689bd124))

### Bug Fixes

- **heatmap:** 修复 TypeScript 类型错误以支持生产环境构建 ([c85f140](https://github.com/chiperman/workflow/commit/c85f14003379462a33c929b447a5a39af8d90b4d))
- **heatmap:** 修复热力图网格中的 React Key 冲突警告 ([eb2dd1b](https://github.com/chiperman/workflow/commit/eb2dd1b396d028be0b0abe52ae9d858923810a7b))
- **layout:** 移除垂直居中对齐，修复内容加载后头部被挤出视野的问题 ([04118e3](https://github.com/chiperman/workflow/commit/04118e3c40f0862cdab2c4a8bb59cea780b2be42))
- **service:** 修复 GLaDOS 签到失败并优化日志记录系统 ([897a8ca](https://github.com/chiperman/workflow/commit/897a8cae4847de01126ea01f7fcce3bc5a5e4566))
- **ui:** 修复任务配置弹窗状态污染，优化 JSON 编辑体验并修复 ESLint 警告 ([5db78ce](https://github.com/chiperman/workflow/commit/5db78cea1f8290f7fdb6042b4c8ec1662f177ca6))
- **ui:** 修复开关组件状态不生效及列表刷新时卡片乱跳的问题 ([faa55a6](https://github.com/chiperman/workflow/commit/faa55a6db371d2df85174f63e361ee2f23bbbd13))
- **ui:** 修复页面加载状态闪烁及任务卡片本地状态未重置的问题 ([2e57bbd](https://github.com/chiperman/workflow/commit/2e57bbd13e4b5538e97cb4011ee5cd41f7c3a226))
- **ui:** 完善骨架屏，补齐鉴权按钮占位块并优化响应式尺寸 ([2574e12](https://github.com/chiperman/workflow/commit/2574e12cdcd22b063bc7d2bdbfecaa3ae14f6761))
- **ui:** 将任务列表加载状态升级为精致的任务卡片骨架屏 ([ace5d21](https://github.com/chiperman/workflow/commit/ace5d21999d963fcb25908d4086dc7fe645ba1bd))
- **ui:** 移除任务配置弹窗中冗余的通知级别字段 ([2581c3b](https://github.com/chiperman/workflow/commit/2581c3baee90c2da5dee5cc2c354f82262f5db15))
- 修复 JSX 语法错误及编译期类型报错，完善配置数据流 ([00ade6f](https://github.com/chiperman/workflow/commit/00ade6f2a5ec5e12ad2820bbd8bd30938eae70c6))
- 修复代码审查中发现的各类问题，优化系统稳定性与代码质量 ([d6acb8f](https://github.com/chiperman/workflow/commit/d6acb8fc6377d301c5bed465a7ec2208a2fbf007))
- 修复重构后的数据解析与环境隔离问题，恢复页面卡片与热力图显示 ([75f79c9](https://github.com/chiperman/workflow/commit/75f79c9cd187da0b6dbc235d3983c5a7ece5b12b))
- 彻底修复状态同步报错与 500 错误，并满足严格类型检查 ([cd415ff](https://github.com/chiperman/workflow/commit/cd415ff2b5cd8e8e147f95807214ec2049a0ae2b))
- 移除 TaskConfigModal 中多余的类型忽略指令，修复 build 错误 ([aff7fcd](https://github.com/chiperman/workflow/commit/aff7fcdc111e1b8020c7623e73c9d6ffa10942ae))
- 落实代码审查优化，增强系统鲁棒性、安全性与性能 ([94dc83e](https://github.com/chiperman/workflow/commit/94dc83e3d9af2c0dafcbe89b8d31c3672d937782))

### [0.8.10](https://github.com/chiperman/workflow/compare/v0.8.8...v0.8.10) (2026-01-27)

### Bug Fixes

- **heatmap:** 修复刷新时格子闪烁问题 ([2ac974c](https://github.com/chiperman/workflow/commit/2ac974c4f04e1295951c7a70a89bc0a0d43256af))

### [0.8.9](https://github.com/chiperman/workflow/compare/v0.8.8...v0.8.9) (2026-01-21)

### Refactor

- **service:** 统一服务执行逻辑到 ServiceExecutor
- **service:** 瘦身 BaseService，移除冗余方法
- **api:** 更新 api-helper 使用 ServiceExecutor

### [0.8.8](https://github.com/chiperman/workflow/compare/v0.8.7...v0.8.8) (2026-01-19)

### Features

- **ui:** 使用 Radix UI 重构 Heatmap Tooltip ([675eeb7](https://github.com/chiperman/workflow/commit/675eeb788534489940cd691317626371d389f2c6))
- 集成 sonner 并增强错误处理提示 ([b114ebb](https://github.com/chiperman/workflow/commit/b114ebb05e75eacaada873de01dc2560ee8bb856))

### Bug Fixes

- **ui:** 优化热力图交互与视觉体验 ([03144e9](https://github.com/chiperman/workflow/commit/03144e9ba5aeec6e603965700b948a465fab5453))
- **ui:** 优化移动端体验与视觉细节 ([4a24bd0](https://github.com/chiperman/workflow/commit/4a24bd06b9104f6df82d0b6ed05b9ea045b0181b))

### [0.8.7](https://github.com/chiperman/workflow/compare/v0.8.6...v0.8.7) (2026-01-19)

### Features

- **dashboard:** 增加今日未签到提示功能（含动画效果） ([2035257](https://github.com/chiperman/workflow/commit/2035257d21d414b76692e1bf0a181353c739334c))

### Bug Fixes

- **api:** 统一所有接口为动态渲染，修复刷新按钮缓存问题 ([e3afc10](https://github.com/chiperman/workflow/commit/e3afc10f6e273e5c30b89228676004e18f8c33b6))
- **glados:** 修正签到 token 从 glados.one 到 glados.cloud ([db054b7](https://github.com/chiperman/workflow/commit/db054b73933bf5ac41226fdcb0df319a51856d20))
- **glados:** 更新默认签到 URL 从 glados.rocks 到 glados.cloud ([0d6034f](https://github.com/chiperman/workflow/commit/0d6034f27f98f7830ad3d294895a1d4049c0e11b))
- **test:** 同步 health-check 测试用例，添加 todayCheckedIn 字段 ([9bd2d84](https://github.com/chiperman/workflow/commit/9bd2d84df8d57d50911312244547c3830497d6b5))

### [0.8.6](https://github.com/chiperman/workflow/compare/v0.8.5...v0.8.6) (2026-01-18)

### Features

- **ui:** 添加全局刷新按钮及状态反馈 ([cef1575](https://github.com/chiperman/workflow/commit/cef1575))

### Bug Fixes

- **ui:** 修复刷新按钮动画速度不一致问题 ([3b9ba94](https://github.com/chiperman/workflow/commit/3b9ba941044af97974a5c1860b03fde9a3b43e6f))

### [0.8.5](https://github.com/chiperman/workflow/compare/v0.8.1...v0.8.5) (2026-01-18)

### Features

- **heatmap:** 任务完成后自动刷新热力图 ([82cc0ac](https://github.com/chiperman/workflow/commit/82cc0acf39a21a889d422b29d003200952ad7725))
- **heatmap:** 实现热力图顺序渐显动效 ([81f6685](https://github.com/chiperman/workflow/commit/81f6685909a9b57988eb842c863536aa7eca29a2))
- **security:** 所有 API 接口添加强制鉴权 ([d1cd4d5](https://github.com/chiperman/workflow/commit/d1cd4d5c6b41c4daba52ad3d4b1e5475928dc16d))
- **service:** 提取数据库操作逻辑到 BaseService ([79f1f90](https://github.com/chiperman/workflow/commit/79f1f906a1145e620811eb0a81297689d1f65c9a))
- **ui:** 任务卡片错误消息添加关闭按钮 ([095fc8f](https://github.com/chiperman/workflow/commit/095fc8f099051c07c07fc42c9c8aa9b5b06be2ee))

### Bug Fixes

- **auth:** 将 Cookie sameSite 属性改为 strict 增强 CSRF 防护 ([c703b9c](https://github.com/chiperman/workflow/commit/c703b9c6c23ca6ddc753a725daee5837e44e03a1))
- **notification:** 移除手动触发时的强制成功通知逻辑 ([fe57232](https://github.com/chiperman/workflow/commit/fe57232aa0d01548df284b37182545b647850e54))
- **ui:** heatmap 错误处理优化 ([f99db50](https://github.com/chiperman/workflow/commit/f99db50b944fe9888c24f1442e247da00950f986))

## [0.8.4] - 2026-01-18

### Refactored

- **数据库操作统一**: 提取 `BaseService.updateServiceStats` 通用方法，消除了 `GladosService` 和 `SupabaseService` 中重复的数据库操作逻辑 (C1)。
- **统一鉴权 (A2)**: 实现了统一的 Auth Guard，集中管理 Middleware 和 API 路由的权限校验逻辑，消除了分散的鉴权代码。
- **代码清理**: 移除了服务层中冗余的依赖引用。

## [0.8.3] - 2026-01-17

### Removed

- **LeanCloud 移除**: 由于服务停止，彻底移除了 LeanCloud 相关的所有代码、配置、API 和文档 (A1)。
- **清理**: 删除了 `src/lib/services/LeanCloudService.ts` 及相关测试和路由。

### Refactored

- **TaskCard 重构**: 将 `TaskCard` 组件拆分为 `Header`, `Stats`, `Actions`, `Message` 四个子组件，提升可维护性 (C4)。

## [0.8.2] - 2026-01-16

### Refactored

- **服务层优化**: 将重复的 `getStats()` 实现上移至 `BaseService`，删除约 90 行重复代码。
- **Heatmap 组件拆分**: 提取日历计算函数到 `heatmap-calendar.ts` 模块，组件从 369 行精简到 280 行。

### Added

- **服务名常量**: 新增 `SERVICES` 常量和 `ServiceName` 类型，消除魔法字符串。
- **组件测试**: 新增 `TaskCard.test.tsx` 和 `Heatmap.test.tsx`，覆盖组件渲染、API 交互等场景。
- **日历工具测试**: 新增 `heatmap-calendar.test.ts`，覆盖日期生成、闰年处理、格式化等功能。

### Fixed

- **测试用例修复**: 修复 `services.test.ts` 和 `health-check.test.ts` 中缺失 `failure_count` 字段导致的测试失败。
- **文档一致性**: 统一 README 和 API.md 中 `keep_alive_logs.status` 类型为 `BOOLEAN`。

### Maintenance

- 移除 `TaskCard` 组件中的空 `useEffect`。

## [0.8.1] - 2026-01-16

### Fixed

- **日志记录丢失**: 修复 Serverless 环境下因函数提前退出导致签到日志未写入的问题（添加 `await`）。
- **重复签到日志**: GLaDOS 重复签到时不再记录日志，避免记录无意义的数据。引入 `skipLog` 字段标识跳过日志场景。

## [0.8.0] - 2026-01-16

### Added

- **签到热力图 (Heatmap)**: 新增 GitHub 风格的签到记录热力图，可视化展示服务运行历史。
  - 采用"服务级最终一致性"逻辑：只要当天服务最终恢复成功，该天即显示为绿色。
  - 支持成功/失败的颜色区分（绿色/红色）。
  - 悬浮提示显示每日详细签到状态，仅列出失败的服务。
  - 按北京时间聚合数据，精准对应用户视角。
- **签到日志表 (`keep_alive_logs`)**: 在 Supabase 中新增日志表，记录每次签到的详细状态。
- **热力图 API (`/api/stats/heatmap`)**: 提供过去 12 个月的签到数据聚合接口。
- **独立失败统计**: TaskCard 组件新增独立的失败计数器显示。
- **单元测试**: 新增 `heatmap-utils` 测试，覆盖自动修复、持续故障、跨时区等核心场景。

### Changed

- **BaseService 增强**: 在签到执行后自动写入日志，实现"切面记录"。支持每日成功日志去重。

## [0.7.0] - 2026-01-15

### Added

- **UI 动效优化**: 实现了符合 Anthropic 风格的温柔动效 (ease-in-out, 0.8s)，提升了视觉体验。
- **全局动效配置**: 在 `src/config/constants.ts` 中引入 `MOTION_CONFIG`，集中管理动画参数。
- **服务开关控制**: 在 UI 中添加了针对各项服务的启用/禁用开关。
- **加载状态优化**: 在页面路由切换时添加了加载指示器。

### Changed

- **版本同步**: 统一 `package.json` 和 `README.md` 版本号为 0.7.0。
- **测试修复**: 修正了 `health-check` 相关的测试用例以适配新的 API 返回结构（包含 `enabled` 字段）。
- **工程规范**: 调整 Jest 覆盖率阈值以符合项目现状，确保 CI 流程畅通。

### Fixed

- **滚动条抖动**: 移除了主页动效中的位移属性，修复了页面加载时的布局偏移问题。
- **样式统一**: 统一了登录页和主页的圆角设计 (`rounded-lg`)。

## [0.6.1] - 2026-01

### Security

- **App Key 安全优化**: 分离了输入值与已保存值的显示逻辑，避免编辑时的潜在冲突，增强了安全性。

### Fixed

- **UI 状态同步**: 修复了 App Key 变化时错误状态未及时清除的问题。
- **禁用态样式**: 优化了输入框禁用状态下的视觉表现。

## [0.6.0] - 2026-01

### Added

- **服务开关控制**: 引入了服务维度的启停控制逻辑，允许通过 UI 单独开启或关闭特定服务的自动保活任务。
- **RLS 安全策略**: 启用了 Supabase 的行级安全策略 (Row Level Security)，增强了数据访问控制。

## [0.5.0]

### Added

- **GLaDOS 自动签到**: 新增 GLaDOS 服务的自动签到功能，支持维持网络服务权限。

## [0.4.5]

### Changed

- **架构重构**: 对项目架构进行了重写，提升了代码的可维护性和扩展性。

### Added

- **通知分级策略**: 支持 `always`, `failure-only`, `none` 三种通知级别，解决通知疲劳问题。
- **统一日志系统**: 集成了标准化的 Logger 工具，实现生产级的日志监控。

## [0.3.0]

### Added

- **智能重试机制**: 实现了指数退避重试策略 (1s, 2s, 4s)，提高任务执行的可靠性。
- **错误识别**: 能够自动识别配置错误（如表不存在）并停止无效重试。
