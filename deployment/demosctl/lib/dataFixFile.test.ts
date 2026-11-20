import { lintFile, parseHeader } from "./dataFixFile";

const FIX = "20260101_DEMOS-1000_example_fix.sql";
const REVERSE = "20260101_DEMOS-1000_revert_example_fix.sql";
const MIGRATION = "20260101000000_example_migration";
const DIR = [FIX, REVERSE];
const PSQL_OVERRIDES = { runner: undefined, requires_migration: undefined };
const toCrlf = (sql: string) => sql.replace(/\n/g, "\r\n");

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

const VALID_BODY = `DO $$
BEGIN
    IF (SELECT count(*) FROM demos_app.example WHERE status = 'old') <> 2 THEN
        RAISE EXCEPTION 'expected 2 rows with status old';
    END IF;
END
$$;

CREATE TEMPORARY TABLE data_fix_result (rows_affected int) ON COMMIT DROP;

WITH updated AS (
    UPDATE demos_app.example SET status = 'new' WHERE status = 'old' RETURNING id
)
INSERT INTO data_fix_result (rows_affected) SELECT count(*) FROM updated;

SELECT count(*) AS remaining_old_rows FROM demos_app.example WHERE status = 'old';`;

const fixFile = (body: string = VALID_BODY, overrides: Record<string, string | undefined> = {}) =>
  `${headerLines(overrides)}\n--\n${body}`;

const REVERSE_SQL = fixFile(VALID_BODY, { reverse: "none", reverses: FIX });
const lint = (body: string = VALID_BODY, overrides: Record<string, string | undefined> = {}) =>
  lintFile(FIX, fixFile(body, overrides), DIR, [MIGRATION]);

const withStatements = (sql: string) => `${VALID_BODY}\n${sql}\n`;

// The 1-based line on which a statement appended after `body` starts
const lineAfter = (body: string) => fixFile(body).split("\n").length + 1;

// A valid body followed by a DO block containing `statements`
const withDoBlock = (statements: string) => withStatements(`DO $$ BEGIN ${statements} END $$;`);

