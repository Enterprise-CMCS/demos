import { DuckDBInstance } from "@duckdb/node-api";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Pool } from "pg";
import { afterAll, describe, expect, it, vi } from "vitest";

import type { RelationSchema } from "../types";
import { writeRelationToFile } from "./writer";

// Importing writer pulls in database/pool, which builds a SecretsManagerClient at module
// scope. Only the schema name is needed here.
vi.mock("../database/pool", () => ({ dbSchema: "demos_app" }));

type TextRow = Record<string, string | null>;

// Written to a subdirectory rather than os.tmpdir() itself, so cleanupTmp's *.parquet
// sweep cannot reach these files while a test is using them.
const workDir = mkdtempSync(path.join(os.tmpdir(), "writer-test-"));
let fileCounter = 0;

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function outputPath(): string {
  fileCounter += 1;
  return path.join(workDir, `relation-${fileCounter}.parquet`);
}

// Every duckdbType that typeMap can produce, so the encoding assertions cover the whole map.
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

// Text exactly as Postgres renders it under DateStyle=ISO,MDY and TimeZone=UTC.
const FULL_ROW: TextRow = {
  id: "9007199254740993",
  small: "-32768",
  count: "42",
  flag: "true",
  amount: "-0.05",
  wide: "-1234567890123456789012345678901234.5678",
  rate: "0.5",
  ratio: "0.1",
  effective_date: "1969-07-20",
  created_at: "2026-08-31 07:00:00.123",
  updated_at: "2026-08-31 07:00:00+00",
  uid: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  payload: '{"a":1}',
  'odd"name': 'has a " in it',
};

const NULL_ROW: TextRow = Object.fromEntries(SCHEMA.columns.map((c) => [c.name, null]));

type PoolHarness = {
  pool: Pool;
  state: { sql: string; reads: number[]; closes: number; releases: number };
};

function fakePool(rows: TextRow[], onRead?: () => void): PoolHarness {
  const state = { sql: "", reads: [] as number[], closes: 0, releases: 0 };
  const remaining = [...rows];

  const client = {
    // pg returns the Submittable it was handed. The real Cursor is still constructed by
    // writer.ts, so its generated SQL can be read off the argument.
    query: (cursor: { text: string }) => {
      state.sql = cursor.text;
      return {
        read: async (batchSize: number) => {
          state.reads.push(batchSize);
          onRead?.();
          return remaining.splice(0, batchSize);
        },
        close: async () => {
          state.closes += 1;
        },
      };
    },
    release: () => {
      state.releases += 1;
    },
  };

  return { pool: { connect: async () => client } as unknown as Pool, state };
}

async function reader() {
  const connection = await (await DuckDBInstance.create(":memory:")).connect();
  return async (sql: string) =>
    (await (await connection.run(sql)).getRowObjectsJS()) as Record<string, unknown>[];
}

describe("writeRelationToFile", () => {
  it("projects every column as text from the schema-qualified relation", async () => {
    const { pool, state } = fakePool([]);
    await writeRelationToFile(pool, "demonstration", SCHEMA, outputPath());

    expect(state.sql).toContain('FROM demos_app."demonstration"');
    expect(state.sql).toContain('"id"::text AS "id"');
    // An embedded quote has to survive into both sides of the projection.
    expect(state.sql).toContain('"odd""name"::text AS "odd""name"');
    for (const column of SCHEMA.columns) {
      expect(state.sql).toContain(`::text AS "${column.name.replace(/"/g, '""')}"`);
    }
  });

  it("writes the parquet encodings the DataConnect dashboard contract depends on", async () => {
    const { pool } = fakePool([FULL_ROW]);
    const out = outputPath();
    await writeRelationToFile(pool, "demonstration", SCHEMA, out);

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

  it("round trips values without going through a JavaScript number or date", async () => {
    const { pool } = fakePool([FULL_ROW]);
    const out = outputPath();
    expect(await writeRelationToFile(pool, "demonstration", SCHEMA, out)).toBe(1);

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

  it("keeps a fully null row null in every column", async () => {
    const { pool } = fakePool([NULL_ROW]);
    const out = outputPath();
    expect(await writeRelationToFile(pool, "demonstration", SCHEMA, out)).toBe(1);

    const query = await reader();
    const [row] = await query(`SELECT * FROM read_parquet('${out}')`);
    expect(Object.keys(row)).toHaveLength(SCHEMA.columns.length);
    expect(Object.values(row).every((v) => v === null)).toBe(true);
  });

  it("writes an empty but readable file when the relation has no rows", async () => {
    const { pool, state } = fakePool([]);
    const out = outputPath();
    expect(await writeRelationToFile(pool, "demonstration", SCHEMA, out)).toBe(0);

    const query = await reader();
    expect(await query(`SELECT count(*) AS n FROM read_parquet('${out}')`)).toEqual([{ n: 0n }]);
    // The schema still has to be there, or a consumer union would fail on this partition.
    const columns = await query(
      `SELECT name FROM parquet_schema('${out}') WHERE num_children IS NULL`
    );
    expect(columns.map((c) => c.name)).toEqual(SCHEMA.columns.map((c) => c.name));
    expect(state.reads).toEqual([500]);
  });

  it("reads in batches and writes every row across them", async () => {
    const rows = Array.from({ length: 1200 }, (_, i) => ({ ...NULL_ROW, id: String(i) }));
    const { pool, state } = fakePool(rows);
    const out = outputPath();
    expect(await writeRelationToFile(pool, "demonstration", SCHEMA, out)).toBe(1200);

    // 500, 500, 200, then the empty read that ends the loop.
    expect(state.reads).toEqual([500, 500, 500, 500]);

    const query = await reader();
    expect(
      await query(
        `SELECT count(*) AS n, count(DISTINCT id) AS distinct_ids, max(id)::VARCHAR AS max_id
         FROM read_parquet('${out}')`
      )
    ).toEqual([{ n: 1200n, distinct_ids: 1200n, max_id: "1199" }]);
  }, 30000);

  it("closes the cursor and releases the client when the read fails", async () => {
    const { pool, state } = fakePool([FULL_ROW], () => {
      throw new Error("connection terminated unexpectedly");
    });

    await expect(
      writeRelationToFile(pool, "demonstration", SCHEMA, outputPath())
    ).rejects.toThrow("connection terminated unexpectedly");

    expect(state.closes).toBe(1);
    expect(state.releases).toBe(1);
  });

  it("closes the cursor and releases the client on success", async () => {
    const { pool, state } = fakePool([FULL_ROW]);
    await writeRelationToFile(pool, "demonstration", SCHEMA, outputPath());

    expect(state.closes).toBe(1);
    expect(state.releases).toBe(1);
  });
});
