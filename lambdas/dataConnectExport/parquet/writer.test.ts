import { DuckDBInstance } from "@duckdb/node-api";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import type { PoolClient } from "pg";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { log } from "../log";
import type { RelationSchema } from "../types";
import { writeRelationToFile as writeWithConnection } from "./writer";

// The real logger, silenced. Mocking the module instead would leave log.ts loaded by nothing.
const warnSpy = vi.spyOn(log, "warn").mockImplementation(() => {});

const mocks = vi.hoisted(() => ({ rmMock: vi.fn() }));

// Importing writer pulls in database/pool, which builds a SecretsManagerClient at module
// scope. Only the schema name is needed here.
vi.mock("../database/pool", () => ({ dbSchema: "demos_app" }));

// rm delegates to the real one, so the cleanup assertions look at the filesystem. A single
// test overrides it to prove a cleanup failure cannot mask the result.
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  mocks.rmMock.mockImplementation(actual.rm);
  return { ...actual, rm: mocks.rmMock };
});

// Written to a subdirectory rather than os.tmpdir() itself, so cleanupTmp's sweep cannot reach
// these files while a test is using them. The staged CSV goes here too, which is what lets a
// test check the writer removed it.
const workDir = mkdtempSync(path.join(os.tmpdir(), "writer-test-"));
vi.mock("../util/staging", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../util/staging")>();
  return {
    ...actual,
    csvPath: (relation: string) => path.join(workDir, `${relation}.csv`),
  };
});

let fileCounter = 0;

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

beforeEach(() => {
  vi.clearAllMocks();
});

function outputPath(): string {
  fileCounter += 1;
  return path.join(workDir, `relation-${fileCounter}.parquet`);
}

// Every supported DuckDB type, so the encoding assertions cover the whole contract.
const SCHEMA: RelationSchema = {
  columns: [
    { name: "id", duckdbType: "BIGINT" },
    { name: "small", duckdbType: "SMALLINT" },
    { name: "count", duckdbType: "INTEGER" },
    { name: "flag", duckdbType: "BOOLEAN" },
    { name: "amount", duckdbType: "DECIMAL(18,2)" },
    { name: "wide", duckdbType: "DECIMAL(38,4)" },
    { name: "rate", duckdbType: "FLOAT" },
    { name: "ratio", duckdbType: "DOUBLE" },
    { name: "effective_date", duckdbType: "DATE" },
    { name: "created_at", duckdbType: "TIMESTAMP_MS" },
    { name: "updated_at", duckdbType: "TIMESTAMPTZ" },
    { name: "uid", duckdbType: "UUID" },
    { name: "payload", duckdbType: "JSON" },
    { name: 'odd"name', duckdbType: "VARCHAR" },
  ],
};

// One CSV row exactly as Postgres writes it under DateStyle=ISO,MDY and TimeZone=UTC: booleans
// as t and f, no quoting unless a field needs it, an embedded quote doubled.
const FULL_ROW = `${[
  "9007199254740993",
  "-32768",
  "42",
  "t",
  "-0.05",
  "-1234567890123456789012345678901234.5678",
  "0.5",
  "0.1",
  "1969-07-20",
  "2026-08-31 07:00:00.123",
  "2026-08-31 07:00:00+00",
  "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  '"{""a"":1}"',
  '"has a "" in it"',
].join(",")}\n`;

// Postgres writes a NULL as an empty unquoted field, so an all-null row is just separators.
const NULL_ROW = `${",".repeat(SCHEMA.columns.length - 1)}\n`;

type Harness = {
  client: PoolClient;
  state: { sql: string };
};

/**
 * A client rather than a pool: connecting and releasing belong to withSnapshot, so a writer
 * that took its own connection would read outside the export's snapshot.
 *
 * pg hands the Submittable back to the caller. writer.ts still builds the real one, so the
 * generated SQL can be read off it, while the returned stream carries the fixture bytes and
 * the COPY tag row count.
 */
