import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendMock: vi.fn(),
  poolCtorMock: vi.fn(),
  logInfoMock: vi.fn(),
}));

vi.mock("./uipathClient", () => ({
  region: "us-east-1",
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

async function loadDbModule() {
  vi.resetModules();
  return import("./db");
}

describe("db", () => {
  beforeEach(() => {
    process.env = { ...prevEnv };
    delete process.env.DATABASE_SECRET_ARN;
    delete process.env.DB_SSL_MODE;
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
    process.env.DB_SSL_MODE = "disable";
    mocks.sendMock.mockResolvedValue({
      SecretString: JSON.stringify({
        username: "dbuser",
        password: "dbpass", // pragma: allowlist secret
        host: "db-host",
        port: 5432,
        dbname: "demo",
      }),
    });

    const { getDatabaseUrl } = await loadDbModule();

    const first = await getDatabaseUrl();
    const second = await getDatabaseUrl();

    expect(first).toContain("postgresql://");
    expect(first).toContain("@db-host:5432/demo?schema=demos_app&sslmode=disable");
    expect(second).toBe(first);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(mocks.sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          SecretId: "test-db-credentials-arn", // pragma: allowlist secret
        },
      })
    );
  });

  it("throws when DATABASE_SECRET_ARN is missing", async () => {
    const { getDatabaseUrl } = await loadDbModule();

    await expect(getDatabaseUrl()).rejects.toThrow(
      "DATABASE_SECRET_ARN is required to fetch the database connection string."
    );
    expect(mocks.sendMock).not.toHaveBeenCalled();
  });

  it("throws when secret response has no SecretString", async () => {
    process.env.DATABASE_SECRET_ARN = "db-credentials-arn"; // pragma: allowlist secret
    mocks.sendMock.mockResolvedValue({});
    const { getDatabaseUrl } = await loadDbModule();

    await expect(getDatabaseUrl()).rejects.toThrow("The SecretString value is undefined");
  });

  it("returns db schema constant", async () => {
    const { getDbSchema } = await loadDbModule();

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
    const { getDbPool } = await loadDbModule();

    const firstPool = await getDbPool();
    const secondPool = await getDbPool();

    expect(firstPool).toBe(secondPool);
    expect(mocks.sendMock).toHaveBeenCalledTimes(1);
    expect(mocks.poolCtorMock).toHaveBeenCalledTimes(1);
    expect(mocks.poolCtorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: expect.stringContaining("@db-host:5432/demo?schema=demos_app&sslmode=require"),
        max: 2,
      })
    );
    expect(mocks.logInfoMock).toHaveBeenCalledTimes(1);
    expect(mocks.logInfoMock).toHaveBeenCalledWith("Connecting to database for UiPath results");
  });
});
