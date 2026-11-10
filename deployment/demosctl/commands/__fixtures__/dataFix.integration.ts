// Run from deployment/: npx tsx demosctl/commands/__fixtures__/dataFix.integration.ts
// Requires Docker and installed server/ and deployment/ dependencies. Uses no AWS or Jenkins services.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { Console } from "node:console";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Writable } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";
import pg from "pg";

const ROOT = resolve(dirname(process.argv[1]), "../../../..");
const SERVER = join(ROOT, "server");
const DEPLOYMENT = join(ROOT, "deployment");
const SQL_DIRECTORY = join(SERVER, "src/sql");
const MIGRATIONS = join(SERVER, "src/model/migrations");
const APPLICATION_ID = "00000000-0000-4000-8000-000000000003";
const TICKET = "DEMOS-99999";
const APPLY_OPTIONS = {
  apply: true,
  approvedBy: "synthetic-approver",
  appliedBy: "synthetic-operator",
  gitCommit: "a".repeat(40),
  buildUrl: "https://ci.invalid/job/data-fix/1/",
};

function command(executable: string, args: string[], options: { cwd?: string; databaseUrl?: string } = {}) {
  const result = spawnSync(executable, args, {
    cwd: options.cwd ?? SERVER,
    env: { ...process.env, ...(options.databaseUrl ? { DATABASE_URL: options.databaseUrl } : {}) },
    encoding: "utf8",
    timeout: 180_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, `${executable} failed (${result.signal ?? result.error?.name ?? result.status})\n${result.stdout}\n${result.stderr}`);
  return result.stdout.trim();
}

function checksum(sql: string) {
  return createHash("sha256").update(sql).digest("hex");
}

function body(target: boolean) {
  return `DO $$
BEGIN
  IF (SELECT count(*) FROM demos_app.application
      WHERE id = '${APPLICATION_ID}' AND is_migrated_from_pmda = ${!target}) <> 1 THEN
    RAISE EXCEPTION 'synthetic precondition failed';
  END IF;
  RAISE NOTICE 'integration_notice: precondition_count=1';
END
$$;
CREATE TEMPORARY TABLE data_fix_result (rows_affected integer);
WITH changed AS (
  UPDATE demos_app.application SET is_migrated_from_pmda = ${target}
  WHERE id = '${APPLICATION_ID}' AND is_migrated_from_pmda = ${!target}
  RETURNING 1
)
INSERT INTO pg_temp.data_fix_result SELECT count(*)::integer FROM changed;
SELECT count(*)::integer AS evidence_count,
       bool_and(is_migrated_from_pmda = ${target}) AS checks_passed
FROM demos_app.application WHERE id = '${APPLICATION_ID}';
`;
}

async function main() {
  const originalCwd = process.cwd();
  const container = `demos-data-fix-it-${randomUUID()}`;
  const password = randomBytes(24).toString("hex");
  let temporaryDirectory: string | undefined;
  let admin: pg.Client | undefined;
  let containerAttempted = false;
  let passed = 0;
  const pass = (name: string) => {
    passed++;
    console.log(`PASS ${name}`);
  };

  try {
    temporaryDirectory = await mkdtemp(join(ROOT, ".data-fix-integration-"));
    process.chdir(DEPLOYMENT);
    containerAttempted = true;
    command("docker", [
      "run", "--detach", "--rm", "--name", container,
      "--publish", "127.0.0.1::5432", "--env", `POSTGRES_PASSWORD=${password}`, "postgres:17",
    ]);
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      const probe = spawnSync("docker", ["exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"], { timeout: 5_000 });
      if (probe.status === 0) {
        ready = true;
        break;
      }
      await delay(500);
    }
    assert.ok(ready, "throwaway PostgreSQL did not become ready");
    const port = Number(command("docker", ["port", container, "5432/tcp"]).split(":").at(-1));
    assert.ok(Number.isInteger(port) && port > 0);
    const bootstrap = (sql: string) => command("docker", [
      "exec", container, "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-c", sql,
    ]);
    bootstrap(`CREATE ROLE demos_admin LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB CREATEROLE;
      CREATE ROLE demos_read NOLOGIN;
      CREATE ROLE demos_write NOLOGIN;
      CREATE ROLE demos_delete NOLOGIN;
      GRANT demos_read, demos_write, demos_delete TO demos_admin WITH INHERIT FALSE, SET TRUE;`);
    bootstrap("CREATE DATABASE demos OWNER demos_admin");

    const config: pg.ClientConfig = {
      host: "127.0.0.1", port, user: "demos_admin", password, database: "demos", ssl: false,
      options: "-c search_path=demos_app,public",
      connectionTimeoutMillis: 5_000,
    };
    admin = new pg.Client(config);
    await admin.connect();
    const version = (await admin.query("SHOW server_version")).rows[0].server_version as string;
    assert.match(version, /^17\./);
    console.log(`PostgreSQL ${version}`);
    const administrator = (await admin.query(
      "SELECT current_user, rolsuper, rolcreaterole FROM pg_roles WHERE rolname = current_user",
    )).rows[0];
    assert.deepEqual(administrator, { current_user: "demos_admin", rolsuper: false, rolcreaterole: true });
    await admin.query("CREATE SCHEMA demos_app AUTHORIZATION demos_admin");

    const databaseUrl = `postgresql://demos_admin:${password}@127.0.0.1:${port}/demos?schema=demos_app`;
    const prisma = (...args: string[]) => command(join(SERVER, "node_modules/.bin/prisma"), args, { databaseUrl });
    console.log(prisma("validate"));
    console.log(prisma("migrate", "deploy"));
    // Fresh migration replay differs from Prisma on existing composite foreign-key actions.
    // Report the real database-to-model diff; do not mutate those existing constraints in this harness.
    console.log(prisma("migrate", "diff", "--from-config-datasource", "--to-schema", "src/model", "--script"));
    const migrationFolders = (await readdir(MIGRATIONS, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    const appliedMigrations = (await admin.query(
      "SELECT migration_name FROM demos_app._prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name",
    )).rows.map((row) => row.migration_name);
    assert.deepEqual(appliedMigrations, migrationFolders);
    const requiredMigration = migrationFolders.find((name) => name.endsWith("_add_data_fix_log"));
    assert.ok(requiredMigration, "real data-fix ledger migration must exist");
    pass(`Prisma validation and all ${migrationFolders.length} real migrations as non-superuser demos_admin`);

    await admin.query(await readFile(join(SQL_DIRECTORY, "history_triggers.sql"), "utf8"));
    const permissions = await readFile(join(SQL_DIRECTORY, "permissions.sql"), "utf8");
    await admin.query(permissions);
    await admin.query(permissions);
    const fixRole = (await admin.query(
      "SELECT rolcanlogin, rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = 'demos_data_fix'",
    )).rows[0];
    assert.deepEqual(fixRole, { rolcanlogin: false, rolsuper: false, rolcreatedb: false, rolcreaterole: false });
    pass("actual history triggers and permissions.sql, including non-superuser idempotent role setup");
    await admin.query(
      "INSERT INTO demos_app.application (id, application_type_id, is_migrated_from_pmda) VALUES ($1, 'Demonstration', false)",
      [APPLICATION_ID],
    );

    const directory = temporaryDirectory;
    async function pair(label: string, sqlBody = body(true), expectedRows = 1) {
      const forwardName = `20261110_${TICKET}_${label}.sql`;
      const reverseName = `20261110_${TICKET}_${label}_reverse.sql`;
      const header = (reverse: boolean) => `-- ticket: ${TICKET}
-- author: synthetic-integration-author
-- data_owner: synthetic-integration-owner
-- environments: dev
-- expected_rows: ${expectedRows}
-- source: local synthetic integration fixture, no external data
-- runner: demosctl
-- requires_migration: ${requiredMigration}
-- reverse: ${reverse ? "none" : reverseName}
${reverse ? `-- reverses: ${forwardName}\n` : ""}\n`;
      const forwardSql = header(false) + sqlBody;
      const reverseSql = header(true) + body(false);
      const forwardPath = join(directory, forwardName);
      const reversePath = join(directory, reverseName);
      await writeFile(forwardPath, forwardSql);
      await writeFile(reversePath, reverseSql);
      return { forwardName, reverseName, forwardPath, reversePath, forwardSql, reverseSql };
    }

    const { dataFix } = await import("../dataFix.js");
    async function runFix(file: string, options: Parameters<typeof dataFix>[2]) {
      const client = new pg.Client(config);
      const lifecycle = { ended: false };
      client.on("end", () => { lifecycle.ended = true; });
      const originalConsole = globalThis.console;
      const output: string[] = [];
      const stream = new Writable({
        write(chunk, encoding, callback) {
          output.push(chunk.toString());
          process.stdout.write(chunk, encoding, callback);
        },
      });
      globalThis.console = new Console({ stdout: stream, stderr: stream });
      try {
        // The real runner, not the harness, connects and ends this NEW client.
        const code = await dataFix("dev", file, options, client);
        assert.ok(lifecycle.ended, "runner must end its injected client before returning");
        return { code, output: output.join("") };
      } finally {
        globalThis.console = originalConsole;
        if (!lifecycle.ended) await client.end();
      }
    }

    const db = admin;
    async function snapshot() {
      return {
        application: (await db.query("SELECT * FROM demos_app.application WHERE id = $1", [APPLICATION_ID])).rows,
        history: (await db.query(
          "SELECT * FROM demos_app.application_history WHERE id = $1 ORDER BY revision_id", [APPLICATION_ID],
        )).rows,
        ledger: (await db.query("SELECT * FROM demos_app.data_fix_log ORDER BY file_name")).rows,
      };
    }
    async function unchangedRun(file: string, expectedCode: number, options = APPLY_OPTIONS) {
      const before = await snapshot();
      const result = await runFix(file, options);
      assert.equal(result.code, expectedCode, result.output);
      assert.deepEqual(await snapshot(), before, "failed, dry-run, or repeated fix must not change data, history, or ledger");
      return result;
    }
    async function assertLedger(fileName: string, sql: string, reverseFile: string | null, reverses: string | null) {
      const rows = (await db.query("SELECT * FROM demos_app.data_fix_log WHERE file_name = $1", [fileName])).rows;
      assert.equal(rows.length, 1);
      const { applied_at: appliedAt, ...metadata } = rows[0];
      assert.ok(appliedAt instanceof Date && Number.isFinite(appliedAt.getTime()));
      assert.deepEqual(metadata, {
        file_name: fileName, checksum: checksum(sql), ticket: TICKET, environment: "dev", rows_affected: 1,
        reverse_file: reverseFile, reverses,
        git_commit: APPLY_OPTIONS.gitCommit, applied_by: APPLY_OPTIONS.appliedBy,
        approved_by: APPLY_OPTIONS.approvedBy, build_url: APPLY_OPTIONS.buildUrl,
      });
    }

    const forward = await pair("multi_statement");
    const initial = await snapshot();
    assert.equal(initial.history.length, 1, "real history trigger must record the seed insert");
    const dryRun = await runFix(forward.forwardPath, { apply: false });
    assert.equal(dryRun.code, 0, dryRun.output);
    assert.match(dryRun.output, /integration_notice/);
    assert.match(dryRun.output, /evidence_count/);
    assert.match(dryRun.output, /checks_passed/);
    assert.deepEqual(await snapshot(), initial);
    pass("multi-statement dry run prints aggregate evidence and RAISE NOTICE; data, history and ledger unchanged");

    const apply = await runFix(forward.forwardPath, APPLY_OPTIONS);
    assert.equal(apply.code, 0, apply.output);
    const applied = await snapshot();
    assert.equal(applied.application[0].is_migrated_from_pmda, true);
    assert.equal(applied.ledger.length, 1);
    await assertLedger(forward.forwardName, forward.forwardSql, forward.reverseName, null);
    assert.deepEqual(applied.history.map((row) => [row.revision_type, row.is_migrated_from_pmda]), [["I", false], ["U", true]]);
    pass("apply atomically commits one ledger row with exact metadata/full-file SHA256 and real history trigger output");

    const repeat = await unchangedRun(forward.forwardPath, 0);
    assert.match(repeat.output, /already applied/i);
    pass("identical repeat is a no-op");
    try {
      await writeFile(forward.forwardPath, forward.forwardSql + "\n-- checksum-only change\n");
      const conflict = await unchangedRun(forward.forwardPath, 1);
      assert.match(conflict.output, /checksum/i);
    } finally {
      await writeFile(forward.forwardPath, forward.forwardSql);
    }
    pass("comment-only full-file checksum conflict fails without side effects");

    const reversed = await runFix(forward.reversePath, APPLY_OPTIONS);
    assert.equal(reversed.code, 0, reversed.output);
    const reverseState = await snapshot();
    assert.equal(reverseState.application[0].is_migrated_from_pmda, false);
    assert.equal(reverseState.ledger.length, 2);
    await assertLedger(forward.reverseName, forward.reverseSql, null, forward.forwardName);
    assert.deepEqual(reverseState.history.map((row) => [row.revision_type, row.is_migrated_from_pmda]),
      [["I", false], ["U", true], ["U", false]]);
    await unchangedRun(forward.forwardPath, 0);
    pass("reverse links to its forward ledger row and does not permit the original fix to reapply");

    const gate = await pair("schema_gate");
    const migration = (await db.query(
      "SELECT id, migration_name, finished_at, rolled_back_at FROM demos_app._prisma_migrations WHERE migration_name = $1",
      [requiredMigration],
    )).rows[0];
    for (const state of ["missing", "unfinished", "rolled_back"] as const) {
      try {
        await db.query(
          "UPDATE demos_app._prisma_migrations SET migration_name = $2, finished_at = $3, rolled_back_at = $4 WHERE id = $1",
          [migration.id, state === "missing" ? `${requiredMigration}_withheld` : requiredMigration,
            state === "unfinished" ? null : migration.finished_at, state === "rolled_back" ? new Date() : null],
        );
        const refusal = await unchangedRun(gate.forwardPath, 1);
        assert.match(refusal.output, /migration/i);
        assert.doesNotMatch(refusal.output, /integration_notice/);
      } finally {
        await db.query(
          "UPDATE demos_app._prisma_migrations SET migration_name = $2, finished_at = $3, rolled_back_at = $4 WHERE id = $1",
          [migration.id, migration.migration_name, migration.finished_at, migration.rolled_back_at],
        );
      }
      pass(`real schema gate rejects ${state} required migration without body execution`);
    }
    const newerMigration = migrationFolders.at(-1);
    assert.ok(newerMigration && newerMigration > requiredMigration);
    try {
      await db.query("UPDATE demos_app._prisma_migrations SET migration_name = $2 WHERE migration_name = $1",
        [newerMigration, `${newerMigration}_withheld`]);
      const before = await snapshot();
      const allowed = await runFix(gate.forwardPath, { apply: false });
      assert.equal(allowed.code, 0, allowed.output);
      assert.match(allowed.output, /integration_notice/);
      assert.deepEqual(await snapshot(), before);
    } finally {
      await db.query("UPDATE demos_app._prisma_migrations SET migration_name = $2 WHERE migration_name = $1",
        [`${newerMigration}_withheld`, newerMigration]);
    }
    pass("a newer unapplied migration does not block a fix requiring an older finished migration");

    const mismatch = await pair("row_mismatch", body(true), 2);
    const mismatchResult = await unchangedRun(mismatch.forwardPath, 1);
    assert.match(mismatchResult.output, /rows|expected|mismatch/i);
    pass("row-count mismatch rolls back data, trigger history and ledger");

    const guard = await pair("guard_exception", `
UPDATE demos_app.application SET is_migrated_from_pmda = true WHERE id = '${APPLICATION_ID}';
DO $$
BEGIN
  RAISE EXCEPTION 'integration_guard_failure';
END
$$;
CREATE TEMPORARY TABLE data_fix_result (rows_affected integer);
INSERT INTO pg_temp.data_fix_result VALUES (1);
SELECT count(*)::integer AS evidence_count FROM demos_app.application WHERE id = '${APPLICATION_ID}';
`);
    const guardResult = await unchangedRun(guard.forwardPath, 1);
    assert.match(guardResult.output, /failed during fix body/);
    const guardLogs = spawnSync("docker", ["logs", "--tail", "40", container], { encoding: "utf8", timeout: 10_000 });
    assert.equal(guardLogs.status, 0);
    assert.match(`${guardLogs.stdout}\n${guardLogs.stderr}`, /ERROR:\s+integration_guard_failure/);
    pass("guard exception after DML rolls back data, trigger history and ledger");

    for (const [label, resultInsert, columnType] of [
      ["empty_result", "", "integer"],
      ["multiple_results", "INSERT INTO pg_temp.data_fix_result VALUES (1), (1);", "integer"],
      ["null_result", "INSERT INTO pg_temp.data_fix_result VALUES (NULL);", "integer"],
      ["text_result", "INSERT INTO pg_temp.data_fix_result VALUES ('1');", "text"],
      ["fractional_result", "INSERT INTO pg_temp.data_fix_result VALUES (1.5);", "numeric"],
    ]) {
      const malformed = await pair(label, `
UPDATE demos_app.application SET is_migrated_from_pmda = true WHERE id = '${APPLICATION_ID}';
CREATE TEMPORARY TABLE data_fix_result (rows_affected ${columnType});
${resultInsert}
SELECT count(*)::integer AS evidence_count FROM demos_app.application WHERE id = '${APPLICATION_ID}';
`);
      await unchangedRun(malformed.forwardPath, 1);
      pass(`${label} is rejected and all writes roll back`);
    }

    const beforePermissions = await snapshot();
    async function denied(role: string, sql: string) {
      await db.query("BEGIN");
      try {
        await db.query(`SET LOCAL ROLE ${role}`);
        assert.equal((await db.query("SELECT current_user")).rows[0].current_user, role);
        await assert.rejects(db.query(sql), (error: unknown) =>
          error instanceof Error && "code" in error && error.code === "42501");
      } finally {
        await db.query("ROLLBACK");
      }
    }
    // Direct role probes complement runner tests: lint deliberately rejects DDL/dynamic SQL first.
    for (const sql of [
      "ALTER TABLE demos_app.application ADD COLUMN integration_denied integer",
      "ALTER TABLE demos_app.application DISABLE TRIGGER ALL",
      "TRUNCATE demos_app.application",
      "DROP TABLE demos_app.application",
      "CREATE TABLE demos_app.integration_denied (id integer)",
      "INSERT INTO demos_app.data_fix_log SELECT * FROM demos_app.data_fix_log WHERE false",
    ]) {
      await denied("demos_data_fix", sql);
    }
    pass("least-role denies ALTER, trigger disabling, TRUNCATE, DROP, CREATE and ledger INSERT (SQLSTATE 42501)");

    for (const role of ["demos_write", "demos_delete", "demos_data_fix"]) {
      for (const privilege of ["UPDATE", "DELETE", "TRUNCATE"]) {
        const allowed = (await db.query("SELECT has_table_privilege($1, 'demos_app.data_fix_log', $2) AS allowed", [role, privilege])).rows[0].allowed;
        assert.equal(allowed, false, `${role} must not have ledger ${privilege}`);
      }
      for (const sql of [
        "UPDATE demos_app.data_fix_log SET rows_affected = 0",
        "DELETE FROM demos_app.data_fix_log",
        "TRUNCATE demos_app.data_fix_log",
      ]) await denied(role, sql);
    }
    for (const role of ["demos_write", "demos_delete"]) {
      assert.equal((await db.query("SELECT has_table_privilege($1, 'demos_app.data_fix_log', 'INSERT') AS allowed", [role])).rows[0].allowed, role === "demos_write");
    }
    await db.query("BEGIN");
    try {
      await db.query("SET LOCAL ROLE demos_data_fix");
      assert.equal((await db.query("SELECT count(*)::integer AS count FROM demos_app.data_fix_log")).rows[0].count, 2);
    } finally {
      await db.query("ROLLBACK");
    }
    assert.deepEqual(await snapshot(), beforePermissions);
    pass("ledger is append-only for app roles and read-only for demos_data_fix");
    console.log(`Integration complete: ${passed} checks passed on PostgreSQL ${version}`);
  } catch (error) {
    if (containerAttempted) {
      const logs = spawnSync("docker", ["logs", "--tail", "40", container], { encoding: "utf8", timeout: 10_000 });
      console.error("Throwaway PostgreSQL diagnostics:", logs.stdout, logs.stderr);
    }
    throw error;
  } finally {
    try {
      if (admin) await admin.end();
    } finally {
      try {
        if (containerAttempted) command("docker", ["rm", "--force", container]);
      } finally {
        process.chdir(originalCwd);
        if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
      }
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
