import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetDbStateForTests, dbSchema, getDbPool } from "./pool";


vi.mock("pg");
vi.mock("../log", () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const mockDBConfig = {
  "database": "utdb",
  "host": "unit.test.rds.host",
  "password": "not-a-real-password", // pragma: allowlist secret
  "port": 5432,
  "user": "demos_export",
}

const mocks = vi.hoisted(() => ({
  getDatabaseConfigMock: vi.fn((_, o: Object) => ({...o, ...mockDBConfig})),
}));

vi.mock("demos-shared-library/database", () => {
  return { 
    getDatabaseConfig: mocks.getDatabaseConfigMock,
   };
});


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
  });

  it("builds a fresh pool after the state reset", async () => {
    await getDbPool();
    __resetDbStateForTests();
    await getDbPool();
    expect(vi.mocked(Pool)).toHaveBeenCalledTimes(2);
  });
});
