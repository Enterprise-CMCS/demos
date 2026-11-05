import fs from "node:fs";
import path from "node:path";

import { lintFile, parseHeader } from "./dataFixFile";

const FIX = "20260101_DEMOS-1000_example_fix.sql";
const REVERSE = "20260101_DEMOS-1000_revert_example_fix.sql";
const MIGRATION = "20260101000000_example_migration";
const DIR = [FIX, REVERSE];

const headerLines = (overrides: Record<string, string | undefined> = {}) => {
  const fields: Record<string, string | undefined> = {
    ticket: "DEMOS-1000",
    author: "Example Author",
    data_owner: "Example Data Owner",
    environments: "dev, test",
    expected_rows: "2",
    source: "Synthetic fixture",
    runner: "demosctl",
    requires_migration: MIGRATION,
    reverse: REVERSE,
    ...overrides,
  };
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `-- ${key}: ${value}`)
    .join("\n");
};

const VALID_BODY = fs
  .readFileSync(
    path.join(__dirname, "../commands/__fixtures__/data_fixes/valid/20260101_DEMOS-1000_example_fix.sql"),
    "utf8",
  )
  .split(/\r?\n--\r?\n/)[1]
  .trim();

const fixFile = (body: string = VALID_BODY, overrides: Record<string, string | undefined> = {}) =>
  `${headerLines(overrides)}\n--\n${body}`;

const lint = (body: string = VALID_BODY, overrides: Record<string, string | undefined> = {}) =>
  lintFile(FIX, fixFile(body, overrides), DIR, [MIGRATION]);

describe("parseHeader", () => {
  test("should parse a demosctl header", () => {
    expect(parseHeader(fixFile())).toEqual({
      ticket: "DEMOS-1000",
      author: "Example Author",
      dataOwner: "Example Data Owner",
      environments: ["dev", "test"],
      expectedRows: 2,
      source: "Synthetic fixture",
      reverse: REVERSE,
      reverses: undefined,
      override: undefined,
      mappingSha256: undefined,
      runner: "demosctl",
      requiresMigration: MIGRATION,
    });
  });

  test("should default the runner to psql", () => {
    const header = parseHeader(fixFile("", { runner: undefined, requires_migration: undefined }));
    expect(header.runner).toEqual("psql");
    expect(header.requiresMigration).toBeUndefined();
  });

  test("should stop reading the header at the first non-header line", () => {
    const sql = `${headerLines()}\n--\n-- commit: this is a comment, not a header field\n`;
    expect(parseHeader(sql).ticket).toEqual("DEMOS-1000");
  });

  test.each([
    [{ ticket: undefined }, "missing header field ticket"],
    [{ reverse: undefined }, "missing header field reverse"],
    [{ expected_rows: "<n>" }, "header field expected_rows still has a placeholder"],
    [{ source: "public list, retrieved <YYYY-MM-DD>" }, "header field source still has a placeholder"],
    [{ mapping_sha256: "<sha256 of the reviewed mapping CSV>" }, "header field mapping_sha256 still has a placeholder"],
    [{ expected_rows: "five" }, "expected_rows must be a non-negative integer"],
    [{ expected_rows: "-1" }, "expected_rows must be a non-negative integer"],
    [{ environments: " , " }, "environments must list at least one environment"],
    [{ runner: "bash" }, "runner must be demosctl or psql, not bash"],
    [{ requires_migration: undefined }, "runner: demosctl files require requires_migration"],
    [{ requires_migration: "../migrations" }, "requires_migration must be a migration folder name"],
    [{ reverse: "none" }, "reverse: none requires reverses: <forward fix file>"],
    [{ reverse: "none (this file is the reverse)" }, "reverse must be none or a .sql file name"],
    [{ reverse: "../other.sql" }, "reverse must be none or a .sql file name"],
    [{ reverses: FIX }, "reverses is only allowed with reverse: none"],
    [{ reverse: "none", reverses: "forward.txt" }, "reverses must be a .sql file name"],
    [{ overide: "typo" }, "unknown header field overide"],
  ])("should reject %o", (overrides, message) => {
    expect(() => parseHeader(fixFile("", overrides))).toThrow(message);
  });

  test("should reject duplicate and empty fields", () => {
    expect(() => parseHeader(`-- ticket: DEMOS-1\n-- ticket: DEMOS-2\n`)).toThrow("duplicate header field ticket");
    expect(() => parseHeader(`-- ticket:\n`)).toThrow("header field ticket is empty");
  });
});

