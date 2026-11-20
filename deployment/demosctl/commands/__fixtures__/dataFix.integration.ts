// Invoked by the opt-in Vitest config after the disposable PostgreSQL instance has been migrated and refreshed.
import assert from "node:assert/strict";
import { Console } from "node:console";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Writable } from "node:stream";
import { Client } from "pg";

import {
  assertLedgerAccessPolicy,
  createRunScope,
  disposableDatabaseConfig,
  ownedSnapshot,
  quoteFixtureUuid,
  seedOwnedGraph,
} from "./dataFix.integrationSupport.js";

// @ts-expect-error tsx runs this file as ESM; deployment's shared TypeScript config is CommonJS.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const SERVER = join(ROOT, "server");
const MIGRATIONS = join(SERVER, "src/model/migrations");
const TICKET = "DEMOS-99999";
const APPLY_OPTIONS = {
  apply: true,
  approvedBy: "synthetic-approver",
  appliedBy: "synthetic-operator",
  gitCommit: "a".repeat(40),
  buildUrl: "https://ci.invalid/job/data-fix/1/",
};

type DataFixOptions = typeof APPLY_OPTIONS | { apply: false };

function body(applicationId: string, target: boolean): string {
  const applicationIdLiteral = quoteFixtureUuid(applicationId);
  return `DO $$
BEGIN
  IF (SELECT count(*) FROM demos_app.application
      WHERE id = ${applicationIdLiteral} AND is_migrated_from_pmda = ${!target}) <> 1 THEN
    RAISE EXCEPTION 'synthetic precondition failed';
  END IF;
  RAISE NOTICE 'integration_notice: precondition_count=1';
END
$$;
CREATE TEMPORARY TABLE data_fix_result (rows_affected integer);
WITH changed AS (
  UPDATE demos_app.application SET is_migrated_from_pmda = ${target}
  WHERE id = ${applicationIdLiteral} AND is_migrated_from_pmda = ${!target}
  RETURNING 1
)
INSERT INTO pg_temp.data_fix_result SELECT count(*)::integer FROM changed;
SELECT count(*)::integer AS evidence_count,
       bool_and(is_migrated_from_pmda = ${target}) AS checks_passed
FROM demos_app.application WHERE id = ${applicationIdLiteral};
`;
}

function checksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

function fixHeader(
  requiredMigration: string,
  forwardFileName: string,
  reverseFileName: string,
  reverse: boolean,
): string {
  return `-- ticket: ${TICKET}
-- author: synthetic-integration-author
-- data_owner: synthetic-integration-owner
-- environments: dev
-- expected_rows: 1
-- source: local synthetic integration fixture, no external data
-- runner: demosctl
-- requires_migration: ${requiredMigration}
-- reverse: ${reverse ? "none" : reverseFileName}
${reverse ? `-- reverses: ${forwardFileName}\n` : ""}
`;
}

async function findRequiredMigration(): Promise<string> {
  const entries = await readdir(MIGRATIONS, { withFileTypes: true });
  const migration = entries.find((entry) => entry.isDirectory() && entry.name.endsWith("_add_data_fix_log"))?.name;
  if (!migration) {
    throw new Error("The data-fix ledger migration is missing from this checkout.");
  }
  return migration;
}

async function runFix(
  filePath: string,
  config: ReturnType<typeof disposableDatabaseConfig>,
  options: DataFixOptions,
) {
  const client = new Client(config);
  const lifecycle = { ended: false, errored: false };
  client.on("end", () => { lifecycle.ended = true; });
  client.on("error", () => { lifecycle.errored = true; });
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
    const { dataFix } = await import("../dataFix.js");
    const code = await dataFix("dev", filePath, options, client);
    assert.ok(lifecycle.ended, "the real runner must end its injected client");
    assert.ok(!lifecycle.errored, "the real runner client must not emit a connection error");
    return { code, output: output.join("") };
  } finally {
    globalThis.console = originalConsole;
    if (!lifecycle.ended) {
      await client.end();
    }
  }
}

async function assertLedgerRow(
  client: Client,
  fileName: string,
  sql: string,
  reverseFile: string | null,
  reverses: string | null,
): Promise<void> {
  const rows = await client.query("SELECT * FROM demos_app.data_fix_log WHERE file_name = $1", [fileName]);
  assert.equal(rows.rows.length, 1);
  const { applied_at: appliedAt, ...metadata } = rows.rows[0];
  assert.ok(appliedAt instanceof Date && Number.isFinite(appliedAt.getTime()));
  assert.deepEqual(metadata, {
    file_name: fileName,
    checksum: checksum(sql),
    ticket: TICKET,
    environment: "dev",
    rows_affected: 1,
    reverse_file: reverseFile,
    reverses,
    git_commit: APPLY_OPTIONS.gitCommit,
    applied_by: APPLY_OPTIONS.appliedBy,
    approved_by: APPLY_OPTIONS.approvedBy,
    build_url: APPLY_OPTIONS.buildUrl,
  });
}

