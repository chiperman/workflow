# 项目规范化工作流指南 (Standardized Workflow Guide)

为了确保项目的演进历史清晰、版本号具有语义化含义且文档自动同步，本项目严格遵守以下开发规范。

---

## 1. 提交规范 (Commit Convention)

所有代码提交必须遵循 **Conventional Commits** 规范。格式如下：

```text
<type>(<scope>): <中文简短描述>

<可选：详细描述，使用中文列表>
```

### 常用类型 (Types)

- **feat**: 引入新功能。也会触发 Minor 版本号增加（如 `0.8.0` -> `0.9.0`）。
- **fix**: 修复 Bug。触发 Patch 版本号增加（如 `0.8.10` -> `0.8.11`）。
- **docs**: 仅修改文档（不触发版本号）。
- **style**: 代码格式调整（不影响逻辑）。
- **test**: 增加或修改测试用例。
- **refactor**: 代码重构。
- **chore**: 构建流程或辅助工具变动。

---

## 2. 发布规范 (Release Convention)

**严禁手动修改 `package.json` 中的版本号或在文档中手写版本更新。** 所有发布操作应由工具自动完成。

### 发布流程

1. **核对状态**：确保所有代码已合并至 `main` 且测试平稳运行 (`npm test`)。
2. **执行发布**：运行 `npm run release`。
   - 工具会自动：扫描 Commit、生成 CHANGELOG、更新版本号、产生 `chore(release)` 提交并打上 Tag。
3. **推送代码**：`git push --follow-tags origin main`。

### 特殊情况：强制指定版本

如果需要从 `0.8.x` 强制跨越到 `0.9.x`（即便只有 `fix` 提交），请运行：

```bash
npx standard-version --release-as minor
```

---

## 3. 常见问题 (FAQ)

### 为什么 Git 历史中会有 `chore(release)` 提交？

这是版本发布的“里程碑”记录，它将版本号、更新日志和源代码状态在同一时刻定格，方便后续回溯和生产部署。

### 为什么不要手动改版本号？

手动修改容易导致 Git Tag、`package.json` 和文档之间的不一致，破坏自动化工具的幂等性。

---

## 4. 历史清理记录 (History Cleanup)

> [!NOTE]
> 2026-03-18：本项目执行了历史清理，撤销了冗余的 `v0.8.11` 过渡版本，统一合并为标准的 `v0.9.0` 发布。
