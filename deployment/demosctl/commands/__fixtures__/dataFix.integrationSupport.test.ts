import { randomBytes } from "node:crypto";
import type { Client } from "pg";

import {
  assertIntegrationPrerequisites,
  assertLedgerAccessPolicy,
  assertRunScopeAvailable,
  createRunScope,
  disposableDatabaseConfig,
  quoteFixtureUuid,
  seedOwnedGraph,
} from "./dataFix.integrationSupport.js";

function clientWith(query: ReturnType<typeof vi.fn>) {
  return { query } as unknown as Client;
}

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
      "",
      "not-a-uuid",
      "g1234567-89ab-cdef-0123-456789abcdef",
      "0123456789ab-cdef-0123-456789abcdef",
      ` ${validUuid}`,
      `${validUuid} `,
      `${validUuid}\n`,
      `${validUuid}\0`,
      `'${validUuid}`,
      `${validUuid}'`,
      `${validUuid}\\`,
      `$$${validUuid}$$`,
      `${validUuid}; DROP TABLE demos_app.application;`,
      `${validUuid}-- comment`,
      `${validUuid}/* comment */`,
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
      expect(() => disposableDatabaseConfig(env)).toThrow(/no database connection was opened/);
      try {
        disposableDatabaseConfig(env);
      } catch (error) {
        const message = (error as Error).message;
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

  test("checks only the current run's application, person, and exact ledger filenames", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ application_exists: false, demonstration_exists: false, person_exists: false, ledger_exists: false }],
      rowCount: 1,
    });
    const scope = createRunScope();

    await assertRunScopeAvailable(clientWith(query), scope);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toEqual([scope.applicationId, scope.personId, scope.email, scope.fileNames]);
    expect(query.mock.calls[0][0]).toContain("file_name = ANY($4::text[])");
    expect(query.mock.calls[0][0]).not.toMatch(/\bLIKE\b/i);
  });

  test("seeds the production-shaped graph in one transaction and rolls back a partial seed", async () => {
    const scope = createRunScope();
    const successfulQuery = vi.fn().mockResolvedValue({ rows: [], rowCount: 1 });
    await seedOwnedGraph(clientWith(successfulQuery), scope);
    expect(successfulQuery.mock.calls[0][0]).toBe("BEGIN");
    expect(successfulQuery.mock.calls.at(-1)?.[0]).toBe("COMMIT");
    expect(successfulQuery.mock.calls.filter(([sql]) => sql.trimStart().startsWith("INSERT INTO demos_app"))).toHaveLength(5);

    const seedError = new Error("synthetic insert failure");
    const partialQuery = vi.fn()
      .mockResolvedValueOnce({ rows: [], rowCount: null })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockRejectedValueOnce(seedError)
      .mockResolvedValueOnce({ rows: [], rowCount: null });
    await expect(seedOwnedGraph(clientWith(partialQuery), scope)).rejects.toBe(seedError);
    expect(partialQuery.mock.calls.map(([sql]) => sql)).toEqual([
      "BEGIN",
      expect.stringContaining("INSERT INTO demos_app.application"),
      expect.stringContaining("INSERT INTO demos_app.demonstration"),
      "ROLLBACK",
    ]);
  });

  test("fails on a missing required migration before any fixture writes", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });

    await expect(assertIntegrationPrerequisites(clientWith(query), "20261104004932_add_data_fix_log"))
      .rejects.toThrow(/completed migration 20261104004932_add_data_fix_log.*npm run migrate:deploy/);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain("FROM demos_app._prisma_migrations");
    expect(query.mock.calls[0][0]).not.toMatch(/\b(UPDATE|DELETE|INSERT|ALTER|DROP|TRUNCATE)\b/i);
  });

  test("rejects a missing history trigger before role switching or fixture writes", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ trigger_name: "log_changes_application" }], rowCount: 1 });

    await expect(assertIntegrationPrerequisites(clientWith(query), "20261104004932_add_data_fix_log"))
      .rejects.toThrow(/history trigger log_changes_application.*npm run migrate:deploy/);
    expect(query).toHaveBeenCalledTimes(4);
    expect(query.mock.calls.every(([sql]) => /^\s*SELECT\b/i.test(sql))).toBe(true);
  });

  test("rejects a missing data-fix role before any fixture writes", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(assertIntegrationPrerequisites(clientWith(query), "20261104004932_add_data_fix_log"))
      .rejects.toThrow(/demos_data_fix must exist.*npm run migrate:deploy/);
    expect(query).toHaveBeenCalledTimes(8);
    expect(query.mock.calls.every(([sql]) => /^\s*SELECT\b/i.test(sql))).toBe(true);
  });

  test("rejects a missing application seed trigger before role switching or fixture writes", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ trigger_name: "create_phases_and_dates_for_new_application" }], rowCount: 1 });

    await expect(assertIntegrationPrerequisites(clientWith(query), "20261104004932_add_data_fix_log"))
      .rejects.toThrow(/seed trigger create_phases_and_dates_for_new_application.*npm run migrate:deploy/);
    expect(query).toHaveBeenCalledTimes(5);
    expect(query.mock.calls.every(([sql]) => /^\s*SELECT\b/i.test(sql))).toBe(true);
  });

  test("rejects insufficient local cleanup privileges before role switching or fixture writes", async () => {
    const query = vi.fn((sql: string) => {
      if (sql.includes("FROM demos_app._prisma_migrations")) {
        return Promise.resolve({ rows: [{}], rowCount: 1 });
      }
      if (sql.includes("SELECT missing_reference")) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      if (sql.includes("rolname = ANY")) {
        return Promise.resolve({ rows: [{ rolname: "demos_write" }, { rolname: "demos_delete" }], rowCount: 2 });
      }
      if (sql.includes("has_table_privilege('demos_write'")) {
        return Promise.resolve({
          rows: [{
            write_insert: true,
            write_update: false,
            write_delete: false,
            write_truncate: false,
            write_schema_usage: true,
            delete_insert: false,
            delete_update: false,
            delete_delete: false,
            delete_truncate: false,
            delete_schema_usage: true,
            fix_select: true,
            fix_insert: false,
            fix_update: false,
            fix_delete: false,
            fix_truncate: false,
            fix_schema_usage: true,
            fix_schema_create: false,
            fix_can_truncate: false,
          }],
          rowCount: 1,
        });
      }
      if (sql.includes("FROM pg_namespace")) {
        return Promise.resolve({ rows: [{ schema_not_owned_by_fix: true, tables_not_owned_by_fix: true }], rowCount: 1 });
      }
      if (sql.includes("FROM pg_constraint")) {
        return Promise.resolve({ rows: [{}], rowCount: 1 });
      }
      if (sql.includes("FROM pg_roles")) {
        return Promise.resolve({
          rows: [{ rolcanlogin: false, rolsuper: false, rolcreatedb: false, rolcreaterole: false, can_set_role: true }],
          rowCount: 1,
        });
      }
      if (sql.includes("has_schema_privilege")) {
        return Promise.resolve({ rows: [{ login_allowed: true, fix_role_allowed: true, temp_allowed: true }], rowCount: 1 });
      }
      if (sql.includes("has_table_privilege(current_user")) {
        return Promise.resolve({ rows: [{ table_name: "application", privilege: "DELETE" }], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    await expect(assertIntegrationPrerequisites(clientWith(query), "20261104004932_add_data_fix_log"))
      .rejects.toThrow(/local login needs DELETE on demos_app.application.*npm run migrate:deploy/);
    expect(query.mock.calls.every(([sql]) => /^\s*SELECT\b/i.test(sql))).toBe(true);
  });

  test("inspects append-only ledger privileges and object ownership using read-only queries", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ rolname: "demos_write" }, { rolname: "demos_delete" }], rowCount: 2 })
      .mockResolvedValueOnce({
        rows: [{
          write_insert: true,
          write_update: false,
          write_delete: false,
          write_truncate: false,
          write_schema_usage: true,
          delete_insert: false,
          delete_update: false,
          delete_delete: false,
          delete_truncate: false,
          delete_schema_usage: true,
          fix_select: true,
          fix_insert: false,
          fix_update: false,
          fix_delete: false,
          fix_truncate: false,
          fix_schema_usage: true,
          fix_schema_create: false,
          fix_can_truncate: false,
        }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [{ schema_not_owned_by_fix: true, tables_not_owned_by_fix: true }], rowCount: 1 });

    await expect(assertLedgerAccessPolicy(clientWith(query))).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls.map(([sql]) => sql).join(" ")).toMatch(/has_table_privilege/);
    expect(query.mock.calls.map(([sql]) => sql).join(" ")).toMatch(/relowner/);
    expect(query.mock.calls.every(([sql]) => /^\s*SELECT\b/i.test(sql))).toBe(true);
  });

  test("rejects ledger privilege drift before fixture writes", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ rolname: "demos_write" }, { rolname: "demos_delete" }], rowCount: 2 })
      .mockResolvedValueOnce({ rows: [{ fix_select: true, fix_insert: true }], rowCount: 1 });

    await expect(assertLedgerAccessPolicy(clientWith(query)))
      .rejects.toThrow(/ledger must remain append-only.*npm run migrate:deploy/);
    expect(query).toHaveBeenCalledTimes(2);
  });

});
