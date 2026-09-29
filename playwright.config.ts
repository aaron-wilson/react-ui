import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  testDir: "./e2e",
  retries: 0,
  use: { baseURL: "http://127.0.0.1:3001", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: "bun --no-env-file src/server.ts",
      cwd: resolve(root, "../rest-api"),
      url: "http://127.0.0.1:3000/health",
      env: { APP_MODE: "demo", PROVIDER_STORE: "memory", RATE_LIMIT_PER_MINUTE: "10000" },
      reuseExistingServer: false,
    },
    {
      command: "node_modules/.bin/tsc -p tsconfig.json && node dist/src/server.js",
      cwd: resolve(root, "../graph-api"),
      url: "http://127.0.0.1:4000/health",
      env: {
        APP_MODE: "demo",
        REST_URL: "http://127.0.0.1:3000",
        CORS_ORIGIN: "http://127.0.0.1:3001",
        DOTENV_CONFIG_PATH: "/dev/null",
      },
      reuseExistingServer: false,
    },
    {
      command: "node scripts/serve-static.mjs",
      cwd: root,
      url: "http://127.0.0.1:3001/",
      reuseExistingServer: false,
    },
  ],
});
