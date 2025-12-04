/// <reference types="vitest" />

import { defineConfig } from "vitest/config";

process.env.CLEAN_BUCKET = "mock-clean-bucket";
process.env.UPLOAD_BUCKET = "mock-upload-bucket";
process.env.INFECTED_BUCKET = "mock-infected-bucket";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