type IntegrationSnapshot = Awaited<ReturnType<typeof ownedSnapshot>>;

function assertApplicationHistoryDelta(
  before: IntegrationSnapshot,
  after: IntegrationSnapshot,
  expectedValue: boolean,
): void {
  assert.equal(after.history.application.length, before.history.application.length + 1);
  assert.deepEqual(after.history.application.slice(0, before.history.application.length), before.history.application);
  const historyRow = after.history.application.at(-1) as {
    revision_type: string;
    is_migrated_from_pmda: boolean;
  } | undefined;
  assert.ok(historyRow, "data-fix application update should create an application history row");
  assert.equal(historyRow.revision_type, "U");
  assert.equal(historyRow.is_migrated_from_pmda, expectedValue);

  for (const table of [
    "applicationDate",
    "applicationPhase",
    "demonstration",
    "demonstrationRoleAssignment",
    "person",
    "personState",
    "primaryDemonstrationRoleAssignment",
  ] as const) {
    assert.deepEqual(after[table], before[table]);
  }

  for (const historyTable of [
    "applicationDate",
    "applicationPhase",
    "demonstration",
    "demonstrationRoleAssignment",
    "person",
    "personState",
    "primaryDemonstrationRoleAssignment",
  ] as const) {
    assert.deepEqual(after.history[historyTable], before.history[historyTable]);
  }
}

type FailureScenario = {
  sql: string;
  expectedMessage: RegExp;
  apply?: boolean;
};

async function assertFailureScenario(
  database: Client,
  config: ReturnType<typeof disposableDatabaseConfig>,
  scope: ReturnType<typeof createRunScope>,
  requiredMigration: string,
  forwardPath: string,
  originalSql: string,
  scenario: FailureScenario,
): Promise<void> {
  const contents = fixHeader(
    requiredMigration,
    scope.forwardFileName,
    scope.reverseFileName,
    false,
  ) + scenario.sql;
  await writeFile(forwardPath, contents);
  try {
    const before = await ownedSnapshot(database, scope);
    const result = await runFix(forwardPath, config, scenario.apply === false ? { apply: false } : APPLY_OPTIONS);
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, scenario.expectedMessage);
    assert.doesNotMatch(result.output, /Cannot delete from demos_app\.demonstration|Cannot remove the primary project officer|postgresql:\/\//i);
    assert.deepEqual(await ownedSnapshot(database, scope), before,
      "failed runner scenarios must roll back this run's application, history, and ledger state");
  } finally {
    await writeFile(forwardPath, originalSql);
  }
}

async function assertDemonstrationGuardTrigger(database: Client, applicationId: string): Promise<void> {
  await database.query("BEGIN");
  try {
    await assert.rejects(
      database.query("DELETE FROM demos_app.demonstration WHERE id = $1", [applicationId]),
      /Cannot delete from demos_app\.demonstration table while the corresponding record is in demos_app\.application/,
    );
  } finally {
    await database.query("ROLLBACK");
  }
}

