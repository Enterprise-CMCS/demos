import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["**/build/**", "**/eslint-rules/**", "**/node_modules/**", "**/dist/**", "**/*.config.?s", "**/seeder.ts", "**/plugins/**"],      
    },    
    include: ["src/**/*.test.ts"],
    watch: false,    
    silent: false,
    clearMocks: true,
  },
});

// Set default timezone for tests to UTC to avoid timezone-related test failures
process.env.TZ = "UTC";
