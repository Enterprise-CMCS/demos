/// <reference types="vitest" />
import { execSync } from "child_process";
import { defineConfig } from "vitest/config";
import semver from "semver";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

const DEMOS_VERSION = "1.0.0";

const getGitCommit = (): string => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
};

export const config = defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    // Keep these in sync with declare const statements in src/vite-env.d.ts
    __GIT_COMMIT__: JSON.stringify(getGitCommit()),
    __DEMOS_VERSION__: JSON.stringify(DEMOS_VERSION),
    __FEATURE_SHOW_GIT_VERSION__: JSON.stringify(
      semver.gt(DEMOS_VERSION, "1.0.0") && mode === "development"
    ),
  },
  server: {
    port: 3000,
    // Proxy /graphql requests to the server running on port 4000 to avoid CORS issues
    proxy: {
      "/graphql": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}", "vite.config.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["node_modules", "dist", "vite.config.ts", "src/pages/debug/**"],
    },
  },
}));

export default config;
