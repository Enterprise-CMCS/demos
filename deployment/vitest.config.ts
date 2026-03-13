import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["**/build/**", "**/eslint-rules/**", "**/node_modules/**"],      
    },    
    include: ["./**/*.test.ts"],
    watch: false,    
    silent: false,
    clearMocks: true,
  },
});

// Set default timezone for tests to UTC to avoid timezone-related test failures
process.env.TZ = "UTC";
