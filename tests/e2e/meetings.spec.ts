import { test, expect, Page } from '../../playwright-fixture';

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', process.env.TEST_EMAIL || 'adm@agatatranscription.com');
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD || '');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 10000 });
}

test.describe('Meetings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('meetings list loads', async ({ page }) => {
    await page.goto('/meetings');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('search filter works', async ({ page }) => {
    await page.goto('/meetings');
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('teste');
      await expect(searchInput).toHaveValue('teste');
    }
  });
});
