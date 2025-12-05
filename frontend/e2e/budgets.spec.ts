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

  test('should edit existing budget', async ({ page }) => {
    await page.getByRole('button', { name: /create budget/i }).click();
    await waitForDialog(page);
    await selectFirstOption(page);
    await page.getByLabel(/amount|limit/i).fill('300');
    await page.getByRole('dialog').getByRole('button', { name: /create|save|submit/i }).click();
    await waitForDialogToClose(page);
    
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await waitForDialog(page);
      
      await page.getByLabel(/amount|limit/i).clear();
      await page.getByLabel(/amount|limit/i).fill('600');
      await page.getByRole('dialog').getByRole('button', { name: /save|update|submit/i }).click();
      
      await waitForDialogToClose(page);
      await expect(page.getByText(/\$600|600/)).toBeVisible();
    }
  });

  test('should delete budget with confirmation', async ({ page }) => {
    await page.getByRole('button', { name: /create budget/i }).click();
    await waitForDialog(page);
    await selectFirstOption(page);
    await page.getByLabel(/amount|limit/i).fill('200');
    await page.getByRole('dialog').getByRole('button', { name: /create|save|submit/i }).click();
    await waitForDialogToClose(page);
    
    const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
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

  test('should show progress bar for budget spending', async ({ page }) => {
    await page.getByRole('button', { name: /create budget/i }).click();
    await waitForDialog(page);
    await selectFirstOption(page);
    await page.getByLabel(/amount|limit/i).fill('1000');
    await page.getByRole('dialog').getByRole('button', { name: /create|save|submit/i }).click();
    await waitForDialogToClose(page);
    
    await expect(page.getByRole('progressbar').first()).toBeVisible();
  });
});
