import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "**/build/**",
        "**/eslint-rules/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/*.config.?s",
        "**/seeder.ts",
        "**/plugins/**",
        "src/constants.ts",
        "src/adapters/s3/LocalS3Adapter.ts",
        "src/local-server.ts",
        "src/refreshDbObjects.ts",
      ],
    },
    include: ["src/**/*.test.ts"],
    watch: false,
    silent: false,
    clearMocks: true,
  },
});

// Tests run in `dev` environment to avoid test failures because of feature flags
process.env.CURRENT_ENV = "dev";

// Set default timezone for tests to UTC to avoid timezone-related test failures
process.env.TZ = "UTC";
