import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabaseConfigMock: vi.fn(),
  poolConstructor: vi.fn(),
}));

vi.mock("demos-shared-library/database", () => {
  return { 
    getDatabaseConfig: mocks.getDatabaseConfigMock,
   };
});

vi.mock("pg", () => ({
  Pool: class {
    constructor(config: unknown) {
      mocks.poolConstructor(config);
    }
  },
}));

vi.mock("./log", () => ({
  log: { info: vi.fn() },
}));

import { __resetDbStateForTests, getDbPool, getDbSchema } from "./db";

const originalEnv = { ...process.env };

describe("emailer database connection", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.DATABASE_SECRET_ARN = "database-secret"; // pragma: allowlist secret
    process.env.DB_SSL_MODE = "disable";
    delete process.env.DB_SSL_ROOT_CERT;
    __resetDbStateForTests();
    mocks.getDatabaseConfigMock.mockReset();
    mocks.poolConstructor.mockReset();
    mocks.getDatabaseConfigMock.mockResolvedValue({
      user: "demos_export",
      password: "not-a-real-password", // pragma: allowlist secret
      host: "unit.test.rds.host",
      port: 5432,
      database: "utdb",
      max: 2
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });
  
  it("creates one pool and reuses it", async () => {
    const firstPool = await getDbPool();
    const secondPool = await getDbPool();

    expect(firstPool).toBe(secondPool);
    expect(mocks.getDatabaseConfigMock).toHaveBeenCalledOnce();
    expect(mocks.poolConstructor).toHaveBeenCalledExactlyOnceWith({
      user: "demos_export",
      password: "not-a-real-password", // pragma: allowlist secret
      host: "unit.test.rds.host",
      port: 5432,
      database: "utdb",
      max: 2
    });
  });

  it("returns the emailer database schema", () => {
    expect(getDbSchema()).toBe("demos_app");
  });
});
