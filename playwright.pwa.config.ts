import { defineConfig, devices } from '@playwright/test'

const basePath = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  testDir: './e2e',
  testMatch: /pwa\.spec\.ts/,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'PWA Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node scripts/serve-pwa-preview.mjs',
    url: `http://127.0.0.1:4175${basePath}`,
    reuseExistingServer: false,
  },
})
