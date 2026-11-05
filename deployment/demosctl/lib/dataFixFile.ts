import { hasSqlDetails, parse } from "libpg-query";
import type { CreateStmt, Node, ParseResult } from "@pgsql/types";

export type DataFixRunner = "demosctl" | "psql";

export type DataFixHeader = {
  ticket: string;
  author: string;
  dataOwner: string;
  environments: string[];
  expectedRows: number;
  source: string;
  reverse?: string;
  reverses?: string;
  override?: string;
  mappingSha256?: string;
  runner: DataFixRunner;
  requiresMigration?: string;
};

const HEADER_LINE = /^--\s*([a-z][a-z0-9_]*)\s*:\s*(.*?)\s*$/;
const PLACEHOLDER = /<[^>]*>/;
const SQL_FILE_NAME = /^[^/\\]+\.sql$/;
const FOLDER_NAME = /^[^/\\]+$/;

const HEADER_KEYS = [
  "ticket",
  "author",
  "data_owner",
  "environments",
  "expected_rows",
  "source",
  "override",
  "mapping_sha256",
  "reverse",
  "reverses",
  "runner",
  "requires_migration",
];
const REQUIRED_KEYS = ["ticket", "author", "data_owner", "environments", "expected_rows", "source", "reverse"];

// Besides these, only CREATE TEMPORARY TABLE data_fix_result is allowed at the top level
const ALLOWED_STATEMENTS: Record<string, string> = {
  DoStmt: "DO",
  SelectStmt: "SELECT",
  InsertStmt: "INSERT",
  UpdateStmt: "UPDATE",
  DeleteStmt: "DELETE",
};

// Readable names for rejected parser node types; any other type is reported by its node name
const REJECTED_STATEMENTS: Record<string, string> = {
  TransactionStmt: "transaction control (BEGIN, COMMIT, ROLLBACK, SAVEPOINT)",
  VariableSetStmt: "SET/RESET",
  AlterTableStmt: "ALTER TABLE",
  DropStmt: "DROP",
  TruncateStmt: "TRUNCATE",
  GrantStmt: "GRANT/REVOKE",
  CopyStmt: "COPY",
  CreateStmt: "CREATE TABLE",
  CreateFunctionStmt: "CREATE FUNCTION",
  LockStmt: "LOCK",
};

// Checked in every string the parser returns: DO bodies, string literals and names
const BANNED_STRINGS: [RegExp, string][] = [
  [/\bset_config\b/i, "set_config"],
  [/\breset\s+role\b|\bset\s+(?:local|session)\s+role\b|\bset\s+role\b(?!\s*=)/i, "SET ROLE / RESET ROLE"],
  [/\bsession\s+authorization\b/i, "SESSION AUTHORIZATION"],
  [
    /\b(?:set|reset)\s+(?:(?:local|session)\s+)?(?:lock_timeout|statement_timeout|idle_in_transaction_session_timeout|all)\b/i,
    "changing the runner's timeouts",
  ],
];

export function parseHeader(sql: string): DataFixHeader {
  const values = new Map<string, string>();
  for (const line of sql.split(/\r?\n/)) {
    const match = HEADER_LINE.exec(line);
    if (!match) {
      break;
    }
    const [, key, value] = match;
    if (!HEADER_KEYS.includes(key)) {
      throw new Error(`unknown header field ${key}`);
    }
    if (values.has(key)) {
      throw new Error(`duplicate header field ${key}`);
    }
    if (value === "") {
      throw new Error(`header field ${key} is empty`);
    }
    if (PLACEHOLDER.test(value)) {
      throw new Error(`header field ${key} still has a placeholder`);
    }
    values.set(key, value);
  }

  for (const key of REQUIRED_KEYS) {
    if (!values.has(key)) {
      throw new Error(`missing header field ${key}`);
    }
  }

  const runner = values.get("runner") ?? "psql";
  if (runner !== "demosctl" && runner !== "psql") {
    throw new Error(`runner must be demosctl or psql, not ${runner}`);
  }

  const expectedRowsRaw = values.get("expected_rows")!;
  if (!/^\d+$/.test(expectedRowsRaw)) {
    throw new Error("expected_rows must be a non-negative integer");
  }

  const environments = values.get("environments")!.split(",").map((env) => env.trim()).filter((env) => env !== "");
  if (environments.length === 0) {
    throw new Error("environments must list at least one environment");
  }

  const reverseRaw = values.get("reverse")!;
  const reverses = values.get("reverses");
  let reverse: string | undefined;
  if (reverseRaw === "none") {
    if (reverses === undefined) {
      throw new Error("reverse: none requires reverses: <forward fix file>");
    }
  } else {
    if (!SQL_FILE_NAME.test(reverseRaw)) {
      throw new Error("reverse must be none or a .sql file name");
    }
    if (reverses !== undefined) {
      throw new Error("reverses is only allowed with reverse: none");
    }
    reverse = reverseRaw;
  }
  if (reverses !== undefined && !SQL_FILE_NAME.test(reverses)) {
    throw new Error("reverses must be a .sql file name");
  }

  const requiresMigration = values.get("requires_migration");
  if (runner === "demosctl" && requiresMigration === undefined) {
    throw new Error("runner: demosctl files require requires_migration");
  }
  if (requiresMigration !== undefined && !FOLDER_NAME.test(requiresMigration)) {
    throw new Error("requires_migration must be a migration folder name");
  }

  return {
    ticket: values.get("ticket")!,
    author: values.get("author")!,
    dataOwner: values.get("data_owner")!,
    environments,
    expectedRows: Number(expectedRowsRaw),
    source: values.get("source")!,
    reverse,
    reverses,
    override: values.get("override"),
    mappingSha256: values.get("mapping_sha256"),
    runner,
    requiresMigration,
  };
}

