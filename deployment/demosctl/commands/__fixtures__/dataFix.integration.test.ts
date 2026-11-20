import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "node:util";
import { Client } from "pg";

import { dataFix } from "../dataFix.js";
import {
  assertLedgerAccessPolicy,
  createRunScope,
  disposableDatabaseConfig,
  integrationState,
  quoteFixtureUuid,
  seedOwnedGraph,
  type IntegrationState,
  type RunScope,
} from "./dataFix.integrationSupport.js";

// @ts-expect-error tsx runs this file as ESM; deployment's shared TypeScript config is CommonJS.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const MIGRATIONS = join(ROOT, "server", "src/model/migrations");
const TICKET = "DEMOS-99999";
const APPLY_OPTIONS = {
  apply: true,
  approvedBy: "synthetic-approver",
  appliedBy: "synthetic-operator",
  gitCommit: "a".repeat(40),
  buildUrl: "https://ci.invalid/job/data-fix/1/",
};
const CLEANUP_TIMEOUT_MS = 15_000;

type DataFixOptions = typeof APPLY_OPTIONS | { apply: false };

function withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function body(applicationId: string, target: boolean): string {
  const applicationIdLiteral = quoteFixtureUuid(applicationId);
  return `CREATE TEMPORARY TABLE data_fix_result (rows_affected integer);
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

function fixHeader(requiredMigration: string, scope: RunScope, reverse: boolean): string {
  return `-- ticket: ${TICKET}
-- author: synthetic-integration-author
-- data_owner: synthetic-integration-owner
-- environments: dev
-- expected_rows: 1
-- source: local synthetic integration fixture, no external data
-- runner: demosctl
-- requires_migration: ${requiredMigration}
-- reverse: ${reverse ? "none" : scope.reverseFileName}
${reverse ? `-- reverses: ${scope.forwardFileName}\n` : ""}`;
}

async function findRequiredMigration(): Promise<string> {
  const entries = await readdir(MIGRATIONS, { withFileTypes: true });
  const migration = entries.find((entry) => entry.isDirectory() && entry.name.endsWith("_add_data_fix_log"))?.name;
  if (!migration) throw new Error("The data-fix ledger migration is missing from this checkout.");
  return migration;
}

async function writeFixPair(
  directory: string,
  scope: RunScope,
  requiredMigration: string,
  forwardBody: string,
  reverseBody: string,
): Promise<{ forwardPath: string; forwardSql: string; reverseSql: string }> {
  const forwardPath = join(directory, scope.forwardFileName);
  const reversePath = join(directory, scope.reverseFileName);
  const forwardSql = fixHeader(requiredMigration, scope, false) + forwardBody;
  const reverseSql = fixHeader(requiredMigration, scope, true) + reverseBody;
  await Promise.all([writeFile(forwardPath, forwardSql), writeFile(reversePath, reverseSql)]);
  return { forwardPath, forwardSql, reverseSql };
}

async function runFix(
  filePath: string,
  config: ReturnType<typeof disposableDatabaseConfig>,
  options: DataFixOptions,
): Promise<{ code: number; output: string }> {
  const client = new Client(config);
  const lifecycle = { ended: false, errored: false };
  client.on("end", () => { lifecycle.ended = true; });
  client.on("error", () => { lifecycle.errored = true; });
  const output: string[] = [];
  const log = vi.spyOn(console, "log").mockImplementation((...values) => output.push(format(...values)));
  const error = vi.spyOn(console, "error").mockImplementation((...values) => output.push(format(...values)));
  try {
    const code = await dataFix("dev", filePath, options, client);
    assert.ok(lifecycle.ended, "the real runner must end its injected client");
    assert.ok(!lifecycle.errored, "the real runner client must not emit a connection error");
    return { code, output: output.join("\n") };
  } finally {
    log.mockRestore();
    error.mockRestore();
    if (!lifecycle.ended) {
      await withTimeout(client.end(), CLEANUP_TIMEOUT_MS, "data-fix runner connection cleanup timed out");
    }
  }
}

function assertApplicationHistoryDelta(before: IntegrationState, after: IntegrationState, expectedValue: boolean): void {
  assert.equal(after.applicationHistory.length, before.applicationHistory.length + 1);
  assert.deepEqual(after.applicationHistory.slice(0, before.applicationHistory.length), before.applicationHistory);
  assert.deepEqual(after.applicationHistory.at(-1), {
    revision_id: after.applicationHistory.at(-1)?.revision_id,
    revision_type: "U",
    is_migrated_from_pmda: expectedValue,
  });
}

function assertLedgerRow(
  state: IntegrationState,
  fileName: string,
  sql: string,
  reverseFile: string | null,
  reverses: string | null,
): void {
  const row = state.ledger.find((entry) => entry.file_name === fileName);
  assert.ok(row, `expected ledger row for ${fileName}`);
  assert.deepEqual(row, {
    file_name: fileName,
    checksum: checksum(sql),
    reverse_file: reverseFile,
    reverses,
  });
}

async function demonstrationState(database: Client, applicationId: string) {
  const demonstration = await database.query("SELECT id FROM demos_app.demonstration WHERE id = $1", [applicationId]);
  const history = await database.query(
    "SELECT revision_id FROM demos_app.demonstration_history WHERE id = $1 ORDER BY revision_id",
    [applicationId],
  );
  return { demonstration: demonstration.rows, history: history.rows };
}

async function primaryOfficerState(database: Client, scope: RunScope) {
  const assignment = await database.query(
    `SELECT person_id, demonstration_id, role_id FROM demos_app.primary_demonstration_role_assignment
     WHERE demonstration_id = $1 AND person_id = $2 ORDER BY role_id`,
    [scope.applicationId, scope.personId],
  );
  const history = await database.query(
    `SELECT revision_id FROM demos_app.primary_demonstration_role_assignment_history
     WHERE demonstration_id = $1 AND person_id = $2 ORDER BY revision_id`,
    [scope.applicationId, scope.personId],
  );
  return { assignment: assignment.rows, history: history.rows };
}

async function assertDemonstrationGuardTrigger(database: Client, applicationId: string): Promise<void> {
  await database.query("BEGIN");
  try {
    await database.query("SET LOCAL ROLE demos_data_fix");
    const role = await database.query<{ current_user: string }>("SELECT current_user");
    assert.equal(role.rows[0]?.current_user, "demos_data_fix");
    await assert.rejects(
      database.query("DELETE FROM demos_app.demonstration WHERE id = $1", [applicationId]),
      /Cannot delete from demos_app\.demonstration table while the corresponding record is in demos_app\.application/,
    );
  } finally {
    await database.query("ROLLBACK");
  }
}

describe("data-fix disposable PostgreSQL integration", () => {
  let config: ReturnType<typeof disposableDatabaseConfig>;
  let database: Client;
  let connected = false;
  let databaseErrored = false;
  let requiredMigration: string;
  let scope: RunScope;
  let temporaryDirectory: string;

  beforeAll(async () => {
    config = disposableDatabaseConfig(process.env);
    requiredMigration = await findRequiredMigration();
    database = new Client(config);
    database.on("error", () => { databaseErrored = true; });
    await database.connect();
    connected = true;
    await database.query("SET lock_timeout = '5s'");
    await database.query("SET statement_timeout = '10s'");
    await database.query("SET idle_in_transaction_session_timeout = '10s'");
    await assertLedgerAccessPolicy(database);
  });

  beforeEach(async () => {
    scope = createRunScope();
    temporaryDirectory = await mkdtemp(join(tmpdir(), "demos-data-fix-it-"));
    await seedOwnedGraph(database, scope);
  });

  afterEach(async () => {
    if (temporaryDirectory) {
      await withTimeout(rm(temporaryDirectory, { recursive: true, force: true }), CLEANUP_TIMEOUT_MS,
        "data-fix fixture cleanup timed out");
    }
    assert.ok(!databaseErrored, "the integration database client must not emit a connection error");
  });

  afterAll(async () => {
    if (connected) {
      await withTimeout(database.end(), CLEANUP_TIMEOUT_MS, "integration database connection cleanup timed out");
    }
    assert.ok(!databaseErrored, "the integration database client must not emit a connection error");
  });

  const writePair = (forwardBody: string, reverseBody = body(scope.applicationId, false)) =>
    writeFixPair(temporaryDirectory, scope, requiredMigration, forwardBody, reverseBody);

  test("dry-runs, applies, retries, and reverses one persisted fix", async () => {
    const fixtures = await writePair(body(scope.applicationId, true));
    const before = await integrationState(database, scope);

    const dryRun = await runFix(fixtures.forwardPath, config, { apply: false });
    assert.equal(dryRun.code, 0, dryRun.output);
    assert.match(dryRun.output, /dry run rolled back:/);
    assert.deepEqual(await integrationState(database, scope), before);

    const apply = await runFix(fixtures.forwardPath, config, APPLY_OPTIONS);
    assert.equal(apply.code, 0, apply.output);
    assert.match(apply.output, /applied:/);
    const committed = await integrationState(database, scope);
    assert.equal(committed.application?.is_migrated_from_pmda, true);
    assertApplicationHistoryDelta(before, committed, true);
    assert.equal(committed.ledger.length, 1);
    assertLedgerRow(committed, scope.forwardFileName, fixtures.forwardSql, scope.reverseFileName, null);

    const retry = await runFix(fixtures.forwardPath, config, APPLY_OPTIONS);
    assert.equal(retry.code, 0, retry.output);
    assert.match(retry.output, /already applied:/);
    assert.deepEqual(await integrationState(database, scope), committed);

    const reverse = await runFix(join(temporaryDirectory, scope.reverseFileName), config, APPLY_OPTIONS);
    assert.equal(reverse.code, 0, reverse.output);
    assert.match(reverse.output, /applied:/);
    const reversed = await integrationState(database, scope);
    assert.equal(reversed.application?.is_migrated_from_pmda, false);
    assertApplicationHistoryDelta(committed, reversed, false);
    assert.equal(reversed.ledger.length, 2);
    assertLedgerRow(reversed, scope.forwardFileName, fixtures.forwardSql, scope.reverseFileName, null);
    assertLedgerRow(reversed, scope.reverseFileName, fixtures.reverseSql, null, scope.forwardFileName);
  });

  test("checks the exact demonstration guard and rolls back a redacted runner failure", async () => {
    const applicationId = quoteFixtureUuid(scope.applicationId);
    const guardBody = `UPDATE demos_app.application SET is_migrated_from_pmda = true WHERE id = ${applicationId};
DELETE FROM demos_app.demonstration WHERE id = ${applicationId};
CREATE TEMPORARY TABLE data_fix_result (rows_affected integer);
INSERT INTO pg_temp.data_fix_result VALUES (1);
SELECT count(*)::integer AS evidence_count FROM demos_app.application WHERE id = ${applicationId};
`;
    const fixtures = await writePair(guardBody);
    const before = await integrationState(database, scope);
    const demonstrationBefore = await demonstrationState(database, scope.applicationId);
    await assertDemonstrationGuardTrigger(database, scope.applicationId);

    const result = await runFix(fixtures.forwardPath, config, APPLY_OPTIONS);
    assert.equal(result.code, 1);
    assert.match(result.output, /data fix failed during fix body/);
    assert.doesNotMatch(result.output, /Cannot delete from demos_app\.demonstration|postgresql:\/\//i);
    assert.deepEqual(await integrationState(database, scope), before);
    assert.deepEqual(await demonstrationState(database, scope.applicationId), demonstrationBefore);
  });

  test.each([
    { mode: "dry run", options: { apply: false } as const },
    { mode: "apply", options: APPLY_OPTIONS },
  ])("rolls back deferred-constraint failure in $mode", async ({ options }) => {
    const applicationId = quoteFixtureUuid(scope.applicationId);
    const personId = quoteFixtureUuid(scope.personId);
    const deferredViolationBody = `DELETE FROM demos_app.primary_demonstration_role_assignment
WHERE demonstration_id = ${applicationId} AND person_id = ${personId};
CREATE TEMPORARY TABLE data_fix_result (rows_affected integer);
INSERT INTO pg_temp.data_fix_result VALUES (1);
SELECT count(*)::integer AS evidence_count FROM demos_app.demonstration WHERE id = ${applicationId};
`;
    const fixtures = await writePair(deferredViolationBody);
    const before = await integrationState(database, scope);
    const officerBefore = await primaryOfficerState(database, scope);

    const result = await runFix(fixtures.forwardPath, config, options);
    assert.equal(result.code, 1);
    assert.match(result.output, /data fix failed during deferred constraints/);
    assert.deepEqual(await integrationState(database, scope), before);
    assert.deepEqual(await primaryOfficerState(database, scope), officerBefore);
  });
});
