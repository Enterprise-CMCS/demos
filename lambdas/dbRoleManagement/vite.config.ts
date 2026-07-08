/// <reference types="vitest" />

process.env.STAGE = "unit-test";
process.env.REGION = "us-east-1";
process.env.DATABASE_SECRET_ARN = "fake-secret"; // pragma: allowlist secret

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
