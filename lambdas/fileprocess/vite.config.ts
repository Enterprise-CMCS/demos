/// <reference types="vitest" />

import { defineConfig } from "vitest/config";

process.env.CLEAN_BUCKET = "mock-clean-bucket";
process.env.UPLOAD_BUCKET = "mock-upload-bucket";
process.env.INFECTED_BUCKET = "mock-infected-bucket";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ENDPOINT_URL = "http://localstack:4566";
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
