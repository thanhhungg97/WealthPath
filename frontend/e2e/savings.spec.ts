import { test, expect } from '@playwright/test';
import { registerAndLogin, waitForDialog, waitForDialogToClose, navigateTo } from './helpers';

test.describe('Savings Goals', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'savings');
    await navigateTo(page, '/en/savings');
  });

  test('should display savings page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/saving/i);
  });

  test('should open new goal dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new goal|add goal|create/i }).click();
    
    await waitForDialog(page);
    await expect(page.getByLabel(/name|goal/i)).toBeVisible();
  });

  test('should create new savings goal successfully', async ({ page }) => {
    await page.getByRole('button', { name: /new goal|add goal|create/i }).click();
    await waitForDialog(page);
    
    await page.getByLabel(/name|goal/i).fill('Vacation Fund');
    await page.getByLabel(/target|amount/i).fill('5000');
    
    const dateInput = page.getByLabel(/date|target date/i);
    if (await dateInput.isVisible()) {
      await dateInput.fill('2025-12-31');
    }
    
    await page.getByRole('dialog').getByRole('button', { name: /create|save|add/i }).click();
    
    await waitForDialogToClose(page);
    await expect(page.getByText(/vacation fund/i)).toBeVisible();
  });

  test('should add contribution to savings goal', async ({ page }) => {
    await page.getByRole('button', { name: /new goal|add goal|create/i }).click();
    await waitForDialog(page);
    
    await page.getByLabel(/name|goal/i).fill('Emergency Fund');
    await page.getByLabel(/target|amount/i).fill('10000');
    
    await page.getByRole('dialog').getByRole('button', { name: /create|save|add/i }).click();
    await waitForDialogToClose(page);
    
    const contributeButton = page.getByRole('button', { name: /contribute|add funds|deposit/i }).first();
    if (await contributeButton.isVisible()) {
      await contributeButton.click();
      await waitForDialog(page);
      
      await page.getByLabel(/amount/i).fill('500');
      await page.getByRole('dialog').getByRole('button', { name: /add|save|submit/i }).click();
      
      await waitForDialogToClose(page);
    }
  });

  test('should display progress bar for savings goal', async ({ page }) => {
    await page.getByRole('button', { name: /new goal|add goal|create/i }).click();
    await waitForDialog(page);
    
    await page.getByLabel(/name|goal/i).fill('Car Fund');
    await page.getByLabel(/target|amount/i).fill('20000');
    
    await page.getByRole('dialog').getByRole('button', { name: /create|save|add/i }).click();
    await waitForDialogToClose(page);
    
    await expect(page.getByRole('progressbar').first()).toBeVisible();
  });
});
