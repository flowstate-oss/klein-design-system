import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: "http://127.0.0.1:61001",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview -w @klein-ui/docs -- --port 61001 --ignore-lock",
    url: "http://127.0.0.1:61001",
    reuseExistingServer: false,
  },
});
