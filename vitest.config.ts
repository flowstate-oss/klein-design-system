import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx,mjs}"],
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: [{find:/^@klein-ui\/react$/,replacement:new URL('./packages/react/src/index.ts',import.meta.url).pathname}],
  },
});
