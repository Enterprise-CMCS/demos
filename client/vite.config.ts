/// <reference types="vitest" />
import { execSync } from "child_process";
import { defineConfig } from "vitest/config";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

const getGitCommit = (): string => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
};

export const config = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    __GIT_COMMIT__: JSON.stringify(getGitCommit()),
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
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["node_modules", "dist", "vite.config.ts", "src/pages/debug/**"],
    },
  },
});

export default config;
