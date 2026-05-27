// playwright.config.js — Playwright Test Configuration
//
// This file configures how Playwright runs your UI automation tests.
// Playwright can test real browsers (Chromium, Firefox, WebKit).

const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  // Where to find all test files
  testDir: "./tests/ui",

  // Stop after first failure during CI (remove for local dev)
  // failOnFlaky: true,

  // Retry failed tests once (useful for flaky network tests)
  retries: 1,

  // Timeout for each test (30 seconds)
  timeout: 30_000,

  // Reporter — "html" generates a nice visual report
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],

  use: {
    // Base URL for all page.goto("/login") calls
    baseURL: "http://localhost:3000",

    // Capture screenshots only on failure
    screenshot: "only-on-failure",

    // Record video on failure for debugging
    trace: "on-first-retry",

    // Extra HTTP headers for API calls
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Uncomment to test other browsers:
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit",  use: { ...devices["Desktop Safari"] }  },
  ],

  // Start the server before tests run, stop it after
  webServer: {
    command: "node src/server.js",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: !process.env.CI, // reuse if already running locally
    stdout: "ignore",
    stderr: "pipe",
    timeout: 10_000,
  },
});
