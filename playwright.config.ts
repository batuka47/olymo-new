import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Browser tests against a production build: `npm run build`, then `npm run test:e2e` starts the
// app (or uses one already running on E2E_BASE_URL). Supabase must be running; see README.
loadEnvConfig(process.cwd());

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "e2e",
  // The smoke tests sign in and write to the database; one at a time keeps them predictable.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL,
    locale: "mn-MN",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
