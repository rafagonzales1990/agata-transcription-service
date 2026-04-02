import { test, expect } from '../../playwright-fixture';

test.describe('Landing Page', () => {
  test('loads and shows key elements', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ágata/);
    await expect(page.locator('text=Transcrição')).toBeVisible();
  });

  test('blog link works', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Blog');
    await expect(page).toHaveURL(/\/blog/);
  });

  test('pricing section visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Inteligente')).toBeVisible();
    await expect(page.locator('text=R\\$')).toBeVisible();
  });
});
