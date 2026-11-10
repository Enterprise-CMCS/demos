import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { Client } from "pg";

import { getSecret } from "../lib/getSecret";
import { fetchCACert } from "./testMigration";
import { checkSchemaGate, dataFix, dataFixLint } from "./dataFix";

vi.mock("pg");
vi.mock("../lib/getSecret");
vi.mock("./testMigration", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./testMigration")>()),
  fetchCACert: vi.fn(),
}));

const FIXTURES = path.join(__dirname, "__fixtures__");
const VALID_DIR = path.join(FIXTURES, "data_fixes", "valid");
const MIGRATIONS_DIR = path.join(FIXTURES, "migrations");
const DEMOSCTL_FIX = "20260101_DEMOS-1000_example_fix.sql";
const DEMOSCTL_REVERSE = "20260101_DEMOS-1000_revert_example_fix.sql";
const PSQL_FIX = "20260102_DEMOS-1001_psql_style_fix.sql";
const PSQL_REVERSE = "20260102_DEMOS-1001_revert_psql_style_fix.sql";

describe("dataFixLint", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "data-fix-lint-"));
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  const writeTempFile = (name: string, content: string) => fs.writeFileSync(path.join(tempDir, name), content);
  const lintTempDir = () => dataFixLint(tempDir, MIGRATIONS_DIR);

  const copyValidFixtures = () => {
    for (const file of fs.readdirSync(VALID_DIR)) {
      fs.copyFileSync(path.join(VALID_DIR, file), path.join(tempDir, file));
    }
  };

  const replaceHeader = (file: string, key: "reverse" | "reverses", value: string) => {
    const sql = fs.readFileSync(path.join(tempDir, file), "utf8");
    writeTempFile(file, sql.replace(new RegExp(`^-- ${key}:.*$`, "m"), `-- ${key}: ${value}`));
  };

  test("should pass the valid demosctl and psql fixtures and ignore README.md", async () => {
    const sqlFiles = fs.readdirSync(VALID_DIR).filter((file) => file.endsWith(".sql"));
    expect(await dataFixLint(VALID_DIR, MIGRATIONS_DIR)).toEqual(0);
    expect(console.log).toHaveBeenCalledWith(`data fix lint passed for ${sqlFiles.length} file(s)`);
    expect(console.error).not.toHaveBeenCalled();
  });

  test("should pass a folder with only README.md", async () => {
    writeTempFile("README.md", "# No fix files\n");
    expect(await lintTempDir()).toEqual(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("no fix files"));
  });

  test("should pass when the folder does not exist", async () => {
    expect(await dataFixLint(path.join(tempDir, "missing"), MIGRATIONS_DIR)).toEqual(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("no fix files"));
  });

  test("should reject a CSV in the folder", async () => {
    copyValidFixtures();
    writeTempFile("mapping.csv", "id,value\n");

    expect(await lintTempDir()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith("mapping.csv: CSV files must not be committed to the data fix folder");
  });

  test("should reject a CSV even when there are no fix files", async () => {
    writeTempFile("mapping.CSV", "id,value\n");

    expect(await lintTempDir()).toEqual(1);
  });

  test("should reject SQL file names with an uppercase extension", async () => {
    writeTempFile("invalid.SQL", "");

    expect(await lintTempDir()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith("invalid.SQL: SQL file names must use the lowercase .sql extension");
    expect(console.error).not.toHaveBeenCalledWith(expect.stringMatching(/^invalid\.SQL: missing header field /));
  });

  test.each([
    ["demosctl", DEMOSCTL_FIX, DEMOSCTL_REVERSE, PSQL_REVERSE],
    ["psql", PSQL_FIX, PSQL_REVERSE, DEMOSCTL_REVERSE],
  ])("should require a %s forward fix to name its actual reversal", async (_runner, fix, reverse, otherReverse) => {
    copyValidFixtures();
    replaceHeader(fix, "reverse", otherReverse);

    expect(await lintTempDir()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith(`${reverse}: reverses file ${fix} must declare reverse: ${reverse}`);
  });

  test.each([
    ["demosctl", DEMOSCTL_FIX, DEMOSCTL_REVERSE, PSQL_FIX],
    ["psql", PSQL_FIX, PSQL_REVERSE, DEMOSCTL_FIX],
  ])("should require a %s reversal to point at its actual forward fix", async (_runner, fix, reverse, otherFix) => {
    copyValidFixtures();
    replaceHeader(reverse, "reverses", otherFix);

    expect(await lintTempDir()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith(`${fix}: reverse file ${reverse} must declare reverses: ${fix}`);
  });

  test("should report problems with the file name and fail", async () => {
    copyValidFixtures();
    const file = "20260101_DEMOS-1000_example_fix.sql";
    const sql = fs.readFileSync(path.join(tempDir, file), "utf8");
    writeTempFile(file, `${sql}\nBEGIN;\n`);

    expect(await lintTempDir()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/^20260101_DEMOS-1000_example_fix\.sql: /));
    expect(console.error).toHaveBeenCalledWith("data fix lint failed with 1 problem(s)");
  });

  test("should report problems from every bad file", async () => {
    writeTempFile("first.sql", "");
    writeTempFile("second.sql", "");

    expect(await lintTempDir()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/^first\.sql: /));
    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/^second\.sql: /));
    expect(console.error).toHaveBeenCalledWith("data fix lint failed with 2 problem(s)");
  });

  test("should fail a demosctl file when its migration folder is missing", async () => {
    copyValidFixtures();

    expect(await dataFixLint(tempDir, path.join(tempDir, "no-migrations"))).toEqual(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("requires_migration 20260101000000_example_migration is not a folder"),
    );
  });
});

