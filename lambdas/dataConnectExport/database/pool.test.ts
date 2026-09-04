import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetDbStateForTests, dbSchema, getDatabaseUrl, getDbPool } from "./pool";

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

describe("getDatabaseUrl", () => {
  it("requires the secret ARN", async () => {
    delete process.env.DATABASE_SECRET_ARN;
    await expect(getDatabaseUrl()).rejects.toThrow(
      "DATABASE_SECRET_ARN is required to fetch the database connection string."
    );
  });

  it("asks Secrets Manager for the ARN it was given", async () => {
    await getDatabaseUrl();
    expect(GetSecretValueCommand).toHaveBeenCalledWith({
      SecretId: "arn:aws:secretsmanager:secret", // pragma: allowlist secret
    });
  });

  it("names the secret when it exists but has no string value", async () => {
    send.mockResolvedValue({});
    await expect(getDatabaseUrl()).rejects.toThrow(
      "The SecretString value is undefined for secret: arn:aws:secretsmanager:secret"
    );
  });

  // Asserted part by part rather than as one literal, so the test says what each
  // component has to be instead of restating the template.
  it("assembles a postgres URL from the secret", async () => {
    const url = new URL(await getDatabaseUrl());
    expect(url.protocol).toBe("postgresql:");
    expect(url.username).toBe("demos_export");
    expect(url.password).toBe("not-a-real-password"); // pragma: allowlist secret
    expect(url.hostname).toBe("unit.test.rds.host");
    expect(url.port).toBe("5432");
    expect(url.pathname).toBe("/utdb");
    expect(url.searchParams.get("schema")).toBe("demos_app");
  });

  it("requires SSL by default", async () => {
    expect(new URL(await getDatabaseUrl()).searchParams.get("sslmode")).toBe("require");
  });

  it("disables SSL only when BYPASS_SSL is set, for localstack", async () => {
    process.env.BYPASS_SSL = "1";
    expect(new URL(await getDatabaseUrl()).searchParams.get("sslmode")).toBe("disable");
  });

  it("lets DB_SSL_MODE override, and win over BYPASS_SSL", async () => {
    process.env.DB_SSL_MODE = "verify-full";
    process.env.BYPASS_SSL = "1";
    expect(new URL(await getDatabaseUrl()).searchParams.get("sslmode")).toBe("verify-full");
  });

  it("fetches the secret once and serves the rest from cache", async () => {
    await getDatabaseUrl();
    await getDatabaseUrl();
    await getDatabaseUrl();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("refetches once the hour is up, so a rotated password is picked up", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T07:00:00Z"));
    await getDatabaseUrl();

    vi.setSystemTime(new Date("2026-09-04T07:59:59Z"));
    await getDatabaseUrl();
    expect(send).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-09-04T08:00:01Z"));
    await getDatabaseUrl();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("serves a rotated password after the cache expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-04T07:00:00Z"));
    expect(new URL(await getDatabaseUrl()).password).toBe("not-a-real-password");

    send.mockResolvedValue({
      SecretString: JSON.stringify({ ...CREDENTIALS, password: "rotated" }), // pragma: allowlist secret
    });
    vi.setSystemTime(new Date("2026-09-04T08:00:01Z"));
    expect(new URL(await getDatabaseUrl()).password).toBe("rotated");
  });

  it("is reset by the test helper, so module state cannot leak between tests", async () => {
    await getDatabaseUrl();
    expect(send).toHaveBeenCalledTimes(1);

    __resetDbStateForTests();
    await getDatabaseUrl();
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

  it("builds the pool from the secret-derived connection string", async () => {
    await getDbPool();
    const { connectionString } = vi.mocked(Pool).mock.calls[0][0] as { connectionString: string };
    expect(new URL(connectionString).hostname).toBe("unit.test.rds.host");
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
