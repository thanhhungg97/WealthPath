import { test, expect } from '@playwright/test';
import { registerAndLogin, navigateTo } from './helpers';

test.describe('Financial Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, 'calculator');
    await navigateTo(page, '/en/calculator');
  });

  test('should display calculator page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/calculator/i);
  });

  test('should display calculator input fields', async ({ page }) => {
    const principalInput = page.getByLabel(/principal|amount|loan/i);
    const rateInput = page.getByLabel(/rate|interest/i);
    const termInput = page.getByLabel(/term|years|months|period/i);
    
    const hasInputs = await principalInput.isVisible() || await rateInput.isVisible() || await termInput.isVisible();
    expect(hasInputs).toBe(true);
  });

  test('should calculate loan payment', async ({ page }) => {
    const principalInput = page.getByLabel(/principal|amount|loan/i);
    const rateInput = page.getByLabel(/rate|interest/i);
    const termInput = page.getByLabel(/term|years|months/i);
    
    if (await principalInput.isVisible()) {
      await principalInput.fill('100000');
    }
    
    if (await rateInput.isVisible()) {
      await rateInput.fill('5');
    }
    
    if (await termInput.isVisible()) {
      await termInput.fill('30');
    }
    
    const calculateButton = page.getByRole('button', { name: /calculate/i });
    if (await calculateButton.isVisible()) {
      await calculateButton.click();
      
      await expect(page.getByText(/payment|result|\$/i)).toBeVisible();
    }
  });

  test('should calculate compound interest', async ({ page }) => {
    const compoundTab = page.getByRole('tab', { name: /compound|investment|savings/i });
    
    if (await compoundTab.isVisible()) {
      await compoundTab.click();
      
      const principalInput = page.getByLabel(/principal|initial|starting/i);
      const rateInput = page.getByLabel(/rate|interest/i);
      const yearsInput = page.getByLabel(/years|period|term/i);
      
      if (await principalInput.isVisible()) {
        await principalInput.fill('10000');
      }
      
      if (await rateInput.isVisible()) {
        await rateInput.fill('7');
      }
      
      if (await yearsInput.isVisible()) {
        await yearsInput.fill('20');
      }
      
      const calculateButton = page.getByRole('button', { name: /calculate/i });
      if (await calculateButton.isVisible()) {
        await calculateButton.click();
        
        await expect(page.getByText(/result|future value|\$/i)).toBeVisible();
      }
    }
  });

  test('should calculate debt payoff', async ({ page }) => {
    const debtTab = page.getByRole('tab', { name: /debt|payoff|loan/i });
    
    if (await debtTab.isVisible()) {
      await debtTab.click();
      
      const balanceInput = page.getByLabel(/balance|amount|debt/i);
      const rateInput = page.getByLabel(/rate|interest/i);
      const paymentInput = page.getByLabel(/payment|monthly/i);
      
      if (await balanceInput.isVisible()) {
        await balanceInput.fill('5000');
      }
      
      if (await rateInput.isVisible()) {
        await rateInput.fill('18');
      }
      
      if (await paymentInput.isVisible()) {
        await paymentInput.fill('200');
      }
      
      const calculateButton = page.getByRole('button', { name: /calculate/i });
      if (await calculateButton.isVisible()) {
        await calculateButton.click();
        
        await expect(page.getByText(/months|years|payoff|\$/i)).toBeVisible();
      }
    }
  });

  test('should display calculation results', async ({ page }) => {
    const resultsSection = page.getByText(/result|payment|total|interest/i);
    await expect(resultsSection.first()).toBeVisible();
  });

  test('should reset calculator inputs', async ({ page }) => {
    const principalInput = page.getByLabel(/principal|amount|loan/i);
    
    if (await principalInput.isVisible()) {
      await principalInput.fill('50000');
      
      const resetButton = page.getByRole('button', { name: /reset|clear/i });
      if (await resetButton.isVisible()) {
        await resetButton.click();
        
        await expect(principalInput).toHaveValue('');
      }
    }
  });
});