export async function runDataFixIntegration(): Promise<void> {
  let database: Client | undefined;
  let connected = false;
  let temporaryDirectory: string | undefined;
  let runError: unknown;
  let databaseErrored = false;

  try {
    const config = disposableDatabaseConfig(process.env);
    const requiredMigration = await findRequiredMigration();
    const scope = createRunScope();
    const applicationIdLiteral = quoteFixtureUuid(scope.applicationId);
    const personIdLiteral = quoteFixtureUuid(scope.personId);
    temporaryDirectory = await mkdtemp(join(tmpdir(), "demos-data-fix-it-"));
    database = new Client(config);
    database.on("error", () => { databaseErrored = true; });
    await database.connect();
    connected = true;
    await assertLedgerAccessPolicy(database);

    const forwardPath = join(temporaryDirectory, scope.forwardFileName);
    const reversePath = join(temporaryDirectory, scope.reverseFileName);
    await writeFile(forwardPath, fixHeader(requiredMigration, scope.forwardFileName, scope.reverseFileName, false) + body(scope.applicationId, true));
    await writeFile(reversePath, fixHeader(requiredMigration, scope.forwardFileName, scope.reverseFileName, true) + body(scope.applicationId, false));

    const runScenarios = async (): Promise<void> => {
      await seedOwnedGraph(database!, scope);
      const before = await ownedSnapshot(database!, scope);
      await assertDemonstrationGuardTrigger(database!, scope.applicationId);
      assert.deepEqual(await ownedSnapshot(database!, scope), before,
        "the demonstration guard trigger probe must roll back its transaction");

      const forwardSql = fixHeader(requiredMigration, scope.forwardFileName, scope.reverseFileName, false) + body(scope.applicationId, true);
      const result = await runFix(forwardPath, config, { apply: false });
      assert.equal(result.code, 0, result.output);
      assert.deepEqual(await ownedSnapshot(database!, scope), before,
        "dry run must roll back only this run's application, history, and ledger state");

      await assertFailureScenario(database!, config, scope, requiredMigration, forwardPath, forwardSql, {
        sql: `UPDATE demos_app.application SET is_migrated_from_pmda = true WHERE id = ${applicationIdLiteral};
DELETE FROM demos_app.demonstration WHERE id = ${applicationIdLiteral};
CREATE TEMPORARY TABLE data_fix_result (rows_affected integer);
INSERT INTO pg_temp.data_fix_result VALUES (1);
SELECT count(*)::integer AS evidence_count FROM demos_app.application WHERE id = ${applicationIdLiteral};
`,
        expectedMessage: /data fix failed during fix body/,
      });

      const deferredViolationSql = `DELETE FROM demos_app.primary_demonstration_role_assignment
WHERE demonstration_id = ${applicationIdLiteral} AND person_id = ${personIdLiteral};
CREATE TEMPORARY TABLE data_fix_result (rows_affected integer);
INSERT INTO pg_temp.data_fix_result VALUES (1);
SELECT count(*)::integer AS evidence_count
FROM demos_app.demonstration WHERE id = ${applicationIdLiteral};
`;
      await assertFailureScenario(database!, config, scope, requiredMigration, forwardPath, forwardSql, {
        sql: deferredViolationSql,
        expectedMessage: /data fix failed during deferred constraints/,
        apply: false,
      });
      await assertFailureScenario(database!, config, scope, requiredMigration, forwardPath, forwardSql, {
        sql: deferredViolationSql,
        expectedMessage: /data fix failed during deferred constraints/,
      });

      const apply = await runFix(forwardPath, config, APPLY_OPTIONS);
      assert.equal(apply.code, 0, apply.output);
      assert.match(apply.output, /applied:/);
      const committed = await ownedSnapshot(database!, scope);
      const appliedApplication = committed.application.at(0) as { is_migrated_from_pmda: boolean } | undefined;
      assert.equal(appliedApplication?.is_migrated_from_pmda, true);
      assert.equal(committed.ledger.length, 1);
      await assertLedgerRow(database!, scope.forwardFileName, forwardSql, scope.reverseFileName, null);
      assertApplicationHistoryDelta(before, committed, true);

      const repeat = await runFix(forwardPath, config, APPLY_OPTIONS);
      assert.equal(repeat.code, 0, repeat.output);
      assert.match(repeat.output, /already applied:/);
      assert.deepEqual(await ownedSnapshot(database!, scope), committed,
        "an identical repeat must not change owned data, history, or ledger state");

      const reverseSql = fixHeader(requiredMigration, scope.forwardFileName, scope.reverseFileName, true) + body(scope.applicationId, false);
      const reverse = await runFix(reversePath, config, APPLY_OPTIONS);
      assert.equal(reverse.code, 0, reverse.output);
      assert.match(reverse.output, /applied:/);
      const reversed = await ownedSnapshot(database!, scope);
      const restoredApplication = reversed.application.at(0) as { is_migrated_from_pmda: boolean } | undefined;
      assert.equal(restoredApplication?.is_migrated_from_pmda, false);
      assert.equal(reversed.ledger.length, 2);
      await assertLedgerRow(database!, scope.forwardFileName, forwardSql, scope.reverseFileName, null);
      await assertLedgerRow(database!, scope.reverseFileName, reverseSql, null, scope.forwardFileName);
      assertApplicationHistoryDelta(committed, reversed, false);
    };
    await runScenarios();
    assert.ok(!databaseErrored, "the integration database client must not emit a connection error");
  } catch (error) {
    runError = error;
  } finally {
    if (connected && database) {
      try {
        await database.end();
      } catch (error) {
        console.error(`DATABASE CLOSE FAILURE: ${error instanceof Error ? error.message : "unknown failure"}`);
        if (runError === undefined) {
          runError = error;
        }
      }
    }
    if (temporaryDirectory) {
      try {
        await rm(temporaryDirectory, { recursive: true, force: true });
      } catch (error) {
        console.error(`TEMPORARY FILE CLEANUP FAILURE: ${error instanceof Error ? error.message : "unknown failure"}`);
        if (runError === undefined) {
          runError = error;
        }
      }
    }
  }

  if (runError !== undefined) {
    throw runError;
  }
}
