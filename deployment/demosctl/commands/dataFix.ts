import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { Client } from "pg";
import type { QueryResult } from "pg";

import { lintFile, lintReversePairs, parseHeader } from "../lib/dataFixFile";
import type { DataFixHeader } from "../lib/dataFixFile";
import { getSecret } from "../lib/getSecret";
import { fetchCACert, RDS_CA_BUNDLE_URL } from "./testMigration";

const DEFAULT_FIX_DIR = path.join("..", "server", "src", "data_fixes");
const DEFAULT_MIGRATIONS_DIR = path.join("..", "server", "src", "model", "migrations");
export const DATA_FIX_BODY_TIMEOUT_MS = 30_000;
export const DATA_FIX_STATEMENT_TIMEOUT_MS = 30_000;
export const DATA_FIX_LOCK_TIMEOUT_MS = 5_000;
export const DATA_FIX_IDLE_IN_TRANSACTION_SESSION_TIMEOUT_MS = 30_000;

function listEntries(dir: string): fs.Dirent[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function dataFixLint(dir: string = DEFAULT_FIX_DIR, migrationsDir: string = DEFAULT_MIGRATIONS_DIR) {
  const entries = listEntries(dir);
  const directories = [
    { path: dir, relativePath: "", entries },
    ...entries
      .filter((entry) => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) => ({
        path: path.join(dir, entry.name),
        relativePath: entry.name,
        entries: listEntries(path.join(dir, entry.name)),
      })),
  ];
  const migrations = listEntries(migrationsDir).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const problems: string[] = [];
  let sqlFileCount = 0;

  for (const directory of directories) {
    const files = directory.entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
    const allSqlFiles = files.filter((file) => file.toLowerCase().endsWith(".sql"));
    const sqlFiles = allSqlFiles.filter((file) => file.endsWith(".sql"));
    const displayName = (file: string) => path.join(directory.relativePath, file);

    sqlFileCount += sqlFiles.length;
    problems.push(
      ...allSqlFiles
        .filter((file) => !file.endsWith(".sql"))
        .map((file) => `${displayName(file)}: SQL file names must use the lowercase .sql extension`),
      ...files
        .filter((file) => file.toLowerCase().endsWith(".csv"))
        .map((file) => `${displayName(file)}: CSV files must not be committed to the data fix folder`),
    );

    const headers = new Map<string, DataFixHeader>();
    for (const file of sqlFiles) {
      const sql = fs.readFileSync(path.join(directory.path, file), "utf8");
      try {
        headers.set(file, parseHeader(sql));
      } catch {
        // lintFile reports malformed headers; only parsed headers can be checked as pairs.
      }
      problems.push(...(await lintFile(file, sql, files, migrations)).map((problem) => `${displayName(file)}: ${problem}`));
    }
    for (const [file, pairProblems] of lintReversePairs(headers)) {
      problems.push(...pairProblems.map((problem) => `${displayName(file)}: ${problem}`));
    }
  }

  if (sqlFileCount === 0 && problems.length === 0) {
    console.log(`no fix files in ${dir}`);
    return 0;
  }

  if (problems.length > 0) {
    problems.forEach((problem) => console.error(problem));
    console.error(`data fix lint failed with ${problems.length} problem(s)`);
    return 1;
  }
  console.log(`data fix lint passed for ${sqlFileCount} file(s)`);
  return 0;
}

type DataFixOptions = {
  apply: boolean;
  approvedBy?: string;
  appliedBy?: string;
  gitCommit?: string;
  buildUrl?: string;
  ciResultFile?: string;
};

type DataFixPhase =
  | "validation"
  | "database connection"
  | "schema gate"
  | "pair lock"
  | "ledger check"
  | "transaction setup"
  | "fix body"
  | "deferred constraints"
  | "ledger insert"
  | "commit"
  | "rollback"
  | "connection close";

type DataFixOutcome = "rolled-back" | "no-op" | "committed" | "failed" | "unknown";
type DataFixRollbackStatus = "not-started" | "acknowledged" | "failed" | "unconfirmed";
type DataFixCleanupStatus = "not-needed" | "succeeded" | "failed";

type DataFixState = {
  phase: DataFixPhase;
  connectionAttempted: boolean;
  inTransaction: boolean;
  connectionLost: boolean;
  outcome: DataFixOutcome;
  rowsAffected: number | null;
  failurePhase: DataFixPhase | null;
  rollbackStatus: DataFixRollbackStatus;
  cleanupStatus: DataFixCleanupStatus;
};

