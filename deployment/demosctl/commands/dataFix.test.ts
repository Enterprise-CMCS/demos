import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { dataFixLint } from "./dataFix";

const FIXTURES = path.join(__dirname, "__fixtures__");
const VALID_DIR = path.join(FIXTURES, "data_fixes", "valid");
const MIGRATIONS_DIR = path.join(FIXTURES, "migrations");

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
