import { Page, expect } from '@playwright/test';

/**
 * Generates a unique test email address using timestamp.
 * @param prefix - Prefix for the email (default: 'test')
 * @returns Unique email address
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}+${Date.now()}@example.com`;
}

export const TEST_PASSWORD = 'testpassword123';
export const TEST_NAME = 'Test User';

/**
 * Registers a new user and logs them in.
 * @param page - Playwright page object
 * @param emailPrefix - Prefix for the generated email
 * @returns The generated email address
 */
export async function registerAndLogin(page: Page, emailPrefix: string = 'test'): Promise<string> {
  const email = generateTestEmail(emailPrefix);
  
  await page.goto('/en/register');
  
  await page.getByLabel(/name/i).fill(TEST_NAME);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  
  await page.getByRole('button', { name: /create account|sign up|register/i }).click();
  
  await expect(page).toHaveURL(/dashboard/);
  await page.waitForLoadState('networkidle');
  
  return email;
}

/**
 * Waits for a dialog to be visible.
 * @param page - Playwright page object
 */
export async function waitForDialog(page: Page): Promise<void> {
  await expect(page.getByRole('dialog')).toBeVisible();
}

/**
 * Waits for a dialog to close.
 * @param page - Playwright page object
 */
export async function waitForDialogToClose(page: Page): Promise<void> {
  await expect(page.getByRole('dialog')).not.toBeVisible();
}

/**
 * Selects the first option from a Shadcn Select component.
 * @param page - Playwright page object
 * @param triggerText - Optional text to identify the select trigger
 */
export async function selectFirstOption(page: Page, triggerText?: string | RegExp): Promise<void> {
  const dialog = page.getByRole('dialog');
  
  const trigger = triggerText 
    ? dialog.getByRole('combobox', { name: triggerText })
    : dialog.getByRole('combobox').first();
  
  await trigger.click();
  await page.getByRole('option').first().click();
}

/**
 * Navigates to a page using sidebar link or direct navigation.
 * @param page - Playwright page object
 * @param path - The path to navigate to
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Fills a form field by label.
 * @param page - Playwright page object
 * @param label - Label text or regex
 * @param value - Value to fill
 */
export async function fillField(page: Page, label: string | RegExp, value: string): Promise<void> {
  await page.getByLabel(label).fill(value);
}

/**
 * Clicks a button by text.
 * @param page - Playwright page object
 * @param text - Button text or regex
 */
export async function clickButton(page: Page, text: string | RegExp): Promise<void> {
  await page.getByRole('button', { name: text }).click();
}