class DataFixError extends Error {}

const DATA_FIX_CI_ENVIRONMENTS = new Set(["dev", "test", "impl", "prod"]);
const DATA_FIX_CI_FILENAME = /^\d{8}_DEMOS-\d+_[a-z0-9_]+\.sql$/;

const DATA_FIX_PAIR_LOCK_QUERY =
  "SELECT pg_advisory_xact_lock(hashtextextended(current_database() || ':demos-data-fix:' || $1, 0))";

function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

function isFatalConnectionError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = errorCode(error);
  return code === "25P04" || code?.startsWith("08") === true || ("severity" in error && error.severity === "FATAL");
}

function readHeader(sql: string): DataFixHeader {
  try {
    return parseHeader(sql);
  } catch (error) {
    // Header errors describe the local fix file, so they are safe to print.
    throw new DataFixError((error as Error).message);
  }
}

async function validateFix(environment: string, filePath: string) {
  const fileName = path.basename(filePath);
  if (!fileName.endsWith(".sql")) {
    throw new DataFixError("data fix file must use the lowercase .sql extension");
  }
  let sql: string;
  try {
    sql = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new DataFixError(`data fix file not found: ${fileName}`);
    }
    throw error;
  }
  const header = readHeader(sql);
  if (header.runner !== "demosctl") {
    throw new DataFixError("data-fix only runs runner: demosctl files; use the manual psql runbook");
  }
  if (!header.environments.includes(environment)) {
    throw new DataFixError(`environment ${environment} is not listed in environments`);
  }
  if (!Number.isSafeInteger(header.expectedRows)) {
    throw new DataFixError("expected_rows must be a safe integer");
  }
  const dir = path.dirname(filePath);
  const files = listEntries(dir).filter((entry) => entry.isFile()).map((entry) => entry.name);
  const migrations = listEntries(DEFAULT_MIGRATIONS_DIR).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const problems = await lintFile(fileName, sql, files, migrations);
  if (problems.length > 0) {
    throw new DataFixError(problems.join("; "));
  }
  const partner = header.reverse ?? header.reverses!;
  const partnerHeader = readHeader(fs.readFileSync(path.join(dir, partner), "utf8"));
  const pairs = lintReversePairs(new Map([[fileName, header], [partner, partnerHeader]]));
  const pairProblems = [...pairs.values()].flat();
  if (pairProblems.length > 0) {
    throw new DataFixError(pairProblems.join("; "));
  }
  return { sql, header, fileName, checksum: createHash("sha256").update(sql).digest("hex") };
}

async function createDataFixClient(environment: string): Promise<Client> {
  const raw = await getSecret(`demos-${environment}-rds-admin`);
  if (!raw) {
    throw new DataFixError("unable to retrieve database credentials");
  }
  let secret: unknown;
  try {
    secret = JSON.parse(raw);
  } catch {
    throw new DataFixError("invalid database credentials");
  }
  if (secret === null || typeof secret !== "object") { // pragma: allowlist secret
    throw new DataFixError("invalid database credentials");
  }
  const { username, password, host, port } = secret as Record<string, unknown>;
  if (
    typeof username !== "string" || username.trim() === "" ||
    typeof password !== "string" || password === "" || // pragma: allowlist secret
    typeof host !== "string" || host.trim() === "" ||
    typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535
  ) {
    throw new DataFixError("invalid database credentials");
  }
  const ca = await fetchCACert(RDS_CA_BUNDLE_URL);
  return new Client({
    user: username,
    password,
    host,
    port,
    database: "demos",
    ssl: { ca, rejectUnauthorized: true },
  });
}

async function checkSchemaGate(client: Client, requiresMigration: string, environment?: string): Promise<void> {
  const result = await client.query(
    "SELECT 1 FROM demos_app._prisma_migrations WHERE migration_name = $1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL",
    [requiresMigration],
  );
  if (result.rows.length === 0) {
    const target = environment === undefined ? "" : ` to \`${environment}\``;
    throw new DataFixError(`release migration \`${requiresMigration}\`${target} first`);
  }
}

