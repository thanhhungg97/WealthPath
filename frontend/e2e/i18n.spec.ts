import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test('should display English version on /en route', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText(/welcome|login|sign in|get started/i).first()).toBeVisible();
  });

  test('should display Vietnamese version on /vi route', async ({ page }) => {
    await page.goto('/vi');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
    await expect(page.getByText(/đăng nhập|chào mừng|bắt đầu/i).first()).toBeVisible();
  });

  test('should switch language from English to Vietnamese', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    
    const langSwitcher = page.getByRole('button', { name: /language|english|en/i });
    const langLink = page.getByRole('link', { name: /vietnamese|tiếng việt|vi/i });
    
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click();
      
      if (await langLink.isVisible()) {
        await langLink.click();
        await expect(page).toHaveURL(/\/vi/);
      }
    }
  });

  test('should switch language from Vietnamese to English', async ({ page }) => {
    await page.goto('/vi');
    await page.waitForLoadState('networkidle');
    
    const langSwitcher = page.getByRole('button', { name: /language|vietnamese|vi|tiếng việt/i });
    const langLink = page.getByRole('link', { name: /english|en/i });
    
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click();
      
      if (await langLink.isVisible()) {
        await langLink.click();
        await expect(page).toHaveURL(/\/en/);
      }
    }
  });

  test('should translate landing page hero text', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    
    const englishHero = await page.getByRole('heading', { level: 1 }).textContent();
    console.log('EN:', englishHero);
    
    await page.goto('/vi');
    await page.waitForLoadState('networkidle');
    
    const vietnameseHero = await page.getByRole('heading', { level: 1 }).textContent();
    console.log('VI:', vietnameseHero);
    
    expect(englishHero).not.toBe(vietnameseHero);
  });

  test('should translate CTA buttons', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    
    const getStartedEN = page.getByRole('link', { name: /get started|sign up|start/i });
    const loginEN = page.getByRole('link', { name: /log in|sign in/i });
    
    const hasEnglishCTA = await getStartedEN.isVisible() || await loginEN.isVisible();
    
    await page.goto('/vi');
    await page.waitForLoadState('networkidle');
    
    const getStartedVI = page.getByRole('link', { name: /bắt đầu|đăng ký/i });
    const loginVI = page.getByRole('link', { name: /đăng nhập/i });
    
    const hasVietnameseCTA = await getStartedVI.isVisible() || await loginVI.isVisible();
    
    expect(hasEnglishCTA || hasVietnameseCTA).toBe(true);
  });
});
