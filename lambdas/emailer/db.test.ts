import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  poolConstructor: vi.fn(),
}));

vi.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: class {
    send = mocks.send;
  },
  GetSecretValueCommand: class {
    constructor(public input: unknown) {}
  },
}));

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

import { __resetDbStateForTests, getDatabaseUrl, getDbPool, getDbSchema } from "./db";

const originalEnv = { ...process.env };

describe("emailer database connection", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.DATABASE_SECRET_ARN = "database-secret"; // pragma: allowlist secret
    process.env.DB_SSL_MODE = "disable";
    delete process.env.DB_SCHEMA;
    __resetDbStateForTests();
    mocks.send.mockReset();
    mocks.poolConstructor.mockReset();
    mocks.send.mockResolvedValue({
      SecretString: JSON.stringify({
        username: "db-user",
        password: "db-password", // pragma: allowlist secret
        host: "db",
        port: 5432,
        dbname: "demos",
      }),
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });
  const DB_CONNECTION_URL =
    "postgresql://db-user:db-password@db:5432/demos?schema=demos_app&sslmode=disable"; // pragma: allowlist secret

  it("builds the database URL from the configured secret", async () => {
    await expect(getDatabaseUrl()).resolves.toBe(DB_CONNECTION_URL);
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({ input: { SecretId: "database-secret" } }) // pragma: allowlist secret
    );
  });

  it("requires a database secret", async () => {
    delete process.env.DATABASE_SECRET_ARN;

    await expect(getDatabaseUrl()).rejects.toThrow(
      "DATABASE_SECRET_ARN is required to fetch the database connection string."
    );
  });

  it("reports a secret without a SecretString", async () => {
    mocks.send.mockResolvedValue({});

    await expect(getDatabaseUrl()).rejects.toThrow(
      "The SecretString value is undefined for secret: database-secret"
    );
  });

  it("creates one pool and reuses it", async () => {
    const firstPool = await getDbPool();
    const secondPool = await getDbPool();

    expect(firstPool).toBe(secondPool);
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.poolConstructor).toHaveBeenCalledExactlyOnceWith({
      connectionString: DB_CONNECTION_URL,
      max: 2,
    });
  });

  it("rejects unsafe schema names", () => {
    process.env.DB_SCHEMA = "demos_app; DROP TABLE users";

    expect(() => getDbSchema()).toThrow("Invalid DB_SCHEMA");
  });
});
