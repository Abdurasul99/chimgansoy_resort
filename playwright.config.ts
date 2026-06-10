import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config: runs E2E + responsive tests against the LIVE production
 * site at https://chimgandarbaza.uz across mobile/tablet/desktop viewports.
 *
 * Three projects → same tests run 3 times, one per device class.
 * Sequential workers (workers:1) so we don't trip Vercel's edge rate-limit.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // sequential — gentle on Vercel
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://chimgandarbaza.uz",
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
  },
  // All projects use Chromium (faster, single download). We borrow ONLY the
  // viewport + UA + isMobile flag from device descriptors; force browser =
  // chromium for portability and avoid downloading WebKit/Firefox.
  projects: [
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
      },
    },
    {
      name: "tablet",
      use: {
        browserName: "chromium",
        ...devices["iPad (gen 7)"],
        defaultBrowserType: "chromium",
      },
    },
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        isMobile: false,
      },
    },
  ],
});
