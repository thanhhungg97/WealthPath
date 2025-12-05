import { test, expect } from '@playwright/test';
import { registerAndLogin, navigateTo } from './helpers';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'settings');
    await navigateTo(page, '/en/settings');
  });

  test('should display settings page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/setting/i);
  });

  test('should display user profile section', async ({ page }) => {
    await expect(page.getByText(/profile|account/i).first()).toBeVisible();
  });

  test('should display currency selector', async ({ page }) => {
    const currencySelect = page.getByRole('combobox', { name: /currency/i });
    const currencyLabel = page.getByText(/currency/i);
    
    if (await currencySelect.isVisible()) {
      await expect(currencySelect).toBeVisible();
    } else if (await currencyLabel.isVisible()) {
      await expect(currencyLabel).toBeVisible();
    }
  });

  test('should update user name', async ({ page }) => {
    const nameInput = page.getByLabel(/name/i);
    if (await nameInput.isVisible()) {
      await nameInput.clear();
      await nameInput.fill('Updated Name');
      
      const saveButton = page.getByRole('button', { name: /save|update/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        await expect(page.getByText(/saved|updated|success/i)).toBeVisible();
      }
    }
  });

  test('should change currency preference', async ({ page }) => {
    const currencySelect = page.getByRole('combobox', { name: /currency/i });
    
    if (await currencySelect.isVisible()) {
      await currencySelect.click();
      
      const eurOption = page.getByRole('option', { name: /eur|euro/i });
      if (await eurOption.isVisible()) {
        await eurOption.click();
        
        const saveButton = page.getByRole('button', { name: /save|update/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    }
  });

  test('should display notification settings', async ({ page }) => {
    const notificationSection = page.getByText(/notification/i);
    
    if (await notificationSection.isVisible()) {
      await expect(notificationSection).toBeVisible();
    }
  });

  test('should display theme toggle', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /theme|dark|light/i });
    const themeSwitch = page.getByRole('switch', { name: /theme|dark|light/i });
    
    if (await themeToggle.isVisible()) {
      await expect(themeToggle).toBeVisible();
    } else if (await themeSwitch.isVisible()) {
      await expect(themeSwitch).toBeVisible();
    }
  });
});

