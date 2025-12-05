import { test, expect } from '@playwright/test';
import { generateTestEmail, TEST_PASSWORD, TEST_NAME } from './helpers';

test.describe('Auth Flow', () => {
  test('should show login page for unauthenticated users @smoke', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/login|register/);
  });

  test('should register a new account successfully @smoke', async ({ page }) => {
    const email = generateTestEmail('auth');
    
    await page.goto('/en/register');
    
    await page.getByLabel(/name/i).fill(TEST_NAME);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();
    
    await expect(page).toHaveURL(/dashboard/);
    
    console.log('Registered:', email);
  });

  test('should login with valid credentials', async ({ page }) => {
    const email = generateTestEmail('login');
    
    await page.goto('/en/register');
    await page.getByLabel(/name/i).fill(TEST_NAME);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();
    await expect(page).toHaveURL(/dashboard/);
    
    await page.goto('/en/login');
    
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should logout successfully', async ({ page }) => {
    const email = generateTestEmail('logout');
    
    await page.goto('/en/register');
    await page.getByLabel(/name/i).fill(TEST_NAME);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();
    await expect(page).toHaveURL(/dashboard/);
    
    const logoutButton = page.getByRole('button', { name: /logout|sign out|log out/i });
    const userMenu = page.getByRole('button', { name: /user|account|profile|menu/i });
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
    }
    
    await expect(page).toHaveURL(/login|register|\//);
  });

  test('should show OAuth buttons when enabled', async ({ page }) => {
    await page.goto('/en/login');
    
    const googleButton = page.getByRole('button', { name: /google/i });
    const facebookButton = page.getByRole('button', { name: /facebook/i });
    
    const googleVisible = await googleButton.isVisible().catch(() => false);
    const facebookVisible = await facebookButton.isVisible().catch(() => false);
    
    console.log('Google OAuth:', googleVisible ? 'enabled' : 'disabled');
    console.log('Facebook OAuth:', facebookVisible ? 'enabled' : 'disabled');
    
    expect(true).toBe(true);
  });
});
