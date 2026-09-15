import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetDbStateForTests, dbSchema, getDatabaseConfig, getDbPool } from "./pool";

vi.mock("@aws-sdk/client-secrets-manager");
vi.mock("pg");
vi.mock("../log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const send = vi.mocked(SecretsManagerClient.prototype.send as never) as unknown as ReturnType<
  typeof vi.fn
>;

const CREDENTIALS = {
  username: "demos_export",
  password: "not-a-real-password", // pragma: allowlist secret
  host: "unit.test.rds.host",
  port: 5432,
  dbname: "utdb",
  engine: "postgres",
};

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  __resetDbStateForTests();
  process.env = { ...ORIGINAL_ENV, DATABASE_SECRET_ARN: "arn:aws:secretsmanager:secret" }; // pragma: allowlist secret
  delete process.env.DB_SSL_MODE;
  delete process.env.BYPASS_SSL;
  send.mockResolvedValue({ SecretString: JSON.stringify(CREDENTIALS) });
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  vi.useRealTimers();
});

describe("dbSchema", () => {
  it("is the application schema every query is scoped to", () => {
    expect(dbSchema).toBe("demos_app");
  });
});

describe("getDatabaseConfig", () => {
  it("requires the secret ARN", async () => {
    delete process.env.DATABASE_SECRET_ARN;
    await expect(getDatabaseConfig()).rejects.toThrow(
      "DATABASE_SECRET_ARN is required to fetch the database configuration."
    );
  });

  it("asks Secrets Manager for the ARN it was given", async () => {
    await getDatabaseConfig();
    expect(GetSecretValueCommand).toHaveBeenCalledWith({
      SecretId: "arn:aws:secretsmanager:secret", // pragma: allowlist secret
    });
  });

  it("names the secret when it exists but has no string value", async () => {
    send.mockResolvedValue({});
    await expect(getDatabaseConfig()).rejects.toThrow(
      "The SecretString value is undefined for secret: arn:aws:secretsmanager:secret"
    );
  });

  it("returns discrete postgres options instead of a connection string", async () => {
    const config = await getDatabaseConfig();

    expect(config).toMatchObject({
      user: "demos_export",
      password: "not-a-real-password", // pragma: allowlist secret
      host: "unit.test.rds.host",
      port: 5432,
      database: "utdb",
    });
    expect(config).not.toHaveProperty("connectionString");
  });

  it("preserves reserved characters in the discrete password", async () => {
    const password = "generated#/?password"; // pragma: allowlist secret
    send.mockResolvedValue({
      SecretString: JSON.stringify({ ...CREDENTIALS, password }),
    });

    const config = await getDatabaseConfig();

    expect(config.password).toBe(password); // pragma: allowlist secret
    expect(config.host).toBe("unit.test.rds.host");
  });

  it("keeps the password out of enumerable configuration", async () => {
    const config = await getDatabaseConfig();

    expect(config.password).toBe("not-a-real-password"); // pragma: allowlist secret
    expect(Object.keys(config)).not.toContain("password");
  });

  it("requires SSL by default", async () => {
    expect((await getDatabaseConfig()).ssl).toEqual({});
  });

  it("disables SSL only when BYPASS_SSL is set, for localstack", async () => {
    process.env.BYPASS_SSL = "1";
    expect((await getDatabaseConfig()).ssl).toBe(false);
  });

  it("lets DB_SSL_MODE override, and win over BYPASS_SSL", async () => {
    process.env.DB_SSL_MODE = "verify-full";
    process.env.BYPASS_SSL = "1";
    expect((await getDatabaseConfig()).ssl).toEqual({});
  });

  it("preserves the no-verify SSL mode", async () => {
    process.env.DB_SSL_MODE = "no-verify";
    expect((await getDatabaseConfig()).ssl).toEqual({ rejectUnauthorized: false });
  });

  it("fetches the secret once and serves the rest from cache", async () => {
    await getDatabaseConfig();
    await getDatabaseConfig();
    await getDatabaseConfig();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("refetches once the hour is up, so a rotated password is picked up", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T07:00:00Z"));
    await getDatabaseConfig();

    vi.setSystemTime(new Date("2026-09-04T07:59:59Z"));
    await getDatabaseConfig();
    expect(send).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-09-04T08:00:01Z"));
    await getDatabaseConfig();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("serves a rotated password after the cache expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T07:00:00Z"));
    expect((await getDatabaseConfig()).password).toBe("not-a-real-password");

    send.mockResolvedValue({
      SecretString: JSON.stringify({ ...CREDENTIALS, password: "rotated" }), // pragma: allowlist secret
    });
    vi.setSystemTime(new Date("2026-09-04T08:00:01Z"));
    expect((await getDatabaseConfig()).password).toBe("rotated");
  });

  it("is reset by the test helper, so module state cannot leak between tests", async () => {
    await getDatabaseConfig();
    expect(send).toHaveBeenCalledTimes(1);

    __resetDbStateForTests();
    await getDatabaseConfig();
    expect(send).toHaveBeenCalledTimes(2);
  });
});

describe("getDbPool", () => {
  it("pins DateStyle and TimeZone on the session", async () => {
    // The export reads every column as ::text, so Postgres output formatting is part of
    // the data path. Ex: a server set to an EU DateStyle renders 31.08.2026, which DuckDB
    // refuses to CAST.
    await getDbPool();
    expect(vi.mocked(Pool).mock.calls[0][0]).toMatchObject({
      options: "-c DateStyle=ISO,MDY -c TimeZone=UTC",
    });
  });

  it("caps the pool at two connections", async () => {
    await getDbPool();
    expect(vi.mocked(Pool).mock.calls[0][0]).toMatchObject({ max: 2 });
  });

  it("builds the pool from discrete secret-derived credentials", async () => {
    await getDbPool();
    const config = vi.mocked(Pool).mock.calls[0][0];
    expect(config).toMatchObject({
      user: "demos_export",
      password: "not-a-real-password", // pragma: allowlist secret
      host: "unit.test.rds.host",
      port: 5432,
      database: "utdb",
    });
    expect(config).not.toHaveProperty("connectionString");
  });

  it("returns the same pool on every call", async () => {
    expect(await getDbPool()).toBe(await getDbPool());
    expect(vi.mocked(Pool)).toHaveBeenCalledTimes(1);
  });

  it("builds one pool even when callers race", async () => {
    // poolPromise is assigned with ??= before the first await, so concurrent callers
    // share the in-flight promise rather than each opening connections.
    const [first, second] = await Promise.all([getDbPool(), getDbPool()]);
    expect(first).toBe(second);
    expect(vi.mocked(Pool)).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("builds a fresh pool after the state reset", async () => {
    await getDbPool();
    __resetDbStateForTests();
    await getDbPool();
    expect(vi.mocked(Pool)).toHaveBeenCalledTimes(2);
  });
});
