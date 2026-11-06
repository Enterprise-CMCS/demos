import { hasSqlDetails, parse, parsePlPgSQL, parseSync } from "libpg-query";
import type { Node, ParseResult } from "@pgsql/types";

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
  runner: "demosctl" | "psql";
  requiresMigration?: string;
};

const HEADER_LINE = /^--\s*([a-z][a-z0-9_]*)\s*:\s*(.*?)\s*$/;
const PLACEHOLDER = /<[^>]*>/;
const SQL_FILE_NAME = /^[^/\\]+\.sql$/;
const FOLDER_NAME = /^[^/\\]+$/;

const REQUIRED_KEYS = ["ticket", "author", "data_owner", "environments", "expected_rows", "source", "reverse"];
const HEADER_KEYS = [...REQUIRED_KEYS, "override", "mapping_sha256", "reverses", "runner", "requires_migration"];

const DO_BODY_STATEMENTS: Record<string, string> = {
  SelectStmt: "SELECT",
  InsertStmt: "INSERT",
  UpdateStmt: "UPDATE",
  DeleteStmt: "DELETE",
};
// Besides these, only CREATE TEMPORARY TABLE data_fix_result is allowed at the top level
const TOP_LEVEL_STATEMENTS: Record<string, string> = { DoStmt: "DO", ...DO_BODY_STATEMENTS };

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

