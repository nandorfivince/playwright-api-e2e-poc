import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
  ],

  use: {
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },

  projects: [
    {
      name: 'rest-api',
      testDir: './tests/rest',
      use: {
        baseURL: process.env.BASE_URL_REST || 'https://jsonplaceholder.typicode.com',
      },
    },
    {
      name: 'graphql-api',
      testDir: './tests/graphql',
      use: {
        baseURL: process.env.BASE_URL_GRAPHQL || 'https://countries.trevorblades.com/graphql',
      },
    },
  ],
});
