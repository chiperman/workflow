import { test, expect } from '@playwright/test';

test.describe('Workflow Dashboard Smoke Test', () => {
  test('should load the home page and show the correct heading', async ({ page }) => {
    // 访问首页
    await page.goto('/');

    // 验证标题是否存在并包含文字 (System Operations)
    // 根据 src/app/page.tsx 第 115 行
    const heading = page.locator('h1 span');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('System Operations');
  });

  test('should show the heatmap section', async ({ page }) => {
    await page.goto('/');

    // 验证热力图组件是否渲染 (根据其容器 class 或内容)
    const heatmap = page.locator('header + div'); // 热力图在 header 下方
    await expect(heatmap).toBeVisible();
  });

  test('should have a sign in button', async ({ page }) => {
    await page.goto('/');

    // 验证登录按钮是否存在 (预览模式下)
    const signInBtn = page.getByRole('button', { name: /Sign in/i });
    await expect(signInBtn).toBeVisible();
  });
});
