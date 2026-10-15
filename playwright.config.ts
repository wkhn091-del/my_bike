import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Runs against a production build with no database, Sanity or Cardcom configured:
 * the site must fall back to confirmed content and a closed-sales waitlist, never crash.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "he-IL",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/api/ics`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: {
      PAYMENTS_MODE: "mock",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      DATABASE_URL: "",
      SANITY_PROJECT_ID: "",
    },
  },
});
