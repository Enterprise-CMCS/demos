import { randomBytes } from "node:crypto";

import {
  createRunScope,
  disposableDatabaseConfig,
  quoteFixtureUuid,
} from "./dataFix.integrationSupport.js";

function createDisposableTarget(password = randomBytes(32).toString("hex")): NodeJS.ProcessEnv {
  const fields = {
    host: "data-fix-postgres",
    port: "5432",
    database: "data_fix_test_0123456789abcdef",
    user: "data_fix_user_0123456789abcdef",
    password,
  };
  const databaseUrl = new URL(`postgresql://${fields.host}:${fields.port}/${fields.database}`);
  databaseUrl.username = fields.user;
  databaseUrl.password = fields.password;
  databaseUrl.searchParams.set("schema", "demos_app");
  databaseUrl.searchParams.set("sslmode", "disable");
  databaseUrl.searchParams.set("connect_timeout", "5");

  return {
    DEVCONTAINER: "true",
    CURRENT_ENV: "local",
    IS_TEST_MIGRATION: "true",
    DATA_FIX_TEST_HOST: fields.host,
    DATA_FIX_TEST_PORT: fields.port,
    DATA_FIX_TEST_DATABASE: fields.database,
    DATA_FIX_TEST_USER: fields.user,
    DATA_FIX_TEST_PASSWORD: fields.password,
    DATABASE_URL: databaseUrl.toString(),
  };
}

describe("data-fix integration support", () => {
  test("quotes complete UUIDs as one SQL literal without normalizing their contents", () => {
    const lowercase = "01234567-89ab-cdef-0123-456789abcdef";
    const uppercase = "ABCDEFAB-CDEF-ABCD-EFAB-CDEFABCDEFAB";

    expect(quoteFixtureUuid(lowercase)).toBe(`'${lowercase}'`);
    expect(quoteFixtureUuid(uppercase)).toBe(`'${uppercase}'`);
  });

  test("rejects malformed and injection-shaped UUIDs without echoing them", () => {
    const validUuid = "01234567-89ab-cdef-0123-456789abcdef";
    const rejectedValues = [
      "not-a-uuid",
      validUuid.slice(1),
      `${validUuid}; DROP TABLE demos_app.application;`,
    ];

    for (const value of rejectedValues) {
      let error: unknown;
      try {
        quoteFixtureUuid(value);
      } catch (caught) {
        error = caught;
      }

      expect(error).toBeInstanceOf(Error);
      const message = (error as Error).message;
      expect(message).toBe("Fixture UUID must be a complete 36-character hyphenated hexadecimal UUID.");
      if (value !== "") {
        expect(message).not.toContain(value);
      }
    }
  });

  // Synthetic credentials exercise target validation and redaction only; this test never connects to anything.
  test("accepts only the complete per-run disposable target and builds explicit client fields", () => {
    const target = createDisposableTarget();
    const invalidPasswordTarget = createDisposableTarget(randomBytes(16).toString("hex"));
    const config = disposableDatabaseConfig(target);

    expect(config).toMatchObject({
      host: "data-fix-postgres",
      port: 5432,
      database: "data_fix_test_0123456789abcdef",
      user: "data_fix_user_0123456789abcdef",
      password: target.DATA_FIX_TEST_PASSWORD,
      options: "-c search_path=demos_app,public",
      connectionTimeoutMillis: 5_000,
    });
    expect(config).not.toHaveProperty("connectionString");

    for (const env of [
      {},
      { ...target, DEVCONTAINER: undefined },
      { ...target, DEVCONTAINER: "false" },
      { ...target, IS_TEST_MIGRATION: undefined },
      { ...target, IS_TEST_MIGRATION: "false" },
      { ...target, DATA_FIX_TEST_HOST: undefined },
      { ...target, DATA_FIX_TEST_PORT: undefined },
      { ...target, DATA_FIX_TEST_DATABASE: undefined },
      { ...target, DATA_FIX_TEST_USER: undefined },
      { ...target, DATA_FIX_TEST_PASSWORD: undefined },
      { ...target, DATABASE_URL: undefined },
      { ...target, DATA_FIX_TEST_HOST: "db" },
      { ...target, DATA_FIX_TEST_PORT: "5433" },
      { ...target, DATA_FIX_TEST_DATABASE: "demos" },
      { ...target, DATA_FIX_TEST_USER: "postgres" },
      invalidPasswordTarget,
      { ...target, DATABASE_URL: `${target.DATABASE_URL}&host=db` },
      { ...target, CURRENT_ENV: "dev" },
    ]) {
      let message: string | undefined;
      try {
        disposableDatabaseConfig(env);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        message = (error as Error).message;
      }
      expect(message).toMatch(/no database connection was opened/);
      for (const sensitiveValue of [
        env.DATA_FIX_TEST_PASSWORD,
        env.DATABASE_URL,
        target.DATA_FIX_TEST_PASSWORD,
        target.DATABASE_URL,
      ]) {
        if (sensitiveValue) {
          expect(message).not.toContain(sensitiveValue);
        }
      }
    }
  });

  test("creates unique UUID ownership and lint-compatible registered filenames", () => {
    const first = createRunScope(new Date("2026-11-18T12:00:00.000Z"));
    const second = createRunScope(new Date("2026-11-18T12:00:00.000Z"));

    expect(first.applicationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.personId).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.email).toMatch(/^data-fix-integration\+[a-f0-9]{12}@example\.invalid$/);
    expect(first.fileNames).toEqual([first.forwardFileName, first.reverseFileName]);
    expect(first.fileNames.every((fileName) => fileName.includes(first.suffix) && fileName.endsWith(".sql"))).toBe(true);
    expect(new Set([...first.fileNames, ...second.fileNames]).size).toBe(4);
  });
});
