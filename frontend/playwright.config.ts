import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced retries for faster CI
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000, // 30 seconds per test (increased for slow remote server)
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  // In CI, only run tests tagged with @smoke unless FULL_SUITE is set
  grep: process.env.CI && !process.env.FULL_SUITE ? /@smoke/ : undefined,
  use: {
    baseURL: process.env.BASE_URL || 'https://wealthpath.duckdns.org',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000, // 15 seconds for actions
    navigationTimeout: 15000, // 15 seconds for navigation
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

