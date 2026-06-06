# 手动发布清单

这份清单用于手动完成版本发布。仓库只保留轻量 PR CI，不配置自动发布。

## 1. 仓库当前策略

- 已保留轻量 PR CI
- 已移除长期 `dev` 分支依赖
- 发布由维护者本地执行验证、版本提交、tag 与 GitHub Release
- 版本规则建议：
  - `BREAKING CHANGE` / `!` -> `major`
  - `feat` -> `minor`
  - `fix` / `perf` / `revert` -> `patch`
  - `docs` / `test` / `chore` / `ci` / `build` / `refactor` / `style` -> 通常不发版
- 已移除 `dev` 分支同步逻辑

## 2. 你还需要在 GitHub 手动做的事

### 2.1 保护 `main`

在 GitHub 仓库中进入：

`Settings -> Branches -> Branch protection rules`

对 `main` 配置：

- Require a pull request before merging
- 可选择将轻量 CI 设为 required status check
- 可选 Restrict who can push to matching branches
- 禁止普通成员直接 push 到 `main`

### 2.2 合并策略

在 GitHub 仓库中进入：

`Settings -> General -> Pull Requests`

建议配置：

- 开启 `Allow rebase merging`
- 关闭 `Allow merge commits`
- 可选关闭 `Allow squash merging` 到 `main`

原因：

- 当前流程按“短期开发分支通过 `Rebase and Merge` 进入 `main`”设计
- 这样 `main` 历史保持单线，便于手动发布时判断版本范围

## 3. 日常开发流程

1. 从 `main` 拉出短期分支。
2. 在分支开发和本地自测。
3. 按改动风险运行必要检查。
4. 提交 PR 到 `main`。
5. 等轻量 CI 通过。
6. Review 后使用 `Rebase and Merge` 合并。

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

建议触发正式发版的类型：

- `feat`
- `fix`
- `perf`
- `revert`
- `BREAKING CHANGE`

## 5. 发布步骤

1. 切到最新 `main`：

```bash
git checkout main
git pull --ff-only
```

2. 运行必要验证：

```bash
npm run lint:check
npm run type-check
npm test -- --runInBand
npm run build
```

3. 生成 release commit 和 tag：

```bash
npm run release
```

需要指定版本级别时：

```bash
npx standard-version --release-as patch
npx standard-version --release-as minor
npx standard-version --release-as major
```

4. 推送 release commit 和 tag：

```bash
git push origin main --follow-tags
```

5. 创建 GitHub Release：

```bash
gh release create vX.Y.Z --title "Release vX.Y.Z" --notes-file RELEASE_NOTE.md
```

## 6. 当前半成功发版的补救

此前失败的 release run 已经把 `v0.10.0` tag 推到远端，但 release commit 没有进入 `main`，GitHub Release 也没有创建。

如果要重新发布 `v0.10.0`，先删除这个孤立 tag：

```bash
git push origin :refs/tags/v0.10.0
git tag -d v0.10.0
```

然后从最新 `main` 手动重新执行：

```bash
npx standard-version --release-as minor
git push origin main --follow-tags
```

## 7. 相关文件

- `/.github/workflows/ci.yml`
- `/scripts/determine-release.mjs`
- `/docs/GIT_WORKFLOW.md`
