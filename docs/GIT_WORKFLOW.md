# Git 工作流交互规范

为了保证项目开发效率、主线历史清晰度与自动发版的稳定性，本项目采用单主干工作流。

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
- **CI 要求**：PR 合并前必须通过 `lint`、`type-check`、`test` 与 `build`。

## 3. 自动发布流程 (CI/CD)

项目配置了 GitHub Actions 自动化发布：

1. **触发条件**：当开发分支的 PR 以 **Rebase and Merge** 方式合并到 `main` 分支时。
2. **自动化动作**：
   - 自动执行质量门：`lint`、`type-check`、`test`、`build`。
   - 自动计算版本号。
   - 更新 `package.json` 版本号。
   - 自动生成 `CHANGELOG.md`。
   - 自动打出 **Git Tag**。
   - 自动创建 **GitHub Release**。
   - 仅对 `feat`、`fix`、`perf`、`revert` 与 `BREAKING CHANGE` 触发正式版本发布。

### 3.1 版本升级规则

- `BREAKING CHANGE` 或 `type(scope)!:` -> `major`
- `feat: ...` -> `minor`
- `fix: ...`、`perf: ...`、`revert: ...` -> `patch`
- `docs`、`test`、`chore`、`style`、`refactor`、`ci`、`build` -> **不发版、不打 Tag**

### 3.2 分支保护建议

- `main` 必须开启 Branch Protection。
- 禁止直接 Push 到 `main`。
- 必须通过 PR 合并。
- 必须要求 CI Checks 全绿后才能合并。
- 推荐开启 `Rebase and Merge`，关闭 `Merge Commit` 到 `main`。

## 4. Commit Message 规范

推荐遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范，这直接影响 CHANGELOG 的生成：

- `feat: ...` -> 对应新功能
- `fix: ...` -> 对应缺陷修复
- `chore: ...` -> 对应构建过程或辅助工具的变动
- `docs: ...` -> 对应文档变更
