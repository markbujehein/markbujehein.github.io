import { defineConfig, devices } from "@playwright/test";

const port = 4399;

// Runs against the built site: `pnpm run e2e` builds first, then serves dist/. A plain static server is used
// because `astro preview` backgrounds itself outside a terminal, which a test runner cannot supervise.
// CHROMIUM_PATH points at a system Chromium; CI installs Playwright's own (`playwright install chromium`).
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: `python3 -m http.server ${port} --bind 127.0.0.1 --directory dist`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
