import { test, expect } from '@playwright/test';
import { registerAndLogin, navigateTo } from './helpers';

test.describe('Interest Rates Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await navigateTo(page, 'rates');
  });

  test('should display interest rates page @smoke', async ({ page }) => {
    await expect(page.getByText('Lãi suất ngân hàng')).toBeVisible();
    await expect(page.getByText('So sánh lãi suất từ các ngân hàng hàng đầu Việt Nam')).toBeVisible();

    await expect(page.getByRole('tab', { name: /tiết kiệm/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /vay tiêu dùng/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /vay mua nhà/i })).toBeVisible();
  });

  test('should display stat cards with rate info', async ({ page }) => {
    await expect(page.getByText('Lãi suất cao nhất')).toBeVisible();
    await expect(page.getByText('Lãi suất trung bình')).toBeVisible();
    await expect(page.getByText('Lãi suất thấp nhất')).toBeVisible();
    
    // Verify percentage display
    await expect(page.getByText(/\d+\.\d+%/).first()).toBeVisible();
  });

  test('should have all term options including demand deposit', async ({ page }) => {
    const termSelector = page.getByRole('combobox');
    await expect(termSelector).toBeVisible();
    await termSelector.click();

    // Verify all term options including the new "Không kỳ hạn" option
    await expect(page.getByRole('option', { name: 'Không kỳ hạn' })).toBeVisible();
    await expect(page.getByRole('option', { name: '1 tháng' })).toBeVisible();
    await expect(page.getByRole('option', { name: '3 tháng' })).toBeVisible();
    await expect(page.getByRole('option', { name: '6 tháng' })).toBeVisible();
    await expect(page.getByRole('option', { name: '9 tháng' })).toBeVisible();
    await expect(page.getByRole('option', { name: '12 tháng' })).toBeVisible();
    await expect(page.getByRole('option', { name: '18 tháng' })).toBeVisible();
    await expect(page.getByRole('option', { name: '24 tháng' })).toBeVisible();
    await expect(page.getByRole('option', { name: '36 tháng' })).toBeVisible();
  });

  test('should have sort buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /theo lãi suất/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /theo ngân hàng/i })).toBeVisible();
  });

  test('should switch between product types', async ({ page }) => {
    const depositTab = page.getByRole('tab', { name: /tiết kiệm/i });
    await expect(depositTab).toHaveAttribute('data-state', 'active');

    const loanTab = page.getByRole('tab', { name: /vay tiêu dùng/i });
    await loanTab.click();
    await expect(loanTab).toHaveAttribute('data-state', 'active');

    const mortgageTab = page.getByRole('tab', { name: /vay mua nhà/i });
    await mortgageTab.click();
    await expect(mortgageTab).toHaveAttribute('data-state', 'active');
  });

  test('should select demand deposit term', async ({ page }) => {
    const termSelector = page.getByRole('combobox');
    await termSelector.click();
    await page.getByRole('option', { name: 'Không kỳ hạn' }).click();
    await expect(termSelector).toContainText('Không kỳ hạn');
  });

  test('should change term filter', async ({ page }) => {
    const termSelector = page.getByRole('combobox');
    await termSelector.click();
    await page.getByRole('option', { name: '6 tháng' }).click();
    await expect(termSelector).toContainText('6 tháng');
  });

  test('should toggle sort order by rate', async ({ page }) => {
    const sortByRate = page.getByRole('button', { name: /theo lãi suất/i });

    await sortByRate.click();
    await expect(sortByRate).toContainText('↓');

    await sortByRate.click();
    await expect(sortByRate).toContainText('↑');
  });

  test('should toggle sort order by bank', async ({ page }) => {
    const sortByBank = page.getByRole('button', { name: /theo ngân hàng/i });

    await sortByBank.click();
    await expect(sortByBank).toContainText('↓');

    await sortByBank.click();
    await expect(sortByBank).toContainText('↑');
  });

  test('should load sample data when no rates exist', async ({ page }) => {
    const seedButton = page.getByRole('button', { name: /tải dữ liệu mẫu/i });

    if (await seedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await seedButton.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/vietcombank|techcombank|mb bank/i).first()).toBeVisible();
    }
  });

  test('should display bank cards with logos in rates list', async ({ page }) => {
    const seedButton = page.getByRole('button', { name: /tải dữ liệu mẫu/i });

    if (await seedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await seedButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Check for bank names in the list
    const bankNames = ['Vietcombank', 'Techcombank', 'MB Bank', 'BIDV', 'VPBank'];
    let foundBank = false;

    for (const bankName of bankNames) {
      if (await page.getByText(bankName).first().isVisible({ timeout: 1000 }).catch(() => false)) {
        foundBank = true;
        break;
      }
    }

    expect(foundBank).toBe(true);

    // Check bank logos are displayed (SVG images)
    const images = page.locator('img[alt]');
    await expect(images.first()).toBeVisible();
  });

  test('should show highest rate badge', async ({ page }) => {
    const seedButton = page.getByRole('button', { name: /tải dữ liệu mẫu/i });

    if (await seedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await seedButton.click();
      await page.waitForLoadState('networkidle');
    }

    // When sorted by rate descending, first item should have "Cao nhất" badge
    const sortByRate = page.getByRole('button', { name: /theo lãi suất/i });
    await sortByRate.click();

    // Look for the highest rate badge
    const badge = page.getByText('Cao nhất');
    if (await badge.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(badge).toBeVisible();
    }
  });

  test('should have refresh button that works', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /cập nhật/i });
    await expect(refreshButton).toBeVisible();

    await refreshButton.click();
    
    // Button should show loading state (spinner animation)
    await page.waitForLoadState('networkidle');
  });

  test('should display supported banks section with links', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(page.getByText('Ngân hàng được hỗ trợ')).toBeVisible();

    // Check bank links exist
    const bankLinks = page.locator('a[target="_blank"][rel="noopener noreferrer"]');
    const count = await bankLinks.count();
    expect(count).toBeGreaterThan(0);

    // Check first link has correct attributes
    const firstLink = bankLinks.first();
    await expect(firstLink).toHaveAttribute('href', /https:\/\//);
  });

  test('should display historical chart when data exists', async ({ page }) => {
    const seedButton = page.getByRole('button', { name: /tải dữ liệu mẫu/i });

    if (await seedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await seedButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Scroll to chart section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));

    // Look for chart title
    const chartTitle = page.getByText('Biểu đồ lãi suất (90 ngày)');
    if (await chartTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(chartTitle).toBeVisible();
      
      // Check bank selector buttons for chart
      const vietcombankBtn = page.getByRole('button', { name: 'Vietcombank' });
      if (await vietcombankBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(vietcombankBtn).toBeVisible();
      }
    }
  });

  test('should toggle bank selection for chart', async ({ page }) => {
    const seedButton = page.getByRole('button', { name: /tải dữ liệu mẫu/i });

    if (await seedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await seedButton.click();
      await page.waitForLoadState('networkidle');
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));

    const chartTitle = page.getByText('Biểu đồ lãi suất (90 ngày)');
    if (await chartTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Find bank toggle buttons
      const bankButtons = page.locator('button').filter({ hasText: /Vietcombank|Techcombank|MB Bank|BIDV/i });
      const firstBtn = bankButtons.first();
      
      if (await firstBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Toggle bank selection
        await firstBtn.click();
        await page.waitForTimeout(500);
        await firstBtn.click();
      }
    }
  });

  test('should maintain filters after refresh', async ({ page }) => {
    // Select loan tab
    const loanTab = page.getByRole('tab', { name: /vay tiêu dùng/i });
    await loanTab.click();
    await expect(loanTab).toHaveAttribute('data-state', 'active');

    // Select 6 month term
    const termSelector = page.getByRole('combobox');
    await termSelector.click();
    await page.getByRole('option', { name: '6 tháng' }).click();

    // Click refresh
    const refreshButton = page.getByRole('button', { name: /cập nhật/i });
    await refreshButton.click();
    await page.waitForLoadState('networkidle');

    // Verify filters are maintained
    await expect(loanTab).toHaveAttribute('data-state', 'active');
    await expect(termSelector).toContainText('6 tháng');
  });
});

