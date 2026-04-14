import { afterEach, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalArgv = [...process.argv];
const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const prismaConfigUrl = pathToFileURL(path.resolve(currentDir, "../prisma.config.ts")).href;

async function importPrismaConfig() {
  vi.resetModules();
  return import(/* @vite-ignore */ prismaConfigUrl);
}

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
  process.argv = [...originalArgv];
});

describe("prisma.config", () => {
  it("uses DATABASE_URL when present", async () => {
    process.env.DATABASE_URL = "postgresql://db.example:5432/demos?schema=demos_app";
    process.argv = ["node", "prisma", "migrate", "status"];

    const mod = await importPrismaConfig();
    expect(mod.default.datasource?.url).toBe(process.env.DATABASE_URL);
  }, 20000);

  it("allows prisma generate without DATABASE_URL", async () => {
    delete process.env.DATABASE_URL;
    process.argv = ["node", "prisma", "generate"];

    const mod = await importPrismaConfig();
    expect(mod.default.datasource?.url).toBe("postgresql://localhost:5432/demos?schema=demos_app");
  });

  it("throws for non-generate commands when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    process.argv = ["node", "prisma", "migrate", "status"];

    await expect(importPrismaConfig()).rejects.toThrow(
      "DATABASE_URL must be set for Prisma commands other than `prisma generate`."
    );
  });
});
