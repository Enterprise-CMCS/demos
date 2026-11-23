import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["./demosctl/commands/__fixtures__/dataFix.integration.test.ts"],
    testTimeout: 180_000,
    hookTimeout: 15_000,
    fileParallelism: false,
    watch: false,
    silent: false,
  },
});