const NOT_ALLOWED = expect.stringMatching(/^top-level .+ is not allowed/);
const SET_IN_DO = "SET/RESET is not allowed in DO blocks; use only SELECT, INSERT, UPDATE, DELETE";

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
      runner: "demosctl",
      requiresMigration: MIGRATION,
    });
  });

  test("should default the runner to psql", () => {
    const header = parseHeader(fixFile("", PSQL_OVERRIDES));
    expect(header.runner).toEqual("psql");
    expect(header.requiresMigration).toBeUndefined();
  });

  test("should parse a header with CRLF line endings", () => {
    expect(parseHeader(toCrlf(fixFile()))).toEqual(parseHeader(fixFile()));
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
  test("should pass a valid demosctl file with BEGIN ... END inside a DO block", async () => {
    expect(await lint(`-- commit: just a comment\n${VALID_BODY}`)).toEqual([]);
  });

  test("should pass a valid demosctl file with CRLF line endings", async () => {
    expect(await lintFile(FIX, toCrlf(fixFile()), DIR, [MIGRATION])).toEqual([]);
  });

  test("should pass a valid reverse file", async () => {
    expect(await lintFile(REVERSE, REVERSE_SQL, DIR, [MIGRATION])).toEqual([]);
  });

  test("should return header errors as problems", async () => {
    expect(await lint(VALID_BODY, { ticket: undefined })).toEqual(["missing header field ticket"]);
  });

  test("should require the reverse and forward files to exist", async () => {
    expect(await lintFile(FIX, fixFile(), [FIX], [MIGRATION])).toEqual([`reverse file ${REVERSE} not found`]);
    expect(await lintFile(REVERSE, REVERSE_SQL, [REVERSE], [MIGRATION])).toEqual([`reverses file ${FIX} not found`]);
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
    const problems = await lint("CREATE TABLE data_fix_result (rows_affected int);");
    expect(problems).toHaveLength(2);
    expect(problems).toContainEqual(NOT_ALLOWED);
    expect(problems).toContain("missing CREATE TEMPORARY TABLE data_fix_result");
  });

  test("should name the rejected statement and the allowed ones", async () => {
    expect(await lint(withStatements("BEGIN;"))).toEqual([
      "top-level transaction control (BEGIN, COMMIT, ROLLBACK, SAVEPOINT) is not allowed; " +
        "use only DO, SELECT, INSERT, UPDATE, DELETE and CREATE TEMPORARY TABLE data_fix_result",
    ]);
  });

  test.each([
    "BEGIN;",
    "START TRANSACTION;",
    "COMMIT;",
    "END;",
    "ROLLBACK;",
    "SAVEPOINT before_fix;",
    "ALTER TABLE demos_app.example ADD COLUMN x int;",
    "ALTER TABLE demos_app.example DISABLE TRIGGER ALL;",
    "DROP TABLE demos_app.example;",
    "truncate demos_app.example;",
    "SET search_path = public;",
    "RESET search_path;",
    "SET statement_timeout = 0;",
    "SET session_replication_role = replica;",
    "RESET ROLE;",
    "SET SESSION AUTHORIZATION demos_admin;",
    "GRANT SELECT ON demos_app.example TO PUBLIC;",
    "CREATE TABLE demos_app.copy (id int);",
    "COPY demos_app.example TO STDOUT;",
    "LOCK TABLE demos_app.example;",
    "VACUUM demos_app.example;",
  ])("should reject the top-level statement %s", async (statement) => {
    expect(await lint(withStatements(statement))).toContainEqual(NOT_ALLOWED);
  });

  test("should reject psql meta-commands with the line they are on", async () => {
    expect(await lint(withStatements("\\if :apply"))).toEqual([
      expect.stringMatching(
        new RegExp(`^SQL does not parse on line ${lineAfter(VALID_BODY)} \\(psql meta-commands are not allowed\\)`),
      ),
    ]);
  });

  test("should reject other SQL that does not parse with the line it is on", async () => {
    expect(await lint(withStatements("UPDAT demos_app.example SET status = 'new';"))).toEqual([
      expect.stringMatching(new RegExp(`^SQL does not parse on line ${lineAfter(VALID_BODY)}: `)),
    ]);
  });

  test.each([
    ["SELECT set_config('statement_timeout', '0', true);", "set_config"],
    ["SELECT pg_catalog.set_config('role', 'demos_admin', true);", "set_config"],
    ["SELECT 'SET ROLE demos_admin';", "SET ROLE / RESET ROLE"],
    ["DO $$ BEGIN PERFORM set_config('role', 'x', true); END $$;", "set_config"],
  ])("should reject %s anywhere outside comments", async (statement, label) => {
    expect(await lint(withStatements(statement))).toContain(`${label} is not allowed anywhere in the file`);
  });

  test.each([
    'SET LOCAL "statement_timeout" = \'0\';',
    "RESET/**/ROLE;",
    "SET role = 'postgres';",
    'SET "role" TO DEFAULT;',
    "SET SESSION/**/AUTHORIZATION DEFAULT;",
    "SET LOCAL ROLE demos_admin;",
    "SET SESSION AUTHORIZATION demos_admin;",
    "SET LOCAL lock_timeout = 0;",
    "RESET ALL;",
    "IF true THEN RESET ROLE; END IF;",
  ])("should reject a SET or RESET statement in a DO body: %s", async (statement) => {
    expect(await lint(withDoBlock(statement))).toContain(SET_IN_DO);
  });

  test("should reject RESET ROLE inside a labeled block", async () => {
    expect(await lint(withStatements("DO $$ <<label>> BEGIN RESET ROLE; END label $$;"))).toContain(SET_IN_DO);
  });

  test.each([
    "DO $$ BEGIN EXECUTE format('%s %s', 'reset', 'role'); END $$;",
    "DO $$ BEGIN EXECUTE 'RESET ROLE'; END $$;",
    "DO $fix$ BEGIN EXECUTE 'RESET ROLE'; END $fix$;",
    "DO $$ DECLARE r record; BEGIN FOR r IN EXECUTE 'SELECT 1' LOOP NULL; END LOOP; END $$;",
  ])("should reject dynamic EXECUTE in a DO body: %s", async (statement) => {
    expect(await lint(withStatements(statement))).toContain("EXECUTE is not allowed in DO blocks");
  });

  test.each([
    "DROP TABLE demos_app.example;",
    "TRUNCATE demos_app.example;",
    "CREATE TEMP TABLE staging (id int);",
    "CALL some_procedure();",
  ])("should reject non-DML SQL inside a DO block: %s", async (statement) => {
    expect(await lint(withDoBlock(statement))).toContainEqual(
      expect.stringContaining("is not allowed in DO blocks; use only SELECT, INSERT, UPDATE, DELETE"),
    );
  });

  test.each(["COMMIT;", "ROLLBACK;"])("should reject %s inside a DO block", async (statement) => {
    expect(await lint(withDoBlock(statement))).toContain(
      "transaction control (COMMIT, ROLLBACK) is not allowed in DO blocks",
    );
  });

  test("should reject DO blocks in languages other than PL/pgSQL", async () => {
    expect(await lint(withStatements("DO LANGUAGE sql $$ SELECT 1 $$;"))).toContain(
      "DO blocks must use PL/pgSQL to be linted",
    );
  });

  test("should report a banned string only once when it appears at top level and in a DO block", async () => {
    const body = withStatements(
      "SELECT set_config('statement_timeout', '0', true);\nDO $$ BEGIN PERFORM set_config('role', 'x', true); END $$;",
    );
    expect(await lint(body)).toEqual(["set_config is not allowed anywhere in the file"]);
  });

  test("should report invalid PL/pgSQL as a lint problem", async () => {
    expect(await lint(withDoBlock("IF true THEN"))).toEqual([expect.stringMatching(/^SQL does not parse/)]);
  });

  test("should ignore banned words in top-level comments", async () => {
    const body = `-- RESET ROLE; set_config; BEGIN;\n/* SET SESSION AUTHORIZATION /* nested */ */\n${VALID_BODY}`;
    expect(await lint(body)).toEqual([]);
  });

  test("should ignore banned words in comments inside a DO body", async () => {
    expect(await lint(withDoBlock("-- no RESET ROLE here\nPERFORM 1;"))).toEqual([]);
  });

  test("should not treat comment markers inside string literals as comments", async () => {
    expect(await lint(withDoBlock("RAISE NOTICE 'not a -- comment'; PERFORM 1;"))).toEqual([]);
  });

  test("should allow updating a column named role", async () => {
    const statements = [
      "UPDATE demos_app.example SET role = 'reviewer' WHERE id = 1;",
      "DO $$ BEGIN UPDATE demos_app.example SET role = 'reviewer' WHERE id = 1; END $$;",
    ];
    expect(await lint(withStatements(statements.join("\n")))).toEqual([]);
  });

  test("should only check the header and reverse pair on psql files", async () => {
    const body = "\\set ON_ERROR_STOP on\nBEGIN;\nSET LOCAL statement_timeout = '30s';\nCOMMIT;\n";
    const sql = fixFile(body, { ...PSQL_OVERRIDES, runner: "psql", override: "some_trigger" });
    expect(await lintFile(FIX, sql, DIR, [])).toEqual([]);
  });

  test("should not check requires_migration on psql files", async () => {
    const sql = fixFile("BEGIN;", { ...PSQL_OVERRIDES, requires_migration: "20990101000000_unknown" });
    expect(await lintFile(FIX, sql, DIR, [])).toEqual([]);
  });
});