// Collects every string value in the parse tree; comments never reach it
function stringValues(node: unknown, values: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach((child) => stringValues(child, values));
  } else if (node !== null && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "sval" && typeof value === "string") {
        values.push(value);
      } else {
        stringValues(value, values);
      }
    }
  }
  return values;
}

function isDataFixResultTable(node: Node | undefined): boolean {
  if (node === undefined || !("CreateStmt" in node)) {
    return false;
  }
  const { relation }: CreateStmt = node.CreateStmt;
  return relation?.relname === "data_fix_result" && relation.relpersistence === "t";
}

function parseError(sql: string, error: unknown): string {
  const position = hasSqlDetails(error) ? error.sqlDetails.cursorPosition : undefined;
  const line = position === undefined ? "" : ` on line ${sql.slice(0, position).split("\n").length}`;
  const metaCommandHint =
    position !== undefined && sql.slice(Math.max(0, position - 1), position + 1).includes("\\")
      ? " (psql meta-commands are not allowed)"
      : "";
  return `SQL does not parse${line}${metaCommandHint}: ${(error as Error).message}`;
}

async function lintDemosctlBody(header: DataFixHeader, sql: string, migrations: string[]): Promise<string[]> {
  const problems: string[] = [];
  if (header.override !== undefined) {
    problems.push("override is not supported for runner: demosctl files");
  }
  if (header.requiresMigration !== undefined && !migrations.includes(header.requiresMigration)) {
    problems.push(`requires_migration ${header.requiresMigration} is not a folder in server/src/model/migrations`);
  }

  let statements: NonNullable<ParseResult["stmts"]>;
  try {
    statements = ((await parse(sql)) as ParseResult).stmts ?? [];
  } catch (error) {
    return [...problems, parseError(sql, error)];
  }

  let hasResultTable = false;
  for (const { stmt } of statements) {
    if (stmt === undefined) {
      continue;
    }
    const [type] = Object.keys(stmt);
    if (isDataFixResultTable(stmt)) {
      hasResultTable = true;
    } else if (!Object.hasOwn(ALLOWED_STATEMENTS, type)) {
      problems.push(
        `top-level ${REJECTED_STATEMENTS[type] ?? type} is not allowed; use only ${Object.values(ALLOWED_STATEMENTS).join(", ")} and CREATE TEMPORARY TABLE data_fix_result`,
      );
    }
  }
  const strings = stringValues(statements);
  for (const [pattern, label] of BANNED_STRINGS) {
    if (strings.some((value) => pattern.test(value))) {
      problems.push(`${label} is not allowed anywhere in the file`);
    }
  }
  if (!hasResultTable) {
    problems.push("missing CREATE TEMPORARY TABLE data_fix_result");
  }
  return problems;
}

export async function lintFile(fileName: string, sql: string, dir: string[], migrations: string[]): Promise<string[]> {
  let header: DataFixHeader;
  try {
    header = parseHeader(sql);
  } catch (error) {
    return [(error as Error).message];
  }

  const problems: string[] = [];
  for (const [key, target] of [["reverse", header.reverse], ["reverses", header.reverses]]) {
    if (target === undefined) {
      continue;
    }
    if (target === fileName) {
      problems.push(`${key} must name a different file`);
    } else if (!dir.includes(target)) {
      problems.push(`${key} file ${target} not found`);
    }
  }
  if (header.runner === "demosctl") {
    problems.push(...(await lintDemosctlBody(header, sql, migrations)));
  }
  return problems;
}