describe("dataFix", () => {
  const migration = "20261104004932_add_data_fix_log";
  const applyOptions = {
    apply: true,
    approvedBy: "test-approver",
    appliedBy: "test-build-user",
    gitCommit: "test-commit",
    buildUrl: "https://example.invalid/build/1",
  };
  let tempDir: string;
  let client: Client;
  let sql: string;
  let reverseSql: string;
  let noticeHandler: (notice: { message: string }) => void;
  let normalQuery: (query: string) => Promise<unknown>;

  const fixPath = () => path.join(tempDir, DEMOSCTL_FIX);
  const writeFix = (content: string) => fs.writeFileSync(fixPath(), content);
  const statements = () => vi.mocked(client.query).mock.calls.map(([query]) => query);
  const expectQueryOrder = (...queries: (string | RegExp)[]) => {
    const actual = statements();
    let previousIndex = -1;
    for (const query of queries) {
      const index = actual.findIndex((statement) => typeof statement === "string" && (
        typeof query === "string" ? statement === query : query.test(statement)
      ));
      expect(index, `expected query ${query.toString()} after index ${previousIndex}`).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }
  };
  const run = (options: Parameters<typeof dataFix>[2] = { apply: false }) => dataFix("dev", fixPath(), options, client);
  const checksum = () => createHash("sha256").update(sql).digest("hex");
  const mockQuery = (implementation: (query: string) => Promise<unknown>) => {
    client.query = vi.fn(implementation) as unknown as typeof client.query;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    tempDir = fs.mkdtempSync(path.join(__dirname, "data-fix-runner-"));
    sql = fs.readFileSync(path.join(VALID_DIR, DEMOSCTL_FIX), "utf8")
      .replace("20260101000000_example_migration", migration);
    reverseSql = fs.readFileSync(path.join(VALID_DIR, DEMOSCTL_REVERSE), "utf8")
      .replace("20260101000000_example_migration", migration);
    writeFix(sql);
    fs.writeFileSync(path.join(tempDir, DEMOSCTL_REVERSE), reverseSql);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    client = new Client();
    normalQuery = async (query: string) => {
      if (query.includes("_prisma_migrations")) {
        return { rows: [{ exists: 1 }] };
      }
      if (query.startsWith("SELECT checksum")) {
        return { rows: [] };
      }
      if (query === sql || query === reverseSql) {
        noticeHandler({ message: "aggregate check passed" });
        return [
          { command: "UPDATE", rows: [] },
          { command: "SELECT", rows: [{ remaining_old_rows: "0" }] },
        ];
      }
      if (query.includes("pg_temp.data_fix_result")) {
        return { rows: [{ rows_affected: 2 }] };
      }
      if (query === "SELECT current_user") {
        return { rows: [{ current_user: "demos_data_fix" }] };
      }
      return { rows: [] };
    };
    mockQuery(normalQuery);
    vi.mocked(client.on).mockImplementation((event, listener) => {
      if (event === "notice") {
        noticeHandler = listener as typeof noticeHandler;
      }
      return client;
    });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  test("should dry run without Jenkins metadata and roll back the whole body", async () => {
    expect(await run()).toEqual(0);
    expectQueryOrder(
      /_prisma_migrations/,
      /SELECT checksum/,
      "BEGIN",
      "SET LOCAL ROLE demos_data_fix",
      sql,
      "SELECT rows_affected FROM pg_temp.data_fix_result",
      "SELECT current_user",
      "SET CONSTRAINTS ALL IMMEDIATE",
      "RESET ROLE",
      "ROLLBACK",
    );
    for (const timeout of [
      "SET LOCAL lock_timeout = '5s'",
      "SET LOCAL statement_timeout = '30s'",
      "SET LOCAL idle_in_transaction_session_timeout = '30s'",
    ]) {
      expectQueryOrder("BEGIN", timeout, "SET LOCAL ROLE demos_data_fix");
    }
    expect(statements()).not.toContain("COMMIT");
    expect(client.query).not.toHaveBeenCalledWith(expect.stringContaining("INSERT INTO demos_app.data_fix_log"), expect.any(Array));
    expect(vi.mocked(client.query).mock.calls.find(([query]) => query === sql)).toEqual([sql]);
    expect(console.log).toHaveBeenCalledWith("rows affected:", 2);
    expect(console.log).toHaveBeenCalledWith("evidence:", [{ remaining_old_rows: "0" }]);
    expect(console.log).toHaveBeenCalledWith("notice:", "aggregate check passed");
    expect(console.log).toHaveBeenCalledWith("dry run rolled back:", DEMOSCTL_FIX);
    expect(console.error).not.toHaveBeenCalled();
    expect(client.connect).toHaveBeenCalledOnce();
    expect(client.end).toHaveBeenCalledOnce();
    expect(client.removeListener).toHaveBeenCalledWith("notice", noticeHandler);
    expect(getSecret).not.toHaveBeenCalled();
  });

  test("should insert the ledger after RESET ROLE and commit an apply", async () => {
    expect(await run(applyOptions)).toEqual(0);
    const calls = vi.mocked(client.query).mock.calls;
    const insertIndex = calls.findIndex(([query]) => typeof query === "string" && query.includes("INSERT INTO demos_app.data_fix_log"));
    expectQueryOrder(sql, "SELECT rows_affected FROM pg_temp.data_fix_result", "SELECT current_user", "SET CONSTRAINTS ALL IMMEDIATE", "RESET ROLE", /INSERT INTO demos_app\.data_fix_log/, "COMMIT");
    expect(calls[insertIndex][0]).toContain("reverse_file");
    expect(calls[insertIndex][1]).toEqual([
      DEMOSCTL_FIX, checksum(), "DEMOS-1000", "dev", 2, DEMOSCTL_REVERSE, null,
      applyOptions.gitCommit, applyOptions.appliedBy, applyOptions.approvedBy, applyOptions.buildUrl,
    ]);
    expect(statements().at(-1)).toEqual("COMMIT");
    expect(statements()).not.toContain("ROLLBACK");
  });

  test("should link a reverse apply to the forward fix", async () => {
    expect(await dataFix("dev", path.join(tempDir, DEMOSCTL_REVERSE), applyOptions, client)).toEqual(0);
    const insert = vi.mocked(client.query).mock.calls.find(([query]) => typeof query === "string" && query.includes("INSERT INTO demos_app.data_fix_log"));
    expect(insert?.[1]).toEqual([
      DEMOSCTL_REVERSE, createHash("sha256").update(reverseSql).digest("hex"), "DEMOS-1000", "dev", 2, null, DEMOSCTL_FIX,
      applyOptions.gitCommit, applyOptions.appliedBy, applyOptions.approvedBy, applyOptions.buildUrl,
    ]);
  });

  describe.each([undefined, "", "  "])("missing Jenkins value %j", (value) => {
    test.each(["approvedBy", "appliedBy", "gitCommit", "buildUrl"] as const)("should refuse apply without %s before connecting", async (key) => {
      expect(await run({ ...applyOptions, [key]: value })).toEqual(1);
      expect(console.error).toHaveBeenCalledWith("apply only runs from Jenkins");
      expect(client.connect).not.toHaveBeenCalled();
      expect(getSecret).not.toHaveBeenCalled();
    });
  });

  test.each([
    ["psql runner", (text: string) => text.replace("demosctl", "psql")],
    ["environment", (text: string) => text.replace("dev, test", "prod")],
    ["override", (text: string) => `-- override: yes\n${text}`],
    ["placeholder", (text: string) => text.replace("expected_rows:      2", "expected_rows: <n>")],
    ["fractional expected_rows", (text: string) => text.replace("expected_rows:      2", "expected_rows: 2.5")],
    ["unsafe expected_rows", (text: string) => text.replace("expected_rows:      2", "expected_rows: 9007199254740993")],
    ["missing migration folder", (text: string) => text.replace(migration, "missing_migration")],
    ["transaction control", (text: string) => `${text}\nCOMMIT;`],
    ["role change", (text: string) => `${text}\nRESET ROLE;`],
  ])("should refuse %s before connecting", async (_name, change) => {
    writeFix(change(sql));
    expect(await run()).toEqual(1);
    expect(client.connect).not.toHaveBeenCalled();
    expect(getSecret).not.toHaveBeenCalled();
  });

  test("should print the header problem for a malformed header", async () => {
    writeFix(sql.replace("expected_rows:      2", "expected_rows: <n>"));
    expect(await run()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("expected_rows"));
  });

  test("should refuse a missing file before connecting", async () => {
    fs.unlinkSync(fixPath());
    expect(await run()).toEqual(1);
    expect(client.connect).not.toHaveBeenCalled();
  });

  test("should refuse a missing partner before connecting", async () => {
    fs.unlinkSync(path.join(tempDir, DEMOSCTL_REVERSE));
    expect(await run()).toEqual(1);
    expect(client.connect).not.toHaveBeenCalled();
  });

  test("should refuse a mismatched reverse pair before connecting", async () => {
    fs.writeFileSync(path.join(tempDir, DEMOSCTL_REVERSE), reverseSql.replace(DEMOSCTL_FIX, PSQL_FIX));
    expect(await run()).toEqual(1);
    expect(client.connect).not.toHaveBeenCalled();
  });

  test("should refuse a missing, unfinished, or rolled back release migration before BEGIN", async () => {
    vi.mocked(client.query).mockResolvedValueOnce({ rows: [] } as never);
    expect(await run()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith(`release migration \`${migration}\` to \`dev\` first`);
    expect(statements()).not.toContain("BEGIN");
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining("finished_at IS NOT NULL AND rolled_back_at IS NULL"), [migration]);
  });

  test("should expose the schema gate without running a transaction", async () => {
    vi.mocked(client.query).mockResolvedValueOnce({ rows: [] } as never);
    await expect(checkSchemaGate(client, migration)).rejects.toThrow(migration);
    expect(statements()).not.toContain("BEGIN");
  });

  test.each([false, true])("should return already applied without a transaction (apply=%s)", async (apply) => {
    vi.mocked(client.query).mockResolvedValueOnce({ rows: [{}] } as never).mockResolvedValueOnce({ rows: [{ checksum: checksum() }] } as never);
    expect(await run({ ...applyOptions, apply })).toEqual(0);
    expect(console.log).toHaveBeenCalledWith("already applied:", DEMOSCTL_FIX);
    expect(statements()).not.toContain("BEGIN");
  });

  test("should refuse a checksum change", async () => {
    vi.mocked(client.query).mockResolvedValueOnce({ rows: [{}] } as never).mockResolvedValueOnce({ rows: [{ checksum: "different" }] } as never);
    expect(await run()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("different checksum"));
    expect(statements()).not.toContain("BEGIN");
  });

  test.each([
    ["row-count mismatch", [{ rows_affected: 1 }], "demos_data_fix", "row count mismatch: expected 2, got 1"],
    ["missing result row", [], "demos_data_fix", "data_fix_result must contain exactly one integer rows_affected"],
    ["multiple result rows", [{ rows_affected: 2 }, { rows_affected: 2 }], "demos_data_fix", "data_fix_result must contain exactly one integer rows_affected"],
    ["null result", [{ rows_affected: null }], "demos_data_fix", "data_fix_result must contain exactly one integer rows_affected"],
    ["noninteger result", [{ rows_affected: "2" }], "demos_data_fix", "data_fix_result must contain exactly one integer rows_affected"],
    ["changed role", [{ rows_affected: 2 }], "demos_admin", "data fix body changed current_user; refusing to continue"],
  ])("should roll back %s without writing the ledger", async (_name, rows, role, message) => {
    mockQuery((query: string) => {
      if (query.includes("pg_temp.data_fix_result")) {
        return Promise.resolve({ rows });
      }
      if (query === "SELECT current_user") {
        return Promise.resolve({ rows: [{ current_user: role }] });
      }
      return normalQuery(query);
    });
    expect(await run(applyOptions)).toEqual(1);
    expect(client.query).toHaveBeenCalledWith(sql);
    expect(client.query).toHaveBeenCalledWith("SELECT rows_affected FROM pg_temp.data_fix_result");
    expect(console.error).toHaveBeenCalledExactlyOnceWith(message);
    expect(statements().at(-1)).toEqual("ROLLBACK");
    expect(statements()).not.toContain("COMMIT");
    expect(statements().some((query) => typeof query === "string" && query.includes("INSERT INTO demos_app.data_fix_log"))).toEqual(false);
    expect(client.removeListener).toHaveBeenCalledWith("notice", noticeHandler);
    expect(client.end).toHaveBeenCalledOnce();
  });

  test.each([
    ["body", "fix body"],
    ["deferred", "deferred constraints"],
    ["ledger", "ledger insert"],
    ["commit", "commit"],
  ])("should roll back a %s error and close the connection", async (phase, reportedPhase) => {
    const fail = vi.fn(() => Promise.reject(new Error("synthetic database failure")));
    mockQuery((query: string) => {
      if ((phase === "body" && query === sql) || (phase === "deferred" && query === "SET CONSTRAINTS ALL IMMEDIATE") || (phase === "ledger" && query.includes("INSERT INTO demos_app.data_fix_log")) || (phase === "commit" && query === "COMMIT")) {
        return fail();
      }
      return normalQuery(query);
    });
    expect(await run(applyOptions)).toEqual(1);
    expect(fail).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledExactlyOnceWith(`data fix failed during ${reportedPhase}`);
    expect(statements().at(-1)).toEqual("ROLLBACK");
    if (phase === "deferred") {
      expect(statements()).not.toContain("RESET ROLE");
      expect(statements().some((query) => typeof query === "string" && query.includes("INSERT INTO demos_app.data_fix_log"))).toEqual(false);
    }
    if (phase !== "commit") {
      expect(statements()).not.toContain("COMMIT");
    }
    expect(client.removeListener).toHaveBeenCalledWith("notice", noticeHandler);
    expect(client.end).toHaveBeenCalledOnce();
  });

  test("should roll back a deferred-constraint failure in a dry run", async () => {
    const fail = vi.fn(() => Promise.reject(new Error("synthetic database failure")));
    mockQuery((query: string) => {
      if (query === "SET CONSTRAINTS ALL IMMEDIATE") {
        return fail();
      }
      return normalQuery(query);
    });
    expect(await run()).toEqual(1);
    expect(fail).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledExactlyOnceWith("data fix failed during deferred constraints");
    expect(statements().at(-1)).toEqual("ROLLBACK");
    expect(statements()).not.toContain("RESET ROLE");
    expect(statements()).not.toContain("COMMIT");
    expect(statements().some((query) => typeof query === "string" && query.includes("INSERT INTO demos_app.data_fix_log"))).toEqual(false);
    expect(client.end).toHaveBeenCalledOnce();
  });

  test.each([
    { name: "rollback", rollbackFails: true, disconnectFails: false },
    { name: "disconnect", rollbackFails: false, disconnectFails: true },
    { name: "rollback and disconnect", rollbackFails: true, disconnectFails: true },
  ])("should handle $name failure after a body error", async ({ rollbackFails, disconnectFails }) => {
    mockQuery((query: string) => {
      if (query === sql || (query === "ROLLBACK" && rollbackFails)) {
        return Promise.reject(new Error("synthetic failure"));
      }
      return normalQuery(query);
    });
    if (disconnectFails) {
      vi.mocked(client.end).mockRejectedValueOnce(new Error("synthetic disconnect failure"));
    }
    expect(await run()).toEqual(1);
    expect(console.error).toHaveBeenCalledWith("data fix failed during fix body");
    expect(vi.mocked(console.error).mock.calls).toEqual([
      ["data fix failed during fix body"],
      ...(rollbackFails ? [["rollback failed; closing database connection"]] : []),
      ...(disconnectFails ? [["failed to close database connection"]] : []),
    ]);
    expect(client.query).toHaveBeenCalledWith(sql);
    expect(statements().at(-1)).toEqual("ROLLBACK");
    expect(client.removeListener).toHaveBeenCalledWith("notice", noticeHandler);
    expect(client.end).toHaveBeenCalledOnce();
  });

  test("should roll back when the last statement is not evidence", async () => {
    mockQuery((query: string) => {
      if (query === sql) {
        return Promise.resolve([{ command: "INSERT", rows: [] }]);
      }
      return normalQuery(query);
    });
    expect(await run()).toEqual(1);
    expect(client.query).toHaveBeenCalledWith(sql);
    expect(console.error).toHaveBeenCalledExactlyOnceWith("data fix body must end with an aggregate evidence SELECT");
    expect(statements().at(-1)).toEqual("ROLLBACK");
    expect(statements()).not.toContain("SELECT rows_affected FROM pg_temp.data_fix_result");
    expect(statements()).not.toContain("COMMIT");
    expect(client.end).toHaveBeenCalledOnce();
  });

  test("should connect to demos using secret fields and verified TLS without logging credentials", async () => {
    vi.mocked(getSecret).mockResolvedValueOnce(JSON.stringify({ username: "synthetic-user", password: "synthetic-password/@", host: "example.invalid", port: 15432 })); // pragma: allowlist secret
    vi.mocked(fetchCACert).mockResolvedValueOnce("synthetic-ca");
    vi.mocked(Client).mockImplementationOnce(function () { return client; });
    expect(await dataFix("dev", fixPath(), { apply: false })).toEqual(0);
    expect(getSecret).toHaveBeenCalledWith("demos-dev-rds-admin");
    expect(Client).toHaveBeenLastCalledWith({
      user: "synthetic-user", password: "synthetic-password/@", host: "example.invalid", port: 15432, // pragma: allowlist secret
      database: "demos", ssl: { ca: "synthetic-ca", rejectUnauthorized: true },
    });
    expect(JSON.stringify([...vi.mocked(console.log).mock.calls, ...vi.mocked(console.error).mock.calls])).not.toContain("synthetic-password");
  });

  test.each([undefined, "not-json", "{}", '{"username":"user","password":"secret"}'])("should fail closed on invalid secret data: %s", async (secret) => { // pragma: allowlist secret
    vi.mocked(getSecret).mockResolvedValueOnce(secret);
    expect(await dataFix("dev", fixPath(), { apply: false })).toEqual(1);
    expect(getSecret).toHaveBeenCalledExactlyOnceWith("demos-dev-rds-admin");
    expect(console.error).toHaveBeenCalledExactlyOnceWith(secret ? "invalid database credentials" : "unable to retrieve database credentials");
    expect(fetchCACert).not.toHaveBeenCalled();
    expect(client.connect).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("secret");
  });

  test("should not print connection errors that could contain credentials", async () => {
    vi.mocked(client.connect).mockRejectedValueOnce(new Error("synthetic-password is invalid"));
    expect(await run()).toEqual(1);
    expect(client.connect).toHaveBeenCalledOnce();
    expect(client.query).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledExactlyOnceWith("data fix failed during database connection");
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("synthetic-password");
    expect(client.removeListener).toHaveBeenCalledWith("notice", noticeHandler);
    expect(client.end).toHaveBeenCalledOnce();
  });
});
