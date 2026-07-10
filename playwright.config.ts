import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  globalSetup: "./e2e/global-setup.ts",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  outputDir: "e2e-results",
  reporter: [["list"]],
  webServer: {
    command: "node scripts/e2e-start.mjs",
    url: "http://localhost:3000",
    timeout: 120_000,
    env: {
      DATABASE_URL: "file:./e2e-smoke.db",
      AUTH_SECRET: "e2e-smoke-secret-32chars-minimo",
      AUTH_TRUST_HOST: "true",
    },
  },
});
