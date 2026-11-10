import fs from "node:fs";
import path from "node:path";

import { lintFile, lintReversePairs, parseHeader } from "../lib/dataFixFile";
import type { DataFixHeader } from "../lib/dataFixFile";

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
