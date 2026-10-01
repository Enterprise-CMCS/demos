import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabaseConfigMock: vi.fn(),
  poolCtorMock: vi.fn(),
  logInfoMock: vi.fn(),
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

import { getDbPool } from "./db";

describe("budgetNeutrality db", () => {
  beforeEach(() => {
    process.env = { ...prevEnv };
    delete process.env.DATABASE_SECRET_ARN;
    delete process.env.DB_SSL_MODE;
    delete process.env.BYPASS_SSL;
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
      SecretString: JSON.stringify({
        user: "dbuser",
        password: "dbpass", // pragma: allowlist secret
        host: "db-host",
        port: 5432,
        database: "demo",
      }),
    });

    const firstPool = await getDbPool();
    const secondPool = await getDbPool();

    expect(firstPool).toBe(secondPool);
    expect(mocks.getDatabaseConfigMock).toHaveBeenCalledTimes(1);
    expect(mocks.poolCtorMock).toHaveBeenCalledTimes(1);
    expect(mocks.logInfoMock).toHaveBeenCalledTimes(1);
  });
});
