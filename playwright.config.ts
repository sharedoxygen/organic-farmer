import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './automation',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3005',
    trace: 'on-first-retry',
    extraHTTPHeaders: async ({}, use) => {
      await use({});
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});



