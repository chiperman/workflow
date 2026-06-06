# Git 工作流规范

为了保证项目开发效率与主线历史清晰度，本项目采用轻量单主干工作流。

## 1. 分支职责说明

| 分支名称     | 职责定位                                                    | 合并限制                                    |
| :----------- | :---------------------------------------------------------- | :------------------------------------------ |
| **`main`**   | **主干 / 生产分支**。代表当前可发布代码，也是唯一长期分支。 | 仅接受来自短期开发分支的 PR。禁止直接提交。 |
| **`feat/*`** | **功能开发分支**。从 `main` 拉出，完成后直接合回 `main`。   | 短期存在，合并入 `main` 后应当删除。        |
| **`fix/*`**  | **缺陷修复分支**。从 `main` 拉出，完成后直接合回 `main`。   | 短期存在，合并入 `main` 后应当删除。        |

## 2. 合并与提交规范

### 2.1 开发分支 -> `main`

- **提交方式**：通过 Pull Request (PR) 提交。
- **合并策略**：**Rebase and Merge** (变基合并)。
- **理由**：保持 `main` 提交历史绝对线性，同时保留开发分支上的原子化语义提交。
- **验证要求**：合并前由开发者本地按改动风险运行必要检查。

## 3. 验证与发布

仓库只保留轻量 GitHub Actions CI，不配置自动发布。默认验证分两层：

PR 到 `main` 时会自动运行：

- `npm run type-check`
- `npm run lint:check`
- `npm test -- --runInBand`

本地按改动风险可额外运行：

- `npm run build`

发布也改为手动执行：

1. 确认 `main` 是目标发布状态。
2. 本地运行必要验证。
3. 使用 `npm run release` 或 `npx standard-version --release-as <patch|minor|major>` 生成版本提交与 tag。
4. 推送 release commit 和 tag。
5. 需要 GitHub Release 时，在 GitHub 页面或 `gh release create` 手动创建。

### 3.1 版本升级建议

- `BREAKING CHANGE` 或 `type(scope)!:` -> `major`
- `feat: ...` -> `minor`
- `fix: ...`、`perf: ...`、`revert: ...` -> `patch`
- `docs`、`test`、`chore`、`style`、`refactor`、`ci`、`build` -> 通常不发版

### 3.2 分支保护建议

- `main` 必须开启 Branch Protection。
- 禁止直接 Push 到 `main`。
- 必须通过 PR 合并。
- 推荐开启 `Rebase and Merge`，关闭 `Merge Commit` 到 `main`。
- 可选择将轻量 CI 设为 required status check。

## 4. Commit Message 规范

必须遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范，这直接影响 CHANGELOG 的生成：

```text
<type>(<scope>): <中文简短描述>

<可选：中文详细列表描述>
```

常用类型：

- `feat: ...` -> 对应新功能
- `fix: ...` -> 对应缺陷修复
- `perf: ...` -> 对应性能优化
- `refactor: ...` -> 对应不改变行为的结构调整
- `test: ...` -> 对应测试补充或修正
- `chore: ...` -> 对应构建过程或辅助工具的变动
- `docs: ...` -> 对应文档变更

手动发布时优先根据 `feat`、`fix`、`perf`、`revert` 与 `BREAKING CHANGE` 判断版本级别。
