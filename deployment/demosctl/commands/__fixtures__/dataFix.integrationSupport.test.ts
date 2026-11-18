import type { Client } from "pg";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertIntegrationPrerequisites,
  assertLedgerAccessPolicy,
  assertRunScopeAvailable,
  cleanupOwnedGraph,
  createRunScope,
  localDatabaseConfig,
  quoteFixtureUuid,
  seedOwnedGraph,
  withOwnedCleanup,
  writeOwnershipManifest,
} from "./dataFix.integrationSupport.js";

function clientWith(query: ReturnType<typeof vi.fn>) {
  return { query } as unknown as Client;
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

  // Synthetic credentials exercise target validation and redaction only; this test never connects to anything
  test("accepts only the configured local devcontainer target without printing its credentials", () => {
    const config = localDatabaseConfig({
      CURRENT_ENV: "local",
      DATABASE_URL: "postgresql://devuser:top-secret@db:5432/demos?schema=demos_app&sslmode=disable", // pragma: allowlist secret
    });

    expect(config.connectionString).toBe("postgresql://devuser:top-secret@db:5432/demos?schema=demos_app&sslmode=disable"); // pragma: allowlist secret
    expect(config.options).toContain("search_path=demos_app");
    for (const env of [
      {},
      { CURRENT_ENV: "local" },
      { CURRENT_ENV: "dev", DATABASE_URL: "postgresql://devuser:top-secret@db:5432/demos?schema=demos_app" }, // pragma: allowlist secret
      { CURRENT_ENV: "local", DATABASE_URL: "postgresql://devuser:top-secret@other:5432/demos?schema=demos_app" }, // pragma: allowlist secret
      { CURRENT_ENV: "local", DATABASE_URL: "postgresql://devuser:top-secret@db:5432/other?schema=demos_app" }, // pragma: allowlist secret
      { CURRENT_ENV: "local", DATABASE_URL: "postgresql://devuser:top-secret@db:5432/demos?schema=public" }, // pragma: allowlist secret
    ]) {
      expect(() => localDatabaseConfig(env)).toThrow(/no database connection was opened/);
      try {
        localDatabaseConfig(env);
      } catch (error) {
        expect((error as Error).message).not.toContain("top-secret");
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

  test("retains only non-secret run ownership details in a recovery manifest", async () => {
    const directory = await mkdtemp(join(tmpdir(), "data-fix-recovery-test-"));
    const scope = createRunScope();
    try {
      const manifestPath = await writeOwnershipManifest(directory, scope);
      const content = await readFile(manifestPath, "utf8");
      expect(JSON.parse(content)).toEqual({
        applicationId: scope.applicationId,
        personId: scope.personId,
        email: scope.email,
        fileNames: scope.fileNames,
      });
      expect(content).not.toMatch(/DATABASE_URL|password|top-secret/i);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
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

  test("cleans only owned records in trigger-safe order and verifies absence", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });
    const scope = createRunScope();
    await cleanupOwnedGraph(clientWith(query), scope);

    const calls = query.mock.calls as [string, unknown[]?][];
    const statements = calls.map(([sql]) => sql);
    const appDelete = statements.findIndex((sql) => sql === "DELETE FROM demos_app.application WHERE id = $1");
    const demonstrationDelete = statements.findIndex((sql) => sql === "DELETE FROM demos_app.demonstration WHERE id = $1");
    const personDelete = statements.findIndex((sql) => sql.startsWith("DELETE FROM demos_app.person WHERE"));

    expect(statements[0]).toBe("BEGIN");
    expect(appDelete).toBeGreaterThan(-1);
    expect(demonstrationDelete).toBeGreaterThan(appDelete);
    expect(personDelete).toBeGreaterThan(demonstrationDelete);
    const personDeleteHistory = statements.findIndex((sql) => sql.includes("DELETE FROM demos_app.person_history"));
    const ledgerDelete = statements.findIndex((sql) => sql.includes("DELETE FROM demos_app.data_fix_log"));
    expect(personDeleteHistory).toBeGreaterThan(personDelete);
    expect(ledgerDelete).toBeGreaterThan(personDeleteHistory);
    expect(statements.at(-1)).toContain("data_fix_log");
    expect(statements).toContain("COMMIT");
    expect(statements.every((sql) => !/\b(TRUNCATE|ALTER|DROP)\b/i.test(sql))).toBe(true);
    expect(calls.find(([sql]) => sql.includes("DELETE FROM demos_app.application WHERE"))?.[1]).toEqual([scope.applicationId]);
    expect(calls.find(([sql]) => sql.includes("DELETE FROM demos_app.person WHERE"))?.[1]).toEqual([scope.personId, scope.email]);
    expect(calls.find(([sql]) => sql.includes("DELETE FROM demos_app.data_fix_log"))?.[1]).toEqual([scope.fileNames]);
    expect(calls.find(([sql]) => sql.includes("DELETE FROM demos_app.application_history"))?.[1]).toEqual([scope.applicationId]);
    expect(calls.find(([sql]) => sql.includes("DELETE FROM demos_app.person_history"))?.[1]).toEqual([scope.personId]);
    const expectedDeleteParameters: Record<string, unknown[]> = {
      primary_demonstration_role_assignment: [scope.applicationId, scope.personId],
      demonstration_role_assignment: [scope.applicationId, scope.personId],
      application_phase: [scope.applicationId],
      application_date: [scope.applicationId],
      application: [scope.applicationId],
      demonstration: [scope.applicationId],
      person_state: [scope.personId],
      person: [scope.personId, scope.email],
      application_date_history: [scope.applicationId],
      application_history: [scope.applicationId],
      application_phase_history: [scope.applicationId],
      demonstration_history: [scope.applicationId],
      demonstration_role_assignment_history: [scope.applicationId, scope.personId],
      person_history: [scope.personId],
      person_state_history: [scope.personId],
      primary_demonstration_role_assignment_history: [scope.applicationId, scope.personId],
      data_fix_log: [scope.fileNames],
    };
    for (const [table, parameters] of Object.entries(expectedDeleteParameters)) {
      const call = calls.find(([sql]) => sql.startsWith(`DELETE FROM demos_app.${table} `));
      expect(call?.[1]).toEqual(parameters);
    }
    const deletes = statements.filter((sql) => /^DELETE\s+FROM/i.test(sql.trim()));
    expect(deletes.every((sql) => /\bWHERE\b/i.test(sql) && !/\bLIKE\b/i.test(sql))).toBe(true);
    expect(deletes).toHaveLength(17);
    expect(statements.some((sql) => sql.includes("SELECT * FROM demos_app.application WHERE id = $1"))).toBe(true);
  });

  test("preserves the run failure while reporting cleanup failure separately", async () => {
    const originalError = new Error("runner failed");
    const cleanupError = new Error("cleanup failed");
    const reported: unknown[] = [];

    await expect(withOwnedCleanup(
      async () => { throw originalError; },
      async () => { throw cleanupError; },
      (error) => reported.push(error),
    )).rejects.toBe(originalError);

    expect(reported).toEqual([cleanupError]);
  });

  test("runs cleanup after a seeded run fails and preserves the run error", async () => {
    const runError = new Error("apply failed after writing data");
    const events: string[] = [];

    await expect(withOwnedCleanup(
      async () => {
        events.push("run");
        throw runError;
      },
      async () => { events.push("cleanup"); },
      () => undefined,
    )).rejects.toBe(runError);

    expect(events).toEqual(["run", "cleanup"]);
  });
});