export async function dataFix(environment: string, file: string, opts: DataFixOptions, injectedClient?: Client): Promise<number> {
  let client = injectedClient;
  const fileName = path.basename(file);
  const state: DataFixState = {
    phase: "validation",
    connectionAttempted: false,
    inTransaction: false,
    connectionLost: false,
    outcome: "failed",
    rowsAffected: null,
    failurePhase: null,
    rollbackStatus: "not-started",
    cleanupStatus: "not-needed",
  };
  let exitCode = 1;
  let ciResultDescriptor: number | undefined;
  const notices: string[] = [];
  const onNotice = (notice: { message?: string }) => notices.push(notice.message ?? "");
  const onClientError = () => { state.connectionLost = true; };
  const printNotices = () => notices.splice(0).forEach((notice) => console.log("notice:", notice));

  if (opts.ciResultFile !== undefined) {
    if (!path.isAbsolute(opts.ciResultFile) || opts.ciResultFile.length > 4096) {
      console.error("invalid data-fix CI result destination");
      return 1;
    }
    if (!DATA_FIX_CI_ENVIRONMENTS.has(environment) || !DATA_FIX_CI_FILENAME.test(fileName)) {
      console.error("invalid data-fix CI request");
      return 1;
    }
    try {
      ciResultDescriptor = fs.openSync(opts.ciResultFile, "wx", 0o600);
    } catch {
      console.error("unable to create data-fix CI result");
      return 1;
    }
  }

  try {
    if (opts.apply && ![opts.approvedBy, opts.appliedBy, opts.gitCommit, opts.buildUrl].every((value) => value?.trim())) {
      throw new DataFixError("apply only runs from Jenkins");
    }
    const filePath = path.basename(file) === file ? path.join(DEFAULT_FIX_DIR, file) : path.resolve(file);
    const { sql, header, checksum } = await validateFix(environment, filePath);

    state.phase = "database connection";
    client ??= await createDataFixClient(environment);
    client.on("notice", onNotice);
    client.on("error", onClientError);
    state.connectionAttempted = true;
    await client.connect();
    state.phase = "schema gate";
    await checkSchemaGate(client, header.requiresMigration!, environment);
    state.phase = "transaction setup";
    await client.query("BEGIN");
    state.inTransaction = true;
    await client.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await client.query(`SET LOCAL lock_timeout = '${DATA_FIX_LOCK_TIMEOUT_MS}ms'`);
    state.phase = "pair lock";
    try {
      await client.query(DATA_FIX_PAIR_LOCK_QUERY, [header.reverses ?? fileName]);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "55P03") {
        throw new DataFixError("data-fix pair is locked; retry after the current run completes");
      }
      throw error;
    }
    state.phase = "ledger check";
    const existing = await client.query<{ checksum: string }>(
      "SELECT checksum FROM demos_app.data_fix_log WHERE file_name = $1", [fileName],
    );
    if (existing.rows.length > 0) {
      if (existing.rows[0].checksum !== checksum) {
        throw new DataFixError(`${fileName} was already applied with a different checksum`);
      }
      state.phase = "rollback";
      await client.query("ROLLBACK");
      state.inTransaction = false;
      state.outcome = "no-op";
      state.rowsAffected = 0;
      state.rollbackStatus = "acknowledged";
      console.log("already applied:", fileName);
    } else {
      if (header.reverses) {
        const forward = await client.query<{ reverse_file: string | null }>(
          "SELECT reverse_file FROM demos_app.data_fix_log WHERE file_name = $1", [header.reverses],
        );
        if (forward.rows[0]?.reverse_file !== fileName) {
          throw new DataFixError(`reversal requires matching forward data fix ${header.reverses} to be applied first`);
        }
      }
      await client.query(`SET LOCAL statement_timeout = '${DATA_FIX_STATEMENT_TIMEOUT_MS}ms'`);
      await client.query(`SET LOCAL idle_in_transaction_session_timeout = '${DATA_FIX_IDLE_IN_TRANSACTION_SESSION_TIMEOUT_MS}ms'`);
      await client.query("SET LOCAL ROLE demos_data_fix");
      state.phase = "transaction setup";
      await client.query(`SET LOCAL transaction_timeout = '${DATA_FIX_BODY_TIMEOUT_MS}ms'`);
      state.phase = "fix body";
      // No parameters: pg uses the simple protocol for the whole multi-statement body.
      let bodyResult: QueryResult | QueryResult[];
      try {
        bodyResult = await client.query(sql);
        state.phase = "transaction setup";
        await client.query("SET LOCAL transaction_timeout = 0");
      } catch (error) {
        if (errorCode(error) === "25P04") {
          state.connectionLost = true;
          throw new DataFixError("data fix SQL body exceeded its transaction timeout");
        }
        if (isFatalConnectionError(error)) state.connectionLost = true;
        throw error;
      }
      const results: QueryResult[] = Array.isArray(bodyResult) ? bodyResult : [bodyResult];
      const evidence = results.at(-1);
      if (evidence?.command !== "SELECT") {
        throw new DataFixError("data fix body must end with an aggregate evidence SELECT");
      }
      const result = await client.query<{ rows_affected: unknown }>("SELECT rows_affected FROM pg_temp.data_fix_result");
      const rowsAffected = result.rows[0]?.rows_affected;
      if (result.rows.length !== 1 || typeof rowsAffected !== "number" || !Number.isSafeInteger(rowsAffected) || rowsAffected < 0) {
        throw new DataFixError("data_fix_result must contain exactly one integer rows_affected");
      }
      state.rowsAffected = rowsAffected;
      if (rowsAffected !== header.expectedRows) {
        throw new DataFixError(`row count mismatch: expected ${header.expectedRows}, got ${rowsAffected}`);
      }
      const role = await client.query<{ current_user: string }>("SELECT current_user");
      if (role.rows[0]?.current_user !== "demos_data_fix") {
        throw new DataFixError("data fix body changed current_user; refusing to continue");
      }
      state.phase = "deferred constraints";
      await client.query("SET CONSTRAINTS ALL IMMEDIATE");
      await client.query("RESET ROLE");
      console.log("rows affected:", rowsAffected);
      console.log("evidence:", evidence.rows);
      printNotices();
      if (opts.apply) {
        state.phase = "ledger insert";
        await client.query(
          `INSERT INTO demos_app.data_fix_log
            (file_name, checksum, ticket, environment, rows_affected, reverse_file, reverses, git_commit, applied_by, approved_by, build_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [fileName, checksum, header.ticket, environment, rowsAffected, header.reverse ?? null, header.reverses ?? null,
            opts.gitCommit, opts.appliedBy, opts.approvedBy, opts.buildUrl],
        );
        state.phase = "commit";
        await client.query("COMMIT");
        state.outcome = "committed";
        state.inTransaction = false;
        console.log("applied:", fileName);
      } else {
        state.phase = "rollback";
        await client.query("ROLLBACK");
        state.rollbackStatus = "acknowledged";
        state.outcome = "rolled-back";
        state.inTransaction = false;
        console.log("dry run rolled back:", fileName);
      }
    }
    exitCode = 0;
  } catch (error) {
    // Database errors can include row values or credentials; only our own errors are safe to print.
    console.error(error instanceof DataFixError ? error.message : `data fix failed during ${state.phase}`);
    state.failurePhase = state.phase;
    if (opts.apply && state.phase === "commit" && state.outcome !== "committed") {
      state.outcome = "unknown";
    }
    if (state.inTransaction && client && !state.connectionLost) {
      try {
        await client.query("ROLLBACK");
        state.inTransaction = false;
        state.rollbackStatus = "acknowledged";
      } catch {
        state.rollbackStatus = "failed";
        console.error("rollback failed; closing database connection");
      }
    } else if (state.inTransaction && state.connectionLost) {
      state.rollbackStatus = "unconfirmed";
    }
  } finally {
    printNotices();
    if (state.connectionAttempted && client) {
      client.removeListener("notice", onNotice);
      try {
        await client.end();
        state.cleanupStatus = "succeeded";
      } catch {
        state.cleanupStatus = "failed";
        state.failurePhase ??= "connection close";
        console.error("failed to close database connection");
        exitCode = 1;
      } finally {
        client.removeListener("error", onClientError);
      }
    }
    if (ciResultDescriptor !== undefined) {
      const result = {
        version: 1,
        environment,
        filename: fileName,
        mode: opts.apply ? "apply" : "dry-run",
        outcome: state.outcome,
        rowsAffected: state.rowsAffected,
        failurePhase: state.failurePhase,
        rollbackStatus: state.rollbackStatus,
        cleanupStatus: state.cleanupStatus,
      };
      try {
        fs.writeFileSync(ciResultDescriptor, JSON.stringify(result));
        fs.fsyncSync(ciResultDescriptor);
      } catch {
        console.error("unable to write data-fix CI result");
        exitCode = 1;
      }
      try {
        fs.closeSync(ciResultDescriptor);
      } catch {
        console.error("unable to close data-fix CI result");
        exitCode = 1;
      }
    }
  }
  return exitCode;
}
