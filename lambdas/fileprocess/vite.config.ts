/// <reference types="vitest" />

import { defineConfig } from "vitest/config";

process.env.CLEAN_BUCKET = "mock-clean-bucket";
process.env.UPLOAD_BUCKET = "mock-upload-bucket";
process.env.INFECTED_BUCKET = "mock-infected-bucket";
process.env.BUDGET_NEUTRALITY_QUEUE_URL =
  "http://localhost.localstack.cloud:4566/000000000000/budget-neutrality-queue";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
