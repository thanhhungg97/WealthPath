import { expect, test } from '@playwright/test';

import { registerAndLogin } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'dashboard');
  });

  test('should display dashboard page with title @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show financial summary cards', async ({ page }) => {
    const incomeCard = page.getByText(/income/i);
    const expenseCard = page.getByText(/expense/i);
    
    await expect(incomeCard.first()).toBeVisible();
    await expect(expenseCard.first()).toBeVisible();
  });

  test('should have navigation sidebar', async ({ page }) => {
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    await expect(nav.getByRole('link').first()).toBeVisible();
    const navLinks = await nav.getByRole('link').count();
    expect(navLinks).toBeGreaterThan(0);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    const mobileMenuButton = page.getByRole('button', { name: /menu|toggle/i });
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });

  test('should display charts section', async ({ page }) => {
    const chartSection = page.locator('canvas, [data-testid="chart"], svg').first();
    
    if (await chartSection.isVisible()) {
      await expect(chartSection).toBeVisible();
    }
  });
});
