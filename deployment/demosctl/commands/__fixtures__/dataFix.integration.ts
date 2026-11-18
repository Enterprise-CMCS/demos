// Run from deployment/: npm run test:data-fix:integration
// Requires a prepared local devcontainer database; it never creates or refreshes database objects.
// Current coverage includes dry-run, apply/no-op/checksum protection, reversal, and scoped failure/access probes.
// It does not test bootstrap repeatability or a non-superuser login; owned cleanup never resets sequences.
// On cleanup failure, use deployment/.data-fix-integration-recovery/ for targeted recovery; forced termination is not covered.
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
  assertIntegrationPrerequisites,
  assertRunScopeAvailable,
  cleanupOwnedGraph,
  createRunScope,
  localDatabaseConfig,
  ownedSnapshot,
  quoteFixtureUuid,
  seedOwnedGraph,
  withOwnedCleanup,
  writeOwnershipManifest,
} from "./dataFix.integrationSupport.js";

// @ts-expect-error tsx runs this file as ESM; deployment's shared TypeScript config is CommonJS.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const SERVER = join(ROOT, "server");
const DEPLOYMENT = join(ROOT, "deployment");
const MIGRATIONS = join(SERVER, "src/model/migrations");
const RECOVERY_DIRECTORY = join(DEPLOYMENT, ".data-fix-integration-recovery");
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
  expectedRows = 1,
): string {
  return `-- ticket: ${TICKET}
-- author: synthetic-integration-author
-- data_owner: synthetic-integration-owner
-- environments: dev
-- expected_rows: ${expectedRows}
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
  config: ReturnType<typeof localDatabaseConfig>,
  options: DataFixOptions,
) {
  const client = new Client(config);
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
    const { dataFix } = await import("../dataFix.js");
    const code = await dataFix("dev", filePath, options, client);
    assert.ok(lifecycle.ended, "the real runner must end its injected client");
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

type FailureScenario = {
  sql: string;
  expectedMessage: RegExp;
  expectedRows?: number;
  apply?: boolean;
};

async function assertFailureScenario(
  database: Client,
  config: ReturnType<typeof localDatabaseConfig>,
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
    scenario.expectedRows,
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

async function runOwnedRoleProbe(database: Client, applicationId: string): Promise<void> {
  await database.query("BEGIN");
  try {
    await database.query("SET LOCAL ROLE demos_data_fix");
    const role = await database.query<{ current_user: string }>("SELECT current_user");
    assert.equal(role.rows[0]?.current_user, "demos_data_fix");
    const update = await database.query(
      "UPDATE demos_app.application SET is_migrated_from_pmda = NOT is_migrated_from_pmda WHERE id = $1",
      [applicationId],
    );
    assert.equal(update.rowCount, 1, "demos_data_fix should update the owned application row");
    await database.query("SET CONSTRAINTS ALL IMMEDIATE");
  } catch (error) {
    try {
      await database.query("ROLLBACK");
    } catch {
      // Preserve the probe error if rollback itself also fails.
    }
    throw error;
  }
  await database.query("ROLLBACK");
}

async function main(): Promise<void> {
  let database: Client | undefined;
  let connected = false;
  let temporaryDirectory: string | undefined;
  let runError: unknown;

  try {
    try {
      process.loadEnvFile(join(SERVER, ".env"));
    } catch {
      throw new Error("Unable to load server/.env. Configure the local devcontainer before running this fixture.");
    }

    const config = localDatabaseConfig(process.env);
    const requiredMigration = await findRequiredMigration();
    const scope = createRunScope();
    const applicationIdLiteral = quoteFixtureUuid(scope.applicationId);
    const personIdLiteral = quoteFixtureUuid(scope.personId);
    temporaryDirectory = await mkdtemp(join(tmpdir(), "demos-data-fix-it-"));
    database = new Client(config);
    await database.connect();
    connected = true;
    await assertIntegrationPrerequisites(database, requiredMigration);
    await assertRunScopeAvailable(database, scope);

    const forwardPath = join(temporaryDirectory, scope.forwardFileName);
    const reversePath = join(temporaryDirectory, scope.reverseFileName);
    await writeFile(forwardPath, fixHeader(requiredMigration, scope.forwardFileName, scope.reverseFileName, false) + body(scope.applicationId, true));
    await writeFile(reversePath, fixHeader(requiredMigration, scope.forwardFileName, scope.reverseFileName, true) + body(scope.applicationId, false));

    let seedAttempted = false;
    console.log("Using the prepared devcontainer database at db/demos; no connection details are displayed.");
    await withOwnedCleanup(
      async () => {
        seedAttempted = true;
        await seedOwnedGraph(database!, scope);
        const before = await ownedSnapshot(database!, scope);
        assert.equal(before.application.length, 1);
        assert.equal(before.demonstration.length, 1);
        assert.equal(before.person.length, 1);
        assert.ok(before.applicationPhase.length > 0, "application insert trigger should create phases");
        assert.ok(before.applicationDate.length > 0, "application insert trigger should create the concept start date");
        assert.ok(before.applicationPhase.some((row) => {
          const phase = row as { phase_id: string; phase_status_id: string };
          return phase.phase_id === "Concept" && phase.phase_status_id === "Started";
        }));
        assert.ok(before.applicationDate.some((row) => {
          const date = row as { date_type_id: string };
          return date.date_type_id === "Concept Start Date";
        }));
        assert.equal(before.demonstrationRoleAssignment.length, 1);
        assert.equal(before.primaryDemonstrationRoleAssignment.length, 1);
        assert.ok(before.personState.length > 0, "person-state trigger should seed state rows");
        assert.equal(before.ledger.length, 0, "generated filenames must not exist in the ledger before the run");

        await runOwnedRoleProbe(database!, scope.applicationId);
        assert.deepEqual(await ownedSnapshot(database!, scope), before,
          "the demos_data_fix owned-row privilege probe must roll back its history and application update");

        const forwardSql = fixHeader(requiredMigration, scope.forwardFileName, scope.reverseFileName, false) + body(scope.applicationId, true);
        const result = await runFix(forwardPath, config, { apply: false });
        assert.equal(result.code, 0, result.output);
        assert.match(result.output, /rows affected:\s*1/);
        assert.match(result.output, /evidence_count/);
        assert.match(result.output, /checks_passed/);
        assert.match(result.output, /integration_notice/);
        assert.deepEqual(await ownedSnapshot(database!, scope), before,
          "dry run must roll back only this run's application, history, and ledger state");
        console.log("PASS real multi-statement dry run returned aggregate evidence and rolled back owned state.");

        await assertFailureScenario(database!, config, scope, requiredMigration, forwardPath, forwardSql, {
          sql: body(scope.applicationId, true),
          expectedRows: 2,
          expectedMessage: /row count mismatch: expected 2, got 1/,
        });
        console.log("PASS row-count mismatch rolled back owned data and history.");

        await assertFailureScenario(database!, config, scope, requiredMigration, forwardPath, forwardSql, {
          sql: `UPDATE demos_app.application SET is_migrated_from_pmda = true WHERE id = ${applicationIdLiteral};
DELETE FROM demos_app.demonstration WHERE id = ${applicationIdLiteral};
CREATE TEMPORARY TABLE data_fix_result (rows_affected integer);
INSERT INTO pg_temp.data_fix_result VALUES (1);
SELECT count(*)::integer AS evidence_count FROM demos_app.application WHERE id = ${applicationIdLiteral};
`,
          expectedMessage: /data fix failed during fix body/,
        });
        console.log("PASS SQL guard exception was redacted and rolled back owned data and history.");

        await assertFailureScenario(database!, config, scope, requiredMigration, forwardPath, forwardSql, {
          sql: `UPDATE demos_app.application SET is_migrated_from_pmda = true WHERE id = ${applicationIdLiteral};
CREATE TEMPORARY TABLE data_fix_result (rows_affected text);
INSERT INTO pg_temp.data_fix_result VALUES ('1');
SELECT count(*)::integer AS evidence_count FROM demos_app.application WHERE id = ${applicationIdLiteral};
`,
          expectedMessage: /data_fix_result must contain exactly one integer rows_affected/,
        });
        console.log("PASS malformed result was rejected and rolled back owned data and history.");

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
        console.log("PASS deferred role guard rejected dry-run and apply without exposing database errors.");

        const apply = await runFix(forwardPath, config, APPLY_OPTIONS);
        assert.equal(apply.code, 0, apply.output);
        assert.match(apply.output, /applied:/);
        const committed = await ownedSnapshot(database!, scope);
        const appliedApplication = committed.application.at(0) as { is_migrated_from_pmda: boolean } | undefined;
        assert.equal(appliedApplication?.is_migrated_from_pmda, true);
        assert.equal(committed.ledger.length, 1);
        await assertLedgerRow(database!, scope.forwardFileName, forwardSql, scope.reverseFileName, null);
        assert.equal(committed.history.application.length, before.history.application.length + 1);
        assert.deepEqual(committed.history.application.slice(0, before.history.application.length), before.history.application);
        const updateHistory = committed.history.application.at(-1) as {
          revision_type: string;
          is_migrated_from_pmda: boolean;
        } | undefined;
        assert.ok(updateHistory, "apply should create an application history row");
        assert.equal(updateHistory.revision_type, "U");
        assert.equal(updateHistory.is_migrated_from_pmda, true);
        assert.deepEqual(committed.applicationDate, before.applicationDate);
        assert.deepEqual(committed.applicationPhase, before.applicationPhase);
        assert.deepEqual(committed.demonstration, before.demonstration);
        assert.deepEqual(committed.demonstrationRoleAssignment, before.demonstrationRoleAssignment);
        assert.deepEqual(committed.person, before.person);
        assert.deepEqual(committed.personState, before.personState);
        assert.deepEqual(committed.primaryDemonstrationRoleAssignment, before.primaryDemonstrationRoleAssignment);
        for (const historyTable of [
          "applicationDate",
          "applicationPhase",
          "demonstration",
          "demonstrationRoleAssignment",
          "person",
          "personState",
          "primaryDemonstrationRoleAssignment",
        ] as const) {
          assert.deepEqual(committed.history[historyTable], before.history[historyTable]);
        }
        console.log("PASS apply committed the expected value, one history delta, and exact ledger metadata/checksum.");

        const repeat = await runFix(forwardPath, config, APPLY_OPTIONS);
        assert.equal(repeat.code, 0, repeat.output);
        assert.match(repeat.output, /already applied:/);
        assert.deepEqual(await ownedSnapshot(database!, scope), committed,
          "an identical repeat must not change owned data, history, or ledger state");
        console.log("PASS identical repeat is a successful no-op.");

        try {
          await writeFile(forwardPath, `${forwardSql}\n-- checksum-only change\n`);
          const conflict = await runFix(forwardPath, config, APPLY_OPTIONS);
          assert.equal(conflict.code, 1);
          assert.match(conflict.output, /already applied with a different checksum/i);
          assert.deepEqual(await ownedSnapshot(database!, scope), committed,
            "a checksum conflict must not change owned data, history, or ledger state");
        } finally {
          await writeFile(forwardPath, forwardSql);
        }
        console.log("PASS comment-only checksum conflict was refused without side effects.");

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
        assert.equal(reversed.history.application.length, committed.history.application.length + 1);
        assert.deepEqual(reversed.history.application.slice(0, committed.history.application.length), committed.history.application);
        const reverseHistory = reversed.history.application.at(-1) as {
          revision_type: string;
          is_migrated_from_pmda: boolean;
        } | undefined;
        assert.ok(reverseHistory, "reverse apply should create an application history row");
        assert.equal(reverseHistory.revision_type, "U");
        assert.equal(reverseHistory.is_migrated_from_pmda, false);
        assert.deepEqual(reversed.applicationDate, committed.applicationDate);
        assert.deepEqual(reversed.applicationPhase, committed.applicationPhase);
        assert.deepEqual(reversed.demonstration, committed.demonstration);
        assert.deepEqual(reversed.demonstrationRoleAssignment, committed.demonstrationRoleAssignment);
        assert.deepEqual(reversed.person, committed.person);
        assert.deepEqual(reversed.personState, committed.personState);
        assert.deepEqual(reversed.primaryDemonstrationRoleAssignment, committed.primaryDemonstrationRoleAssignment);
        for (const historyTable of [
          "applicationDate",
          "applicationPhase",
          "demonstration",
          "demonstrationRoleAssignment",
          "person",
          "personState",
          "primaryDemonstrationRoleAssignment",
        ] as const) {
          assert.deepEqual(reversed.history[historyTable], committed.history[historyTable]);
        }
        console.log("PASS reversal restored the application value and recorded its linked audit row and history delta.");

        const forwardAfterReverse = await runFix(forwardPath, config, APPLY_OPTIONS);
        assert.equal(forwardAfterReverse.code, 0, forwardAfterReverse.output);
        assert.match(forwardAfterReverse.output, /already applied:/);
        assert.deepEqual(await ownedSnapshot(database!, scope), reversed,
          "the original forward fix must remain a no-op after reversal");
        console.log("PASS the original forward file cannot reapply after reversal.");
      },
      async () => {
        if (!seedAttempted || !database) {
          return;
        }
        try {
          await cleanupOwnedGraph(database, scope);
        } catch (error) {
          let recovery = "ownership manifest could not be saved";
          try {
            recovery = `ownership manifest: ${await writeOwnershipManifest(RECOVERY_DIRECTORY, scope)}`;
          } catch {
            // Report the non-secret identifiers when the manifest itself cannot be retained.
            recovery = `recovery IDs: application=${scope.applicationId}, person=${scope.personId}`;
          }
          throw new Error(`owned cleanup failed (${error instanceof Error ? error.message : "unknown failure"}); ${recovery}`);
        }
      },
      (error) => console.error(`CLEANUP FAILURE: ${error instanceof Error ? error.message : "unknown cleanup failure"}`),
    );
    console.log("PASS owned graph, trigger history, and registered ledger entries are absent after cleanup.");
    console.log("Integration complete: dry-run, apply, duplicate, checksum, and reversal coverage; sequences are not reset.");
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
    console.error(`FAIL: ${runError instanceof Error ? runError.message : "data-fix integration failed"}`);
    process.exitCode = 1;
  }
}

void main();