function ensure(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function parseHeader(sql: string): DataFixHeader {
  const values = new Map<string, string>();
  for (const line of sql.split(/\r?\n/)) {
    const match = HEADER_LINE.exec(line);
    if (!match) {
      break;
    }
    const [, key, value] = match;
    ensure(HEADER_KEYS.includes(key), `unknown header field ${key}`);
    ensure(!values.has(key), `duplicate header field ${key}`);
    ensure(value !== "", `header field ${key} is empty`);
    ensure(!PLACEHOLDER.test(value), `header field ${key} still has a placeholder`);
    values.set(key, value);
  }

  for (const key of REQUIRED_KEYS) {
    ensure(values.has(key), `missing header field ${key}`);
  }

  const runner = values.get("runner") ?? "psql";
  ensure(runner === "demosctl" || runner === "psql", `runner must be demosctl or psql, not ${runner}`);

  const expectedRowsRaw = values.get("expected_rows")!;
  ensure(/^\d+$/.test(expectedRowsRaw), "expected_rows must be a non-negative integer");

  const environments = values.get("environments")!.split(",").map((env) => env.trim()).filter((env) => env !== "");
  ensure(environments.length > 0, "environments must list at least one environment");

  const reverseRaw = values.get("reverse")!;
  const reverses = values.get("reverses");
  const reverse = reverseRaw === "none" ? undefined : reverseRaw;
  if (reverse === undefined) {
    ensure(reverses !== undefined, "reverse: none requires reverses: <forward fix file>");
  } else {
    ensure(SQL_FILE_NAME.test(reverse), "reverse must be none or a .sql file name");
    ensure(reverses === undefined, "reverses is only allowed with reverse: none");
  }
  ensure(reverses === undefined || SQL_FILE_NAME.test(reverses), "reverses must be a .sql file name");

  const requiresMigration = values.get("requires_migration");
  ensure(runner !== "demosctl" || requiresMigration !== undefined, "runner: demosctl files require requires_migration");
  ensure(
    requiresMigration === undefined || FOLDER_NAME.test(requiresMigration),
    "requires_migration must be a migration folder name",
  );

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

export function lintReversePairs(headers: Map<string, DataFixHeader>): Map<string, string[]> {
  const problems = new Map<string, string[]>();
  const addProblem = (fileName: string, problem: string) => {
    problems.set(fileName, [...(problems.get(fileName) ?? []), problem]);
  };

  for (const [fileName, header] of headers) {
    if (header.reverse !== undefined) {
      const reverseHeader = headers.get(header.reverse);
      if (reverseHeader !== undefined && reverseHeader.reverses !== fileName) {
        addProblem(fileName, `reverse file ${header.reverse} must declare reverses: ${fileName}`);
      }
    }
    if (header.reverses !== undefined) {
      const forwardHeader = headers.get(header.reverses);
      if (forwardHeader !== undefined && forwardHeader.reverse !== fileName) {
        addProblem(fileName, `reverses file ${header.reverses} must declare reverse: ${fileName}`);
      }
    }
  }

  return problems;
}

function walk(node: unknown, visit: (key: string, value: unknown) => void): void {
  if (Array.isArray(node)) {
    node.forEach((child) => walk(child, visit));
  } else if (node !== null && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      visit(key, value);
      walk(value, visit);
    }
  }
}

// Collects every string value in the parse tree; comments never reach it
function stringValues(node: unknown): string[] {
  const values: string[] = [];
  walk(node, (key, value) => {
    if (key === "sval" && typeof value === "string") {
      values.push(value);
    }
  });
  return values;
}

function statementsOf(result: ParseResult): Node[] {
  return (result.stmts ?? []).flatMap(({ stmt }) => stmt ?? []);
}

// The readable name of the statement's type when it is not in `allowed`
function rejectedStatement(statement: Node, allowed: Record<string, string>): string | undefined {
  const [type] = Object.keys(statement);
  if (type === "SelectStmt") {
    let createsTable = false;
    walk(statement, (key, value) => {
      if (key === "intoClause" && value !== null && value !== undefined) {
        createsTable = true;
      }
    });
    if (createsTable) {
      return "SELECT INTO";
    }
  }
  return Object.hasOwn(allowed, type) ? undefined : (REJECTED_STATEMENTS[type] ?? type);
}

function isPlpgsqlDo(statement: Node): boolean {
  if (!("DoStmt" in statement)) {
    return false;
  }
  const language = statement.DoStmt.args?.find((arg) => "DefElem" in arg && arg.DefElem.defname === "language");
  return language === undefined || stringValues(language)[0] === "plpgsql";
}

type DoBodyLintResult = { problems: string[]; strings: string[] };

async function lintDoBodies(sql: string): Promise<DoBodyLintResult> {
  const problems: string[] = [];
  const strings: string[] = [];
  try {
    walk(await parsePlPgSQL(sql), (key, value) => {
      if (["PLpgSQL_stmt_dynexecute", "PLpgSQL_stmt_dynfors", "dynquery"].includes(key)) {
        problems.push("EXECUTE is not allowed in DO blocks");
      }
      if (key === "PLpgSQL_stmt_commit" || key === "PLpgSQL_stmt_rollback") {
        problems.push("transaction control (COMMIT, ROLLBACK) is not allowed in DO blocks");
      }
      if (key === "PLpgSQL_expr") {
        // A node without these fields throws and is reported as a parse problem
        const { query, parseMode } = value as { query: string; parseMode?: number };
        const embedded = parseMode === 0 ? query : `SELECT ${query.replace(":=", "=")}`;
        for (const stmt of statementsOf(parseSync(embedded))) {
          strings.push(...stringValues(stmt));
          const rejected = rejectedStatement(stmt, DO_BODY_STATEMENTS);
          if (rejected !== undefined) {
            problems.push(
              `${rejected} is not allowed in DO blocks; use only ${Object.values(DO_BODY_STATEMENTS).join(", ")}`,
            );
          }
        }
      }
    });
  } catch (error) {
    return { problems: [parseError(sql, error)], strings };
  }
  return { problems, strings };
}

function isDataFixResultTable(node: Node): boolean {
  if (!("CreateStmt" in node)) {
    return false;
  }
  const { relation } = node.CreateStmt;
  return relation?.relname === "data_fix_result" && relation.relpersistence === "t";
}

function parseError(sql: string, error: unknown): string {
  const position = hasSqlDetails(error) ? error.sqlDetails!.cursorPosition : undefined;
  const line = position === undefined ? "" : ` on line ${sql.slice(0, position).split("\n").length}`;
  const metaCommandHint =
    position !== undefined && sql.slice(Math.max(0, position - 1), position + 1).includes("\\")
      ? " (psql meta-commands are not allowed)"
      : "";
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  return `SQL does not parse${line}${metaCommandHint}: ${message}`;
}

async function lintDemosctlBody(sql: string): Promise<string[]> {
  let statements: Node[];
  try {
    statements = statementsOf(await parse(sql));
  } catch (error) {
    return [parseError(sql, error)];
  }

  const problems: string[] = [];
  const strings: string[] = [];
  for (const stmt of statements) {
    const rejected = rejectedStatement(stmt, TOP_LEVEL_STATEMENTS);
    if (rejected !== undefined && !isDataFixResultTable(stmt)) {
      problems.push(
        `top-level ${rejected} is not allowed; use only ${Object.values(TOP_LEVEL_STATEMENTS).join(", ")} and CREATE TEMPORARY TABLE data_fix_result`,
      );
    }
    if (!("DoStmt" in stmt)) {
      strings.push(...stringValues(stmt));
    } else if (!isPlpgsqlDo(stmt)) {
      problems.push("DO blocks must use PL/pgSQL to be linted");
    }
  }
  const doBodyLint = await lintDoBodies(sql);
  problems.push(...doBodyLint.problems);
  strings.push(...doBodyLint.strings);
  for (const [pattern, label] of BANNED_STRINGS) {
    if (strings.some((value) => pattern.test(value))) {
      problems.push(`${label} is not allowed anywhere in the file`);
    }
  }
  if (!statements.some(isDataFixResultTable)) {
    problems.push("missing CREATE TEMPORARY TABLE data_fix_result");
  }
  return [...new Set(problems)];
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
    if (header.override !== undefined) {
      problems.push("override is not supported for runner: demosctl files");
    }
    if (header.requiresMigration !== undefined && !migrations.includes(header.requiresMigration)) {
      problems.push(`requires_migration ${header.requiresMigration} is not a folder in server/src/model/migrations`);
    }
    problems.push(...(await lintDemosctlBody(sql)));
  }
  return problems;
}
