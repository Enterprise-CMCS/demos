import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ColumnMeta, RelationSchema } from "../types";
import {
  buildRelationSchema,
  castingSelect,
  quoteIdentifier,
  stagingTableDdl,
  textProjection,
} from "./typeMap";

const mocks = vi.hoisted(() => ({ fetchColumnMetadataMock: vi.fn() }));

// queries.ts reaches pool.ts, which builds a SecretsManagerClient at module scope.
vi.mock("../database/queries", () => ({ fetchColumnMetadata: mocks.fetchColumnMetadataMock }));

const pool = {} as never;

function meta(overrides: Partial<ColumnMeta> & Pick<ColumnMeta, "dataType">): ColumnMeta {
  return {
    columnName: "c",
    isNullable: true,
    numericPrecision: null,
    numericScale: null,
    ...overrides,
  };
}

// duckdbTypeFor is private, so it is exercised through buildRelationSchema.
async function duckdbTypeOf(column: ColumnMeta): Promise<string> {
  mocks.fetchColumnMetadataMock.mockResolvedValue([column]);
  const schema = await buildRelationSchema(pool, "demonstration", [column.columnName]);
  return schema.columns[0].duckdbType;
}

describe("the postgres to duckdb type map", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The table in section 6 of the reference doc, asserted rather than described.
  it.each([
    ["boolean", "BOOLEAN"],
    ["smallint", "SMALLINT"],
    ["integer", "INTEGER"],
    ["bigint", "BIGINT"],
    ["real", "FLOAT"],
    ["double precision", "DOUBLE"],
    ["date", "DATE"],
    ["timestamp without time zone", "TIMESTAMP_MS"],
    ["timestamp with time zone", "TIMESTAMPTZ"],
    ["uuid", "UUID"],
    ["json", "JSON"],
    ["jsonb", "JSON"],
  ])("maps %s to %s", async (dataType, expected) => {
    expect(await duckdbTypeOf(meta({ dataType }))).toBe(expected);
  });

  it.each(["character varying", "text", "ARRAY", "interval", "bytea", "inet"])(
    "falls back to VARCHAR for %s",
    async (dataType) => {
      expect(await duckdbTypeOf(meta({ dataType }))).toBe("VARCHAR");
    }
  );

  it("chooses TIMESTAMP_MS over TIMESTAMP, which is the whole reason this branch exists", async () => {
    // Plain TIMESTAMP would write TIMESTAMP_MICROS. writer.test.ts asserts the encoding
    // that follows from this choice; this asserts the choice itself.
    expect(await duckdbTypeOf(meta({ dataType: "timestamp without time zone" }))).toBe(
      "TIMESTAMP_MS"
    );
  });
});

describe("numeric, the only type with a decision in it", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carries precision and scale through to DECIMAL", async () => {
    expect(
      await duckdbTypeOf(meta({ dataType: "numeric", numericPrecision: 18, numericScale: 2 }))
    ).toBe("DECIMAL(18,2)");
  });

  it("treats a null scale as zero rather than emitting DECIMAL(18,null)", async () => {
    expect(
      await duckdbTypeOf(meta({ dataType: "numeric", numericPrecision: 18, numericScale: null }))
    ).toBe("DECIMAL(18,0)");
  });

  it("accepts the maximum precision DuckDB supports", async () => {
    expect(
      await duckdbTypeOf(meta({ dataType: "numeric", numericPrecision: 38, numericScale: 4 }))
    ).toBe("DECIMAL(38,4)");
  });

  it("falls back to VARCHAR for an unconstrained numeric", async () => {
    // Lossless, and consistent with reading every column as ::text. DOUBLE would round the
    // digits Postgres produced, and the damage would surface in the consumer's arithmetic
    // rather than here, which is the worst place to find it.
    expect(await duckdbTypeOf(meta({ dataType: "numeric", numericPrecision: null }))).toBe(
      "VARCHAR"
    );
  });

  it("refuses a precision above 38 instead of silently truncating", async () => {
    // No allowlisted column is numeric today, so this path is only ever reached by a
    // future column, and it has to fail loudly when it is.
    mocks.fetchColumnMetadataMock.mockResolvedValue([
      meta({ columnName: "huge_amount", dataType: "numeric", numericPrecision: 39, numericScale: 2 }),
    ]);

    await expect(buildRelationSchema(pool, "demonstration", ["huge_amount"])).rejects.toThrow(
      "Column huge_amount has numeric precision 39, above DuckDB's DECIMAL maximum of 38."
    );
  });
});

