import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabaseConfigMock: vi.fn(),
  poolCtorMock: vi.fn(),
  logInfoMock: vi.fn(),
}));

vi.mock("./uipathClient", () => ({
  region: "us-east-1",
}));

vi.mock("demos-shared-library/database", () => {
  return { 
    getDatabaseConfig: mocks.getDatabaseConfigMock,
   };
});

vi.mock("pg", () => {
  class Pool {
    constructor(config: unknown) {
      mocks.poolCtorMock(config);
    }
  }

  return { Pool };
});

vi.mock("./log", () => ({
  log: {
    info: (...args: unknown[]) => mocks.logInfoMock(...args),
  },
}));

const prevEnv = { ...process.env };

import { __resetDbStateForTests, getDbPool, getDbSchema } from "./db";

describe("db", () => {
  beforeEach(() => {
    __resetDbStateForTests();
    process.env = { ...prevEnv };
    delete process.env.DATABASE_SECRET_ARN;
    delete process.env.DB_SSL_MODE;
    delete process.env.AWS_ENDPOINT_URL;
    mocks.getDatabaseConfigMock.mockReset();
    mocks.poolCtorMock.mockReset();
    mocks.logInfoMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it("creates pool once and reuses it", async () => {
    process.env.DATABASE_SECRET_ARN = "db-credentials-arn"; // pragma: allowlist secret
    mocks.getDatabaseConfigMock.mockResolvedValue({
      user: "demos_export",
      password: "not-a-real-password", // pragma: allowlist secret
      host: "unit.test.rds.host",
      port: 5432,
      database: "utdb",
      max: 2
    });
    const firstPool = await getDbPool();
    const secondPool = await getDbPool();

    expect(firstPool).toBe(secondPool);
    expect(mocks.getDatabaseConfigMock).toHaveBeenCalledTimes(1);
    expect(mocks.poolCtorMock).toHaveBeenCalledTimes(1);
    expect(mocks.poolCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
      user: "demos_export",
      password: "not-a-real-password", // pragma: allowlist secret
      host: "unit.test.rds.host",
      port: 5432,
      database: "utdb",
      max: 2
    })
    );
    expect(mocks.logInfoMock).toHaveBeenCalledTimes(1);
    expect(mocks.logInfoMock).toHaveBeenCalledWith("Connecting to database for UiPath results");
  });
});