describe("lintFile", () => {
  const notAllowed = (type: string) =>
    `top-level ${type} is not allowed; use only DO, SELECT, INSERT, UPDATE, DELETE and CREATE TEMPORARY TABLE data_fix_result`;

  test("should pass a valid demosctl file with BEGIN ... END inside a DO block", async () => {
    expect(await lint(`-- commit: just a comment\n${VALID_BODY}`)).toEqual([]);
  });

  test("should pass a valid reverse file", async () => {
    const sql = fixFile(VALID_BODY, { reverse: "none", reverses: FIX });
    expect(await lintFile(REVERSE, sql, DIR, [MIGRATION])).toEqual([]);
  });

  test("should return header errors as problems", async () => {
    expect(await lint(VALID_BODY, { ticket: undefined })).toEqual(["missing header field ticket"]);
  });

  test("should require the reverse and forward files to exist", async () => {
    expect(await lintFile(FIX, fixFile(), [FIX], [MIGRATION])).toEqual([`reverse file ${REVERSE} not found`]);
    const reverseSql = fixFile(VALID_BODY, { reverse: "none", reverses: FIX });
    expect(await lintFile(REVERSE, reverseSql, [REVERSE], [MIGRATION])).toEqual([`reverses file ${FIX} not found`]);
    expect(await lint(VALID_BODY, { reverse: FIX })).toEqual(["reverse must name a different file"]);
  });

  test("should require a known migration folder for demosctl files", async () => {
    expect(await lintFile(FIX, fixFile(), DIR, ["20250101000000_other"])).toEqual([
      `requires_migration ${MIGRATION} is not a folder in server/src/model/migrations`,
    ]);
  });

  test("should reject override on demosctl files", async () => {
    expect(await lint(VALID_BODY, { override: "some_trigger" })).toEqual([
      "override is not supported for runner: demosctl files",
    ]);
  });

  test("should require the temporary data_fix_result table", async () => {
    expect(await lint("UPDATE demos_app.example SET status = 'new';")).toEqual([
      "missing CREATE TEMPORARY TABLE data_fix_result",
    ]);
    expect(await lint("CREATE TABLE data_fix_result (rows_affected int);")).toEqual([
      notAllowed("CreateStmt"),
      "missing CREATE TEMPORARY TABLE data_fix_result",
    ]);
  });

  test.each([
    ["BEGIN;", "TransactionStmt"],
    ["START TRANSACTION;", "TransactionStmt"],
    ["COMMIT;", "TransactionStmt"],
    ["END;", "TransactionStmt"],
    ["ROLLBACK;", "TransactionStmt"],
    ["SAVEPOINT before_fix;", "TransactionStmt"],
    ["ALTER TABLE demos_app.example ADD COLUMN x int;", "AlterTableStmt"],
    ["ALTER TABLE demos_app.example DISABLE TRIGGER ALL;", "AlterTableStmt"],
    ["DROP TABLE demos_app.example;", "DropStmt"],
    ["truncate demos_app.example;", "TruncateStmt"],
    ["SET search_path = public;", "VariableSetStmt"],
    ["RESET search_path;", "VariableSetStmt"],
    ["SET statement_timeout = 0;", "VariableSetStmt"],
    ["SET session_replication_role = replica;", "VariableSetStmt"],
    ["RESET ROLE;", "VariableSetStmt"],
    ["SET SESSION AUTHORIZATION demos_admin;", "VariableSetStmt"],
    ["GRANT SELECT ON demos_app.example TO PUBLIC;", "GrantStmt"],
    ["CREATE TABLE demos_app.copy (id int);", "CreateStmt"],
    ["COPY demos_app.example TO STDOUT;", "CopyStmt"],
  ])("should reject the top-level statement %s", async (statement, type) => {
    expect(await lint(`${VALID_BODY}\n${statement}\n`)).toContain(notAllowed(type));
  });

  test("should reject psql meta-commands and other SQL that does not parse", async () => {
    expect(await lint(`${VALID_BODY}\n\\if :apply\n`)).toEqual([
      'SQL does not parse on line 30 (psql meta-commands are not allowed): syntax error at or near "\\"',
    ]);
    expect(await lint("UPDAT demos_app.example SET status = 'new';")).toEqual([
      expect.stringContaining('SQL does not parse on line 11: syntax error at or near "UPDAT"'),
    ]);
  });

  test.each([
    ["SELECT set_config('statement_timeout', '0', true);", "set_config"],
    ["SELECT pg_catalog.set_config('role', 'demos_admin', true);", "set_config"],
    ["SELECT 'SET ROLE demos_admin';", "SET ROLE / RESET ROLE"],
    ["DO $$ BEGIN EXECUTE 'RESET ROLE'; END $$;", "SET ROLE / RESET ROLE"],
    ["DO $$ BEGIN SET LOCAL ROLE demos_admin; END $$;", "SET ROLE / RESET ROLE"],
    ["DO $$ BEGIN SET SESSION AUTHORIZATION demos_admin; END $$;", "SESSION AUTHORIZATION"],
    ["DO $$ BEGIN SET LOCAL lock_timeout = 0; END $$;", "changing the runner's timeouts"],
    ["DO $$ BEGIN RESET ALL; END $$;", "changing the runner's timeouts"],
    ["DO $$ BEGIN PERFORM set_config('role', 'x', true); END $$;", "set_config"],
  ])("should reject %s anywhere outside comments", async (statement, label) => {
    expect(await lint(`${VALID_BODY}\n${statement}\n`)).toContain(`${label} is not allowed anywhere in the file`);
  });

  test("should ignore banned words in top-level comments", async () => {
    const body = `-- RESET ROLE; set_config; BEGIN;\n/* SET SESSION AUTHORIZATION /* nested */ */\n${VALID_BODY}`;
    expect(await lint(body)).toEqual([]);
  });

  test("should allow updating a column named role", async () => {
    const statements = [
      "UPDATE demos_app.example SET role = 'reviewer' WHERE id = 1;",
      "DO $$ BEGIN UPDATE demos_app.example SET role = 'reviewer' WHERE id = 1; END $$;",
    ];
    expect(await lint(`${VALID_BODY}\n${statements.join("\n")}\n`)).toEqual([]);
  });

  test("should only check the header and reverse pair on psql files", async () => {
    const body = "\\set ON_ERROR_STOP on\nBEGIN;\nSET LOCAL statement_timeout = '30s';\nCOMMIT;\n";
    const sql = fixFile(body, { runner: "psql", requires_migration: undefined, override: "some_trigger" });
    expect(await lintFile(FIX, sql, DIR, [])).toEqual([]);
  });

  test("should not check requires_migration on psql files", async () => {
    const sql = fixFile("BEGIN;", { runner: undefined, requires_migration: "20990101000000_unknown" });
    expect(await lintFile(FIX, sql, DIR, [])).toEqual([]);
  });
});