function fakeClient(csv: string, rowCount: number, streamError?: Error): Harness {
  const state = { sql: "" };

  const client = {
    query: (submittable: { text: string }) => {
      state.sql = submittable.text;

      const stream = streamError
        ? new Readable({
            read() {
              this.destroy(streamError);
            },
          })
        : Readable.from([Buffer.from(csv, "utf8")]);

      return Object.assign(stream, { rowCount });
    },
  };

  return { client: client as unknown as PoolClient, state };
}

async function reader() {
  const connection = await (await DuckDBInstance.create(":memory:")).connect();
  return async (sql: string) =>
    (await (await connection.run(sql)).getRowObjectsJS()) as Record<string, unknown>[];
}

async function writeRelationToFile(
  client: PoolClient,
  relation: string,
  schema: RelationSchema,
  destinationPath: string
): Promise<number> {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();

  try {
    return await writeWithConnection(client, connection, relation, schema, destinationPath);
  } finally {
    connection.closeSync();
    instance.closeSync();
  }
}

describe("writeRelationToFile", () => {
  it("copies the allowlisted columns out of the schema-qualified relation as csv", async () => {
    const { client, state } = fakeClient("", 0);
    await writeRelationToFile(client, "demonstration", SCHEMA, outputPath());

    expect(state.sql).toContain('FROM demos_app."demonstration"');
    expect(state.sql).toContain("TO STDOUT WITH (FORMAT csv)");
    // An embedded quote has to survive into the column list.
    expect(state.sql).toContain('"odd""name"');
    // No cast. Postgres formats every value with the type's own output function, and a cast
    // would rename the column in a file that has no header to correct it.
    expect(state.sql).not.toContain("::text");
  });

  it("asks for no header, because the read_csv spec is positional", async () => {
    const { client, state } = fakeClient("", 0);
    await writeRelationToFile(client, "state", SCHEMA, outputPath());

    expect(state.sql).not.toContain("HEADER");
  });

  it("writes the parquet encodings the DataConnect dashboard contract depends on", async () => {
    const { client } = fakeClient(FULL_ROW, 1);
    const out = outputPath();
    await writeRelationToFile(client, "demonstration", SCHEMA, out);

    const query = await reader();
    const rows = await query(
      `SELECT name, concat(type, coalesce('/' || converted_type, '')) AS encoding, logical_type
       FROM parquet_schema('${out}') WHERE num_children IS NULL`
    );
    const encodings = Object.fromEntries(rows.map((r) => [r.name, r.encoding]));

    expect(encodings).toEqual({
      id: "INT64/INT_64",
      small: "INT32/INT_16",
      count: "INT32/INT_32",
      flag: "BOOLEAN",
      amount: "INT64/DECIMAL",
      // Precision above 18 no longer fits an INT64, so the physical type changes.
      wide: "FIXED_LEN_BYTE_ARRAY/DECIMAL",
      rate: "FLOAT",
      ratio: "DOUBLE",
      effective_date: "INT32/DATE",
      // The whole reason typeMap says TIMESTAMP_MS: plain TIMESTAMP writes micros.
      created_at: "INT64/TIMESTAMP_MILLIS",
      updated_at: "INT64/TIMESTAMP_MICROS",
      // UUID predates nothing in converted_type, so it is only visible as a logical type.
      uid: "FIXED_LEN_BYTE_ARRAY",
      payload: "BYTE_ARRAY/JSON",
      'odd"name': "BYTE_ARRAY/UTF8",
    });

    const logical = Object.fromEntries(rows.map((r) => [r.name, r.logical_type]));
    expect(logical["uid"]).toBe("UUIDType()");
    expect(logical["amount"]).toBe("DecimalType(scale=2, precision=18)");
    expect(logical["wide"]).toBe("DecimalType(scale=4, precision=38)");
    expect(logical["payload"]).toBe("JsonType()");
    // isAdjustedToUTC is the difference a consumer will feel: created_at is a wall clock
    // with no zone, updated_at is an instant. Pinned so a DuckDB upgrade cannot swap them.
    expect(logical["created_at"]).toContain("isAdjustedToUTC=0");
    expect(logical["created_at"]).toContain("MILLIS=MilliSeconds()");
    expect(logical["updated_at"]).toContain("isAdjustedToUTC=1");
    expect(logical["updated_at"]).toContain("MICROS=MicroSeconds()");
  });

  it("compresses the pages with snappy", async () => {
    const { client } = fakeClient(FULL_ROW, 1);
    const out = outputPath();
    await writeRelationToFile(client, "demonstration", SCHEMA, out);

    const query = await reader();
    expect(await query(`SELECT DISTINCT compression FROM parquet_metadata('${out}')`)).toEqual([
      { compression: "SNAPPY" },
    ]);
  });

  it("reads a field larger than DuckDB's default line limit", async () => {
    // The default max_line_size is 2 MB. A free-text column past that would fail the export
    // outright rather than one row, so the ceiling is raised deliberately.
    const schema: RelationSchema = {
      columns: [{ name: "description", duckdbType: "VARCHAR" }],
    };
    const { client } = fakeClient(`"${"x".repeat(3 * 1024 * 1024)}"\n`, 1);
    const out = outputPath();
    expect(await writeRelationToFile(client, "demonstration", schema, out)).toBe(1);

    const query = await reader();
    expect(await query(`SELECT length(description) AS n FROM read_parquet('${out}')`)).toEqual([
      { n: 3_145_728n },
    ]);
  });

  it("round trips values without going through a JavaScript number or date", async () => {
    const { client } = fakeClient(FULL_ROW, 1);
    const out = outputPath();
    expect(await writeRelationToFile(client, "demonstration", SCHEMA, out)).toBe(1);

    const query = await reader();
    // Decimals and bigints are compared as text. getRowObjectsJS turns DECIMAL(38,4)
    // into a lossy double, so a JS comparison would pass on a corrupt file.
    const [row] = await query(
      `SELECT id::VARCHAR AS id, small::VARCHAR AS small, count::VARCHAR AS count,
              flag, amount::VARCHAR AS amount, wide::VARCHAR AS wide,
              rate::VARCHAR AS rate, ratio::VARCHAR AS ratio,
              effective_date::VARCHAR AS effective_date,
              created_at::VARCHAR AS created_at,
              (updated_at AT TIME ZONE 'UTC')::VARCHAR AS updated_at,
              uid::VARCHAR AS uid, payload::VARCHAR AS payload, "odd""name" AS odd
       FROM read_parquet('${out}')`
    );

    expect(row).toEqual({
      id: "9007199254740993",
      small: "-32768",
      count: "42",
      flag: true,
      amount: "-0.05",
      wide: "-1234567890123456789012345678901234.5678",
      rate: "0.5",
      ratio: "0.1",
      effective_date: "1969-07-20",
      created_at: "2026-08-31 07:00:00.123",
      updated_at: "2026-08-31 07:00:00",
      uid: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      payload: '{"a":1}',
      odd: 'has a " in it',
    });
  });

  it("keeps an empty string distinct from a null", async () => {
    // The one setting this whole path turns on. Postgres writes "" for an empty string and
    // nothing at all for a NULL, and DuckDB's default reads both as NULL, which silently
    // merges them. This is the same defect a pandas based reader has.
    const schema: RelationSchema = {
      columns: [
        { name: "empty", duckdbType: "VARCHAR" },
        { name: "missing", duckdbType: "VARCHAR" },
      ],
    };
    const { client } = fakeClient('"",\n', 1);
    const out = outputPath();
    await writeRelationToFile(client, "state", schema, out);

    const query = await reader();
    expect(await query(`SELECT * FROM read_parquet('${out}')`)).toEqual([
      { empty: "", missing: null },
    ]);
  });

  it("preserves a comma, a quote and a newline inside a field", async () => {
    const schema: RelationSchema = {
      columns: [
        { name: "commas", duckdbType: "VARCHAR" },
        { name: "quotes", duckdbType: "VARCHAR" },
        { name: "lines", duckdbType: "VARCHAR" },
      ],
    };
    const { client } = fakeClient('"a,b","say ""hi""","one\ntwo"\n', 1);
    const out = outputPath();
    expect(await writeRelationToFile(client, "state", schema, out)).toBe(1);

    const query = await reader();
    expect(await query(`SELECT * FROM read_parquet('${out}')`)).toEqual([
      { commas: "a,b", quotes: 'say "hi"', lines: "one\ntwo" },
    ]);
  });

  it("keeps a fully null row null in every column", async () => {
    const { client } = fakeClient(NULL_ROW, 1);
    const out = outputPath();
    expect(await writeRelationToFile(client, "demonstration", SCHEMA, out)).toBe(1);

    const query = await reader();
    const [row] = await query(`SELECT * FROM read_parquet('${out}')`);
    expect(Object.keys(row)).toHaveLength(SCHEMA.columns.length);
    expect(Object.values(row).every((v) => v === null)).toBe(true);
  });

  it("writes an empty but readable file when the relation has no rows", async () => {
    // Postgres sends zero bytes, and DuckDB's dialect sniffer fails outright on an empty
    // file. This passes only because the read declares auto_detect = false.
    const { client } = fakeClient("", 0);
    const out = outputPath();
    expect(await writeRelationToFile(client, "demonstration", SCHEMA, out)).toBe(0);

    const query = await reader();
    expect(await query(`SELECT count(*) AS n FROM read_parquet('${out}')`)).toEqual([{ n: 0n }]);
    // The schema still has to be there, or a consumer union would fail on this partition.
    const columns = await query(
      `SELECT name FROM parquet_schema('${out}') WHERE num_children IS NULL`
    );
    expect(columns.map((c) => c.name)).toEqual(SCHEMA.columns.map((c) => c.name));
  });

  it("writes every row of a large relation", async () => {
    const rows = Array.from({ length: 1200 }, (_, i) => NULL_ROW.replace(/^/, String(i))).join("");
    const { client } = fakeClient(rows, 1200);
    const out = outputPath();
    expect(await writeRelationToFile(client, "demonstration", SCHEMA, out)).toBe(1200);

    const query = await reader();
    expect(
      await query(
        `SELECT count(*) AS n, count(DISTINCT id) AS distinct_ids, max(id)::VARCHAR AS max_id
         FROM read_parquet('${out}')`
      )
    ).toEqual([{ n: 1200n, distinct_ids: 1200n, max_id: "1199" }]);
  }, 30000);

  it("refuses to report success when the file has fewer rows than Postgres sent", async () => {
    // A CSV can parse cleanly and still be short. Comparing what DuckDB wrote against the
    // COPY tag is the only check that catches it.
    const { client } = fakeClient(FULL_ROW, 99);

    await expect(
      writeRelationToFile(client, "demonstration", SCHEMA, outputPath())
    ).rejects.toThrow("Relation demonstration wrote 1 rows but Postgres sent 99.");
  });

  it("removes the staged csv once the parquet exists", async () => {
    const { client } = fakeClient(FULL_ROW, 1);
    await writeRelationToFile(client, "demonstration", SCHEMA, outputPath());

    // Peak /tmp is one csv, not one per relation, and temporary storage is finite.
    expect(existsSync(path.join(workDir, "demonstration.csv"))).toBe(false);
  });

  it("removes the staged csv when the conversion fails", async () => {
    const { client } = fakeClient(FULL_ROW, 99);

    await expect(
      writeRelationToFile(client, "demonstration", SCHEMA, outputPath())
    ).rejects.toThrow();

    expect(existsSync(path.join(workDir, "demonstration.csv"))).toBe(false);
  });

  it("reports the copy failure rather than a cleanup problem", async () => {
    const { client } = fakeClient("", 0, new Error("connection terminated unexpectedly"));

    await expect(
      writeRelationToFile(client, "state", SCHEMA, outputPath())
    ).rejects.toThrow("connection terminated unexpectedly");
  });

  it("warns rather than throwing when the staged csv cannot be removed", async () => {
    // The removal runs in a finally block. Throwing there would replace the row count the
    // caller is waiting on, or the error that aborted the run.
    const { client } = fakeClient(FULL_ROW, 1);
    mocks.rmMock.mockRejectedValueOnce(new Error("EBUSY: resource busy"));

    expect(await writeRelationToFile(client, "demonstration", SCHEMA, outputPath())).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(
      {
        path: path.join(workDir, "demonstration.csv"),
        error: "EBUSY: resource busy",
      },
      "failed to remove staged export file"
    );
  });
});
