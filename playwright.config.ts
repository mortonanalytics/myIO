import { defineConfig, devices } from "@playwright/test";

// E2E config for the myIO htmlwidget bundle.
//
// The webgl-scatter-1M spec loads the built inst/htmlwidgets/myIO/myIOapi.js,
// so this suite is the only guard that exercises the minified PRODUCTION
// bundle (vitest imports src/ directly and cannot catch minification bugs).
//
// Every spec is self-contained: it spins up its own node http server rooted at
// process.cwd() and serves fixtures + modules over http. No external web server
// or global baseURL is needed, which keeps the suite dependency-free in CI.
export default defineConfig({
  testDir: "./tests/playwright",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
