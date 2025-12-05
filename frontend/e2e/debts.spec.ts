import { test, expect } from '@playwright/test';
import { registerAndLogin, waitForDialog, waitForDialogToClose, selectFirstOption, navigateTo } from './helpers';

test.describe('Debts', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'debt');
    await navigateTo(page, '/en/debts');
  });

  test('should display debts page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/debt/i);
  });

  test('should open add debt dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add debt/i }).click();
    
    await waitForDialog(page);
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test('should add new debt successfully', async ({ page }) => {
    await page.getByRole('button', { name: /add debt/i }).click();
    await waitForDialog(page);
    
    await page.getByLabel(/name/i).fill('Car Loan');
    await selectFirstOption(page);
    await page.getByLabel(/original amount/i).fill('25000');
    await page.getByLabel(/current balance/i).fill('20000');
    await page.getByLabel(/interest rate/i).fill('5.5');
    await page.getByLabel(/min.*payment|minimum/i).fill('450');
    await page.getByLabel(/due day/i).fill('15');
    await page.getByLabel(/start date/i).fill('2024-01-01');
    
    await page.getByRole('dialog').getByRole('button', { name: /add debt/i }).click();
    
    await waitForDialogToClose(page);
    await expect(page.getByText(/car loan/i)).toBeVisible();
  });

  test('should make payment on debt', async ({ page }) => {
    await page.getByRole('button', { name: /add debt/i }).click();
    await waitForDialog(page);
    
    await page.getByLabel(/name/i).fill('Credit Card');
    await selectFirstOption(page);
    await page.getByLabel(/original amount/i).fill('5000');
    await page.getByLabel(/current balance/i).fill('3000');
    await page.getByLabel(/interest rate/i).fill('18');
    await page.getByLabel(/min.*payment|minimum/i).fill('100');
    await page.getByLabel(/due day/i).fill('1');
    await page.getByLabel(/start date/i).fill('2024-01-01');
    
    await page.getByRole('dialog').getByRole('button', { name: /add debt/i }).click();
    await waitForDialogToClose(page);
    
    const payButton = page.getByRole('button', { name: /make payment|pay/i }).first();
    if (await payButton.isVisible()) {
      await payButton.click();
      await waitForDialog(page);
      
      await page.getByLabel(/amount/i).fill('500');
      await page.getByRole('dialog').getByRole('button', { name: /pay|submit|make/i }).click();
      
      await waitForDialogToClose(page);
    }
  });

  test('should display debt summary', async ({ page }) => {
    await expect(page.getByText(/total debt|total balance/i)).toBeVisible();
  });
});