describe("buildRelationSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks for the allowlisted columns of the requested relation", async () => {
    mocks.fetchColumnMetadataMock.mockResolvedValue([meta({ columnName: "id", dataType: "uuid" })]);
    await buildRelationSchema(pool, "state", ["id"]);
    expect(mocks.fetchColumnMetadataMock).toHaveBeenCalledWith(pool, "state", ["id"]);
  });

  it("names the columns it could not find, so a rename is diagnosable from the log", async () => {
    mocks.fetchColumnMetadataMock.mockResolvedValue([meta({ columnName: "id", dataType: "uuid" })]);

    await expect(
      buildRelationSchema(pool, "demonstration", ["id", "renamed_away", "also_gone"])
    ).rejects.toThrow(
      "Relation demonstration is missing allowlisted columns: renamed_away, also_gone"
    );
  });

  it("throws rather than exporting a narrower file than the allowlist promises", async () => {
    mocks.fetchColumnMetadataMock.mockResolvedValue([]);
    await expect(buildRelationSchema(pool, "state", ["id"])).rejects.toThrow(
      "missing allowlisted columns: id"
    );
  });

  it("orders columns by the metadata, not by the allowlist", async () => {
    // fetchColumnMetadata orders by ordinal_position, and this function preserves that.
    // Parquet column order therefore follows the table, not the constant.
    mocks.fetchColumnMetadataMock.mockResolvedValue([
      meta({ columnName: "id", dataType: "uuid" }),
      meta({ columnName: "name", dataType: "text" }),
    ]);

    const schema = await buildRelationSchema(pool, "state", ["name", "id"]);
    expect(schema.columns.map((c) => c.name)).toEqual(["id", "name"]);
  });
});

describe("identifier quoting", () => {
  it("wraps a plain identifier", () => {
    expect(quoteIdentifier("created_at")).toBe('"created_at"');
  });

  it("doubles an embedded quote", () => {
    expect(quoteIdentifier('odd"name')).toBe('"odd""name"');
  });

  it("doubles every quote, not just the first", () => {
    expect(quoteIdentifier('a"b"c')).toBe('"a""b""c"');
  });

  it("survives an identifier that is only quotes", () => {
    expect(quoteIdentifier('""')).toBe('""""""');
  });
});

describe("the three SQL fragment builders", () => {
  const schema: RelationSchema = {
    columns: [
      { name: "id", duckdbType: "BIGINT" },
      { name: 'odd"name', duckdbType: "DECIMAL(18,2)" },
    ],
  };

  it("declares every staging column as VARCHAR", () => {
    // Staging is all text so that DuckDB, not JavaScript, performs every conversion.
    expect(stagingTableDdl(schema)).toBe(
      'CREATE TABLE staging ("id" VARCHAR, "odd""name" VARCHAR)'
    );
  });

  it("casts each staging column to its target type and keeps the name", () => {
    expect(castingSelect(schema)).toBe(
      'CAST("id" AS BIGINT) AS "id", CAST("odd""name" AS DECIMAL(18,2)) AS "odd""name"'
    );
  });

  it("projects each postgres column as text under its own name", () => {
    // The alias is what guarantees the JS property name matches the column name,
    // whatever Postgres decides to label a cast expression.
    expect(textProjection(schema)).toBe(
      '"id"::text AS "id", "odd""name"::text AS "odd""name"'
    );
  });

  it("emits no separator for a single column", () => {
    const single: RelationSchema = { columns: [{ name: "id", duckdbType: "BIGINT" }] };
    expect(stagingTableDdl(single)).toBe('CREATE TABLE staging ("id" VARCHAR)');
    expect(castingSelect(single)).toBe('CAST("id" AS BIGINT) AS "id"');
    expect(textProjection(single)).toBe('"id"::text AS "id"');
  });
});
