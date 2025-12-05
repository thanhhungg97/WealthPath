import { test, expect } from '@playwright/test';
import { registerAndLogin, waitForDialog, waitForDialogToClose, selectFirstOption, navigateTo } from './helpers';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'tx');
    await navigateTo(page, '/en/transactions');
  });

  test('should display transactions page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/transaction/i);
  });

  test('should open add transaction dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add transaction|add/i }).first().click();
    
    await waitForDialog(page);
    await expect(page.getByLabel(/amount/i)).toBeVisible();
  });

  test('should create expense transaction successfully', async ({ page }) => {
    await page.getByRole('button', { name: /add transaction|add/i }).first().click();
    await waitForDialog(page);
    
    await page.getByLabel(/amount/i).fill('75');
    await selectFirstOption(page);
    
    await page.getByRole('button', { name: /add|create|save|submit/i }).click();
    
    await waitForDialogToClose(page);
    await expect(page.getByText(/\$75|75\.00/)).toBeVisible();
  });

  test('should create income transaction successfully', async ({ page }) => {
    await page.getByRole('button', { name: /add transaction|add/i }).first().click();
    await waitForDialog(page);
    
    const incomeTab = page.getByRole('dialog').getByRole('button', { name: /income/i });
    if (await incomeTab.isVisible()) {
      await incomeTab.click();
    }
    
    await page.getByLabel(/amount/i).fill('2000');
    await selectFirstOption(page);
    
    await page.getByRole('button', { name: /add|create|save|submit/i }).click();
    
    await waitForDialogToClose(page);
    await expect(page.getByText(/\$2,?000|2000/)).toBeVisible();
  });

  test('should filter transactions by type tabs', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: /all/i });
    const incomeTab = page.getByRole('tab', { name: /income/i });
    const expenseTab = page.getByRole('tab', { name: /expense/i });
    
    if (await allTab.isVisible()) {
      await incomeTab.click();
      await expect(incomeTab).toHaveAttribute('data-state', 'active');
      
      await expenseTab.click();
      await expect(expenseTab).toHaveAttribute('data-state', 'active');
      
      await allTab.click();
      await expect(allTab).toHaveAttribute('data-state', 'active');
    }
  });
});
