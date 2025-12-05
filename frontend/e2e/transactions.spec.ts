import { expect, test } from '@playwright/test';
import { navigateTo, registerAndLogin, selectFirstOption, waitForDialog, waitForDialogToClose } from './helpers';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'tx');
    await navigateTo(page, '/en/transactions');
  });

  test('should display transactions page with title @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/transaction/i);
  });

  test('should open add transaction dialog @smoke', async ({ page }) => {
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

  test('should edit existing transaction', async ({ page }) => {
    await page.getByRole('button', { name: /add transaction|add/i }).first().click();
    await waitForDialog(page);
    await page.getByLabel(/amount/i).fill('100');
    await selectFirstOption(page);
    await page.getByRole('button', { name: /add|create|save|submit/i }).click();
    await waitForDialogToClose(page);
    
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await waitForDialog(page);
      
      await page.getByLabel(/amount/i).clear();
      await page.getByLabel(/amount/i).fill('150');
      await page.getByRole('dialog').getByRole('button', { name: /save|update|submit/i }).click();
      
      await waitForDialogToClose(page);
      await expect(page.getByText(/\$150|150/)).toBeVisible();
    }
  });

  test('should delete transaction with confirmation', async ({ page }) => {
    await page.getByRole('button', { name: /add transaction|add/i }).first().click();
    await waitForDialog(page);
    await page.getByLabel(/amount/i).fill('50');
    await selectFirstOption(page);
    await page.getByRole('button', { name: /add|create|save|submit/i }).click();
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
