# 规范化工作流指南

本文档定义项目的提交规范与自动化发布流程，确保开发历史清晰且具有语义化。

---

## 1. 提交规范 (Commit Convention)

所有代码提交必须遵循 **Conventional Commits** 规范。

### 格式

```text
<type>(<scope>): <中文简短描述>

<可选：中文详细列表描述>
```

### 常用类型

- **feat**: 引入新功能 (触发 Minor 版本提升)。
- **fix**: 修复 Bug (触发 Patch 版本提升)。
- **docs**: 仅修改文档。
- **style**: 格式调整 (不涉及逻辑)。
- **refactor**: 代码重构。
- **test**: 增加或修正测试。
- **chore**: 构建流程或辅助工具变动。

---

## 2. 发布规范 (Release Convention)

发布流程由 GitHub Actions 全自动驱动，确保版本一致性。

### 规则

1. **禁止手动改版**: 严禁在 `package.json` 中手动修改版本号。
2. **自动化发布**: 向 `main` 分支的 Push 或 Merge 操作将自动触发 CI 流水线。
3. **自动记录**: 流水线会自动生成 GitHub Release 与 `chore(release)` 提交。

---

## 3. 自动化运维 (CI/CD)

项目利用 GitHub Actions 实现无缝版本化。

- **触发条件**: 向 `main` 分支的提交。
- **核心流程**:
  1. **安全校验**: 自动运行 Lint 与 Jest 测试。
  2. **自动版本化**: 基于 Commit 类型计算新版本。
  3. **文档同步**: 自动更新 `CHANGELOG.md`。
  4. **自动发布**: 创建新的 GitHub Release 记录与 Git Tag。

> [!TIP]
> 建议始终通过 Pull Request (PR) 合并代码。合并完成的瞬间将自动触发线上发布。
