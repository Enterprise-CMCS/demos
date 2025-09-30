/// <reference types="vitest" />

import { defineConfig } from "vitest/config";

process.env.CLEAN_BUCKET = "mock-clean-bucket";
process.env.UPLOAD_BUCKET = "mock-upload-bucket";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
