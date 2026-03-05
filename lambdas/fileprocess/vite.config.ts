/// <reference types="vitest" />

import { defineConfig } from "vitest/config";

process.env.CLEAN_BUCKET = "mock-clean-bucket";
process.env.UPLOAD_BUCKET = "mock-upload-bucket";
process.env.INFECTED_BUCKET = "mock-infected-bucket";
process.env.GRAPHQL_ENDPOINT = "http://mock-graphql-endpoint/graphql";
process.env.BN_NOTEBOOK_VALIDATION_QUEUE_URL = "http://mock-sqs/queue/bn-notebook-validation";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
