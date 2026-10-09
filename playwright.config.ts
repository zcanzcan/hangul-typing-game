import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: [/tablet\.spec\.ts/, /pwa\.spec\.ts/, /mobile\.spec\.ts/],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: '휴대폰 390px Chromium',
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
    {
      name: '휴대폰 360px Chromium',
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 360, height: 800 },
        browserName: 'chromium',
      },
    },
    {
      name: 'iPad 세로',
      testMatch: /tablet\.spec\.ts/,
      use: { ...devices['iPad Pro 11'], browserName: 'chromium' },
    },
    {
      name: 'iPad 가로',
      testMatch: /tablet\.spec\.ts/,
      use: { ...devices['iPad Pro 11 landscape'], browserName: 'chromium' },
    },
    {
      name: '안드로이드 태블릿 세로',
      testMatch: /tablet\.spec\.ts/,
      use: { ...devices['Galaxy Tab S9'], browserName: 'chromium' },
    },
    {
      name: '안드로이드 태블릿 가로',
      testMatch: /tablet\.spec\.ts/,
      use: { ...devices['Galaxy Tab S9 landscape'], browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    },
  },
})
