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
  const files = listEntries(dir).filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  const allSqlFiles = files.filter((file) => file.toLowerCase().endsWith(".sql"));
  const sqlFiles = allSqlFiles.filter((file) => file.endsWith(".sql"));
  const problems = [
    ...allSqlFiles
      .filter((file) => !file.endsWith(".sql"))
      .map((file) => `${file}: SQL file names must use the lowercase .sql extension`),
    ...files
      .filter((file) => file.toLowerCase().endsWith(".csv"))
      .map((file) => `${file}: CSV files must not be committed to the data fix folder`),
  ];

  if (sqlFiles.length === 0 && problems.length === 0) {
    console.log(`no fix files in ${dir}`);
    return 0;
  }

  const migrations = listEntries(migrationsDir).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const headers = new Map<string, DataFixHeader>();
  for (const file of sqlFiles) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    try {
      headers.set(file, parseHeader(sql));
    } catch {
      // lintFile reports malformed headers; only parsed headers can be checked as pairs.
    }
    problems.push(...(await lintFile(file, sql, files, migrations)).map((problem) => `${file}: ${problem}`));
  }
  for (const [file, pairProblems] of lintReversePairs(headers)) {
    problems.push(...pairProblems.map((problem) => `${file}: ${problem}`));
  }

  if (problems.length > 0) {
    problems.forEach((problem) => console.error(problem));
    console.error(`data fix lint failed with ${problems.length} problem(s)`);
    return 1;
  }
  console.log(`data fix lint passed for ${sqlFiles.length} file(s)`);
  return 0;
}

type DataFixOptions = {
  apply: boolean;
  approvedBy?: string;
  appliedBy?: string;
  gitCommit?: string;
  buildUrl?: string;
};

type DataFixPhase =
  | "validation"
  | "database connection"
  | "schema gate"
  | "ledger check"
  | "transaction setup"
  | "fix body"
  | "deferred constraints"
  | "ledger insert"
  | "commit"
  | "rollback";

type DataFixState = {
  phase: DataFixPhase;
  connectionAttempted: boolean;
  inTransaction: boolean;
};

class DataFixError extends Error {}

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

export async function checkSchemaGate(client: Client, requiresMigration: string, environment?: string): Promise<void> {
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
  const state: DataFixState = { phase: "validation", connectionAttempted: false, inTransaction: false };
  let exitCode = 1;
  const notices: string[] = [];
  const onNotice = (notice: { message?: string }) => notices.push(notice.message ?? "");
  const printNotices = () => notices.splice(0).forEach((notice) => console.log("notice:", notice));
  try {
    if (opts.apply && ![opts.approvedBy, opts.appliedBy, opts.gitCommit, opts.buildUrl].every((value) => value?.trim())) {
      throw new DataFixError("apply only runs from Jenkins");
    }
    const filePath = path.basename(file) === file ? path.join(DEFAULT_FIX_DIR, file) : path.resolve(file);
    const { sql, header, fileName, checksum } = await validateFix(environment, filePath);

    state.phase = "database connection";
    client ??= await createDataFixClient(environment);
    client.on("notice", onNotice);
    state.connectionAttempted = true;
    await client.connect();
    state.phase = "schema gate";
    await checkSchemaGate(client, header.requiresMigration!, environment);
    state.phase = "ledger check";
    const existing = await client.query<{ checksum: string }>(
      "SELECT checksum FROM demos_app.data_fix_log WHERE file_name = $1", [fileName],
    );
    if (existing.rows.length > 0) {
      if (existing.rows[0].checksum !== checksum) {
        throw new DataFixError(`${fileName} was already applied with a different checksum`);
      }
      console.log("already applied:", fileName);
    } else {
      state.phase = "transaction setup";
      await client.query("BEGIN");
      state.inTransaction = true;
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query("SET LOCAL statement_timeout = '30s'");
      await client.query("SET LOCAL idle_in_transaction_session_timeout = '30s'");
      await client.query("SET LOCAL ROLE demos_data_fix");
      state.phase = "fix body";
      // No parameters: pg uses the simple protocol for the whole multi-statement body.
      const bodyResult = await client.query(sql);
      const results: QueryResult[] = Array.isArray(bodyResult) ? bodyResult : [bodyResult];
      const evidence = results.at(-1);
      if (evidence?.command !== "SELECT") {
        throw new DataFixError("data fix body must end with an aggregate evidence SELECT");
      }
      const result = await client.query<{ rows_affected: unknown }>("SELECT rows_affected FROM pg_temp.data_fix_result");
      const rowsAffected = result.rows[0]?.rows_affected;
      if (result.rows.length !== 1 || typeof rowsAffected !== "number" || !Number.isSafeInteger(rowsAffected)) {
        throw new DataFixError("data_fix_result must contain exactly one integer rows_affected");
      }
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
        console.log("applied:", fileName);
      } else {
        state.phase = "rollback";
        await client.query("ROLLBACK");
        console.log("dry run rolled back:", fileName);
      }
      state.inTransaction = false;
    }
    exitCode = 0;
  } catch (error) {
    // Database errors can include row values or credentials; only our own errors are safe to print.
    console.error(error instanceof DataFixError ? error.message : `data fix failed during ${state.phase}`);
    if (state.inTransaction && client) {
      try {
        await client.query("ROLLBACK");
      } catch {
        console.error("rollback failed; closing database connection");
      }
    }
  } finally {
    printNotices();
    if (state.connectionAttempted && client) {
      client.removeListener("notice", onNotice);
      try {
        await client.end();
      } catch {
        console.error("failed to close database connection");
        exitCode = 1;
      }
    }
  }
  return exitCode;
}
