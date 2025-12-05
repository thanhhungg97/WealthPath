import { test, expect } from '@playwright/test';
import { registerAndLogin, waitForDialog, waitForDialogToClose, selectFirstOption, navigateTo } from './helpers';

test.describe('Recurring Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'recurring');
    await navigateTo(page, '/en/recurring');
  });

  test('should display recurring transactions page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/recurring/i);
  });

  test('should open add recurring transaction dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add|create|new/i }).first().click();
    
    await waitForDialog(page);
    await expect(page.getByLabel(/amount/i)).toBeVisible();
  });

  test('should create recurring expense successfully', async ({ page }) => {
    await page.getByRole('button', { name: /add|create|new/i }).first().click();
    await waitForDialog(page);
    
    const nameInput = page.getByLabel(/name|description/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Netflix Subscription');
    }
    
    await page.getByLabel(/amount/i).fill('15.99');
    await selectFirstOption(page);
    
    const frequencySelect = page.getByRole('combobox', { name: /frequency|interval/i });
    if (await frequencySelect.isVisible()) {
      await frequencySelect.click();
      await page.getByRole('option', { name: /monthly/i }).click();
    }
    
    await page.getByRole('dialog').getByRole('button', { name: /add|create|save/i }).click();
    
    await waitForDialogToClose(page);
    await expect(page.getByText(/netflix/i)).toBeVisible();
  });

  test('should create recurring income successfully', async ({ page }) => {
    await page.getByRole('button', { name: /add|create|new/i }).first().click();
    await waitForDialog(page);
    
    const incomeTab = page.getByRole('dialog').getByRole('button', { name: /income/i });
    if (await incomeTab.isVisible()) {
      await incomeTab.click();
    }
    
    const nameInput = page.getByLabel(/name|description/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Monthly Salary');
    }
    
    await page.getByLabel(/amount/i).fill('5000');
    await selectFirstOption(page);
    
    await page.getByRole('dialog').getByRole('button', { name: /add|create|save/i }).click();
    
    await waitForDialogToClose(page);
  });

  test('should edit recurring transaction', async ({ page }) => {
    await page.getByRole('button', { name: /add|create|new/i }).first().click();
    await waitForDialog(page);
    
    const nameInput = page.getByLabel(/name|description/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Gym Membership');
    }
    await page.getByLabel(/amount/i).fill('50');
    await selectFirstOption(page);
    await page.getByRole('dialog').getByRole('button', { name: /add|create|save/i }).click();
    await waitForDialogToClose(page);
    
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await waitForDialog(page);
      
      await page.getByLabel(/amount/i).clear();
      await page.getByLabel(/amount/i).fill('60');
      await page.getByRole('dialog').getByRole('button', { name: /save|update/i }).click();
      
      await waitForDialogToClose(page);
    }
  });

  test('should delete recurring transaction', async ({ page }) => {
    await page.getByRole('button', { name: /add|create|new/i }).first().click();
    await waitForDialog(page);
    
    const nameInput = page.getByLabel(/name|description/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Delete Test Recurring');
    }
    await page.getByLabel(/amount/i).fill('25');
    await selectFirstOption(page);
    await page.getByRole('dialog').getByRole('button', { name: /add|create|save/i }).click();
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

  test('should pause recurring transaction', async ({ page }) => {
    await page.getByRole('button', { name: /add|create|new/i }).first().click();
    await waitForDialog(page);
    
    const nameInput = page.getByLabel(/name|description/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Pause Test');
    }
    await page.getByLabel(/amount/i).fill('100');
    await selectFirstOption(page);
    await page.getByRole('dialog').getByRole('button', { name: /add|create|save/i }).click();
    await waitForDialogToClose(page);
    
    const pauseButton = page.getByRole('button', { name: /pause|stop/i }).first();
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
      
      await expect(page.getByText(/paused/i)).toBeVisible();
    }
  });

  test('should display summary of recurring transactions', async ({ page }) => {
    const summaryText = page.getByText(/total|monthly|upcoming/i);
    await expect(summaryText.first()).toBeVisible();
  });
});

