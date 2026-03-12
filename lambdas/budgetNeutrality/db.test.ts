import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendMock: vi.fn(),
  poolCtorMock: vi.fn(),
  logInfoMock: vi.fn(),
}));

vi.mock("@aws-sdk/client-secrets-manager", () => {
  class SecretsManagerClient {
    send = mocks.sendMock;
  }

  class GetSecretValueCommand {
    constructor(public input: unknown) {}
  }

  return { SecretsManagerClient, GetSecretValueCommand };
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

import { __resetDbStateForTests, getDatabaseUrl, getDbPool, getDbSchema } from "./db";

describe("budgetNeutrality db", () => {
  beforeEach(() => {
    __resetDbStateForTests();
    process.env = { ...prevEnv };
    delete process.env.DATABASE_SECRET_ARN;
    delete process.env.DB_SSL_MODE;
    delete process.env.BYPASS_SSL;
    delete process.env.AWS_ENDPOINT_URL;
    mocks.sendMock.mockReset();
    mocks.poolCtorMock.mockReset();
    mocks.logInfoMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it("returns database url and caches it", async () => {
    process.env.DATABASE_SECRET_ARN = "test-db-credentials-arn"; // pragma: allowlist secret
    process.env.DB_SSL_MODE = "verify-full";
    mocks.sendMock.mockResolvedValue({
      SecretString: JSON.stringify({
        username: "dbuser",
        password: "dbpass", // pragma: allowlist secret
        host: "db-host",
        port: 5432,
        dbname: "demo",
      }),
    });

    const first = await getDatabaseUrl();
    const second = await getDatabaseUrl();

    expect(first).toContain("postgresql://");
    expect(first).toContain("@db-host:5432/demo?schema=demos_app&sslmode=verify-full");
    expect(second).toBe(first);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to sslmode=disable when BYPASS_SSL is set", async () => {
    process.env.DATABASE_SECRET_ARN = "test-db-credentials-arn"; // pragma: allowlist secret
    process.env.BYPASS_SSL = "true";
    mocks.sendMock.mockResolvedValue({
      SecretString: JSON.stringify({
        username: "dbuser",
        password: "dbpass", // pragma: allowlist secret
        host: "db-host",
        port: 5432,
        dbname: "demo",
      }),
    });

    const url = await getDatabaseUrl();
    expect(url).toContain("sslmode=disable");
  });

  it("throws when DATABASE_SECRET_ARN is missing", async () => {
    await expect(getDatabaseUrl()).rejects.toThrow(
      "DATABASE_SECRET_ARN is required to fetch the database connection string."
    );
    expect(mocks.sendMock).not.toHaveBeenCalled();
  });

  it("returns db schema", () => {
    expect(getDbSchema()).toBe("demos_app");
  });

  it("creates pool once and reuses it", async () => {
    process.env.DATABASE_SECRET_ARN = "db-credentials-arn"; // pragma: allowlist secret
    mocks.sendMock.mockResolvedValue({
      SecretString: JSON.stringify({
        username: "dbuser",
        password: "dbpass", // pragma: allowlist secret
        host: "db-host",
        port: 5432,
        dbname: "demo",
      }),
    });

    const firstPool = await getDbPool();
    const secondPool = await getDbPool();

    expect(firstPool).toBe(secondPool);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(mocks.poolCtorMock).toHaveBeenCalledTimes(1);
    expect(mocks.logInfoMock).toHaveBeenCalledTimes(1);
  });
});
