import { test, expect } from '@playwright/test';
import { registerAndLogin, waitForDialog, waitForDialogToClose, selectFirstOption, navigateTo } from './helpers';

test.describe('Budgets', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'budget');
    await navigateTo(page, '/en/budgets');
  });

  test('should display budgets page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/budget/i);
  });

  test('should open create budget dialog', async ({ page }) => {
    await page.getByRole('button', { name: /create budget/i }).click();
    
    await waitForDialog(page);
    await expect(page.getByLabel(/amount|limit/i)).toBeVisible();
  });

  test('should create a new budget successfully', async ({ page }) => {
    await page.getByRole('button', { name: /create budget/i }).click();
    await waitForDialog(page);
    
    await selectFirstOption(page);
    await page.getByLabel(/amount|limit/i).fill('500');
    
    await page.getByRole('dialog').getByRole('button', { name: /create|save|submit/i }).click();
    
    await waitForDialogToClose(page);
    await expect(page.getByText(/\$500|500/)).toBeVisible();
  });

  test('should display budget cards after creation', async ({ page }) => {
    await page.getByRole('button', { name: /create budget/i }).click();
    await waitForDialog(page);
    
    await selectFirstOption(page);
    await page.getByLabel(/amount|limit/i).fill('1000');
    
    await page.getByRole('dialog').getByRole('button', { name: /create|save|submit/i }).click();
    
    await waitForDialogToClose(page);
    
    const budgetCard = page.locator('article, [data-testid="budget-card"]').first();
    await expect(budgetCard).toBeVisible();
  });

  test('should show budget summary cards', async ({ page }) => {
    await expect(page.getByText(/total budget/i)).toBeVisible();
  });
});
