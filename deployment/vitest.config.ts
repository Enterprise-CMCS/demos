import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "./demosctl/commands/__fixtures__/dataFix.integration.test.ts",
    ],
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
process.env.CDK_VALIDATION = "false";
