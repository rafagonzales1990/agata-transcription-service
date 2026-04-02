import { test, expect, Page } from '../../playwright-fixture';

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', process.env.TEST_EMAIL || 'adm@agatatranscription.com');
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD || '');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 10000 });
}

test.describe('Dashboard (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard loads with stats', async ({ page }) => {
    await expect(page.locator('text=Total de Reuniões')).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await page.click('text=Reuniões');
    await expect(page).toHaveURL(/\/meetings/);
  });

  test('upload page loads', async ({ page }) => {
    await page.click('text=Nova Transcrição');
    await expect(page).toHaveURL(/\/upload/);
  });
});
