# 发布流程落地清单

这份清单用于完成 `开发分支 -> main -> 自动发版` 流程的最后落地。

## 1. 已完成的仓库内改造

- 已将 CI 校验收敛到 `PR -> main`
- 已移除长期 `dev` 分支依赖
- 已将发布触发收敛为 `main` 上的合并后自动发版
- 已将版本规则固定为：
  - `BREAKING CHANGE` / `!` -> `major`
  - `feat` -> `minor`
  - `fix` / `perf` / `revert` -> `patch`
  - `docs` / `test` / `chore` / `ci` / `build` / `refactor` / `style` -> 不发版
- 已移除 `dev` 分支同步逻辑

## 2. 你还需要在 GitHub 手动做的事

这些配置必须在 GitHub 仓库页面完成，代码里不能替你自动设置。

### 2.1 保护 `main`

在 GitHub 仓库中进入：

`Settings -> Branches -> Branch protection rules`

对 `main` 配置：

- Require a pull request before merging
- Require status checks to pass before merging
- 选择 CI 对应的检查项
- Restrict who can push to matching branches
- 禁止普通成员直接 push 到 `main`

### 2.2 合并策略

在 GitHub 仓库中进入：

`Settings -> General -> Pull Requests`

建议配置：

- 开启 `Allow rebase merging`
- 关闭 `Allow merge commits`
- 可选关闭 `Allow squash merging` 到 `main`

原因：

- 当前发布流程按“短期开发分支通过 `Rebase and Merge` 进入 `main`”设计
- 这样 `main` 历史保持单线，最符合当前仓库目标

### 2.3 Actions 推送权限

当前 release workflow 会在发版时：

- 向 `main` 推送 release commit 和 tag

如果你的分支保护不允许默认 `GITHUB_TOKEN` 推送，需要手动加一个 Personal Access Token：

`Settings -> Secrets and variables -> Actions -> New repository secret`

名称：

`GH_PAT`

建议权限至少包含：

- `contents: write`

如果默认 `GITHUB_TOKEN` 已可满足推送要求，也可以不配 `GH_PAT`。

## 3. 以后正确的开发流程

### 3.1 功能开发

1. 从 `main` 拉出功能分支
2. 在功能分支开发和自测
3. 提交 PR 到 `main`
4. 等 CI 通过后使用 `Rebase and Merge` 合并
5. 合并后 GitHub Actions 自动：
   - 判断是否需要发版
   - 计算版本号
   - 更新 `package.json`
   - 更新 `CHANGELOG.md`
   - 创建 tag
   - 创建 GitHub Release

## 4. 提交信息规范

后续请尽量严格使用 Conventional Commits：

- `feat: 新功能`
- `fix: 修复问题`
- `perf: 性能优化`
- `revert: 回滚提交`
- `docs: 文档修改`
- `test: 测试修改`
- `chore: 杂项维护`
- `ci: 流水线修改`
- `build: 构建修改`
- `refactor: 重构`
- `style: 样式或格式调整`

会触发正式发版的只有：

- `feat`
- `fix`
- `perf`
- `revert`
- `BREAKING CHANGE`

## 5. 建议你马上做的一次验收

建议按下面顺序做一次真实演练：

1. 新建一个测试分支，从 `main` 拉出
2. 提交一个 `fix:` 或 `feat:` 类型的改动
3. 提 PR 到 `main`
4. 用 `Rebase and Merge` 合并
5. 观察 GitHub Actions 是否自动：
   - 跑质量门
   - 生成版本号
   - 创建 tag
   - 创建 GitHub Release

## 6. 如果发版没有自动执行，优先检查这几项

- `main` 是否真的是通过 PR 合并进去的
- 提交类型是否属于可发版类型
- GitHub Actions 是否有写仓库内容的权限
- 是否需要配置 `GH_PAT`
- `main` 分支保护是否把 Actions 的推送拦住了
- 是否错误关闭了 `Rebase and Merge`

## 7. 相关文件

- `/.github/workflows/ci.yml`
- `/.github/workflows/release.yml`
- `/scripts/determine-release.mjs`
- `/docs/GIT_WORKFLOW.md`
