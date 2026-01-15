---
description: 如何将 feature 分支合并到 dev 并发布
---

# Feature 分支合并流程

本工作流适用于单人开发场景，采用 Rebase + Fast-Forward 策略保持线性历史。

## 前提条件

- feature 分支已完成开发和测试
- 所有文件已提交
- Commit message 符合 Conventional Commits 规范

## 操作步骤

### 1. 确保 feature 分支基于最新的 dev

```bash
git checkout feature/<name>
git rebase dev
```

如有冲突，解决后执行 `git rebase --continue`。

### 2. 切换到 dev 分支并合并

```bash
git checkout dev
git merge feature/<name> --ff-only
```

`--ff-only` 确保是快进合并，保持线性历史。如果失败，说明需要先 rebase。

### 3. 推送 dev 到远程

```bash
git push origin dev
```

### 4. (可选) 打版本标签

如果是正式发布版本：

```bash
git tag v0.8.0
git push origin v0.8.0
```

### 5. (可选) 同步到 main

如果 main 用于生产环境：

```bash
git checkout main
git merge dev --ff-only
git push origin main
```

### 6. 清理 feature 分支

```bash
git branch -d feature/<name>
git push origin --delete feature/<name>
```

## 完整示例

```bash
# 假设当前在 feature/heatmap 分支
git rebase dev
git checkout dev
git merge feature/heatmap --ff-only
git push origin dev

# 打标签发布
git tag v0.8.0
git push origin v0.8.0

# 同步到 main
git checkout main
git merge dev --ff-only
git push origin main

# 清理
git branch -d feature/heatmap
git push origin --delete feature/heatmap
```
