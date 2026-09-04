import type { Pool } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchColumnMetadata } from "./queries";

// pool.ts builds a SecretsManagerClient at module scope. Only the schema name is needed.
vi.mock("./pool", () => ({ dbSchema: "demos_app" }));

const queryMock = vi.fn();
const pool = { query: queryMock } as unknown as Pool;

const row = (overrides: Record<string, unknown> = {}) => ({
  column_name: "id",
  data_type: "uuid",
  is_nullable: "NO",
  numeric_precision: null,
  numeric_scale: null,
  ...overrides,
});

describe("fetchColumnMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryMock.mockResolvedValue({ rows: [] });
  });

  it("reads from information_schema in one round trip, not one per column", async () => {
    await fetchColumnMetadata(pool, "demonstration", ["id", "name", "created_at"]);
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("binds the schema, the relation and the column list as parameters", async () => {
    await fetchColumnMetadata(pool, "demonstration", ["id", "name"]);
    const [, params] = queryMock.mock.calls[0];
    expect(params).toEqual(["demos_app", "demonstration", ["id", "name"]]);
  });

  it("scopes the lookup to demos_app rather than trusting search_path", async () => {
    await fetchColumnMetadata(pool, "state", ["id"]);
    expect(queryMock.mock.calls[0][1][0]).toBe("demos_app");
  });

  it("interpolates nothing, so the relation name cannot reach the SQL text", async () => {
    await fetchColumnMetadata(pool, "demonstration", ["id"]);
    const [sql] = queryMock.mock.calls[0];
    expect(sql).not.toContain("demonstration");
    expect(sql).not.toContain("demos_app");
  });

  it("casts every placeholder, including the array, which = ANY needs", async () => {
    await fetchColumnMetadata(pool, "state", ["id"]);
    const [sql] = queryMock.mock.calls[0];
    expect(sql).toContain("$1::TEXT");
    expect(sql).toContain("$2::TEXT");
    expect(sql).toContain("$3::TEXT[]");
  });

  it("orders by ordinal_position, which is what fixes parquet column order", async () => {
    await fetchColumnMetadata(pool, "state", ["id"]);
    expect(queryMock.mock.calls[0][0]).toContain("ordinal_position");
  });

  it("hands pg a copy of the column list rather than the caller's array", async () => {
    // EXPORT_DATASETS entries are readonly const tuples. Passing one straight through
    // would let a driver-side mutation reach the egress boundary constant.
    const columns = ["id", "name"] as const;
    await fetchColumnMetadata(pool, "demonstration", columns);
    expect(queryMock.mock.calls[0][1][2]).not.toBe(columns);
    expect(queryMock.mock.calls[0][1][2]).toEqual(["id", "name"]);
  });

  it("maps snake_case columns onto the ColumnMeta shape", async () => {
    queryMock.mockResolvedValue({
      rows: [
        row({
          column_name: "amount",
          data_type: "numeric",
          is_nullable: "YES",
          numeric_precision: 18,
          numeric_scale: 2,
        }),
      ],
    });

    expect(await fetchColumnMetadata(pool, "demonstration", ["amount"])).toEqual([
      {
        columnName: "amount",
        dataType: "numeric",
        isNullable: true,
        numericPrecision: 18,
        numericScale: 2,
      },
    ]);
  });

  it("turns is_nullable into a boolean, treating only YES as nullable", async () => {
    queryMock.mockResolvedValue({
      rows: [row({ column_name: "a", is_nullable: "YES" }), row({ column_name: "b", is_nullable: "NO" })],
    });

    const result = await fetchColumnMetadata(pool, "demonstration", ["a", "b"]);
    expect(result.map((c) => c.isNullable)).toEqual([true, false]);
  });

  it("keeps null precision and scale as null for a non-numeric column", async () => {
    queryMock.mockResolvedValue({ rows: [row({ data_type: "text" })] });
    const [column] = await fetchColumnMetadata(pool, "demonstration", ["id"]);
    expect(column.numericPrecision).toBeNull();
    expect(column.numericScale).toBeNull();
  });

  it("preserves the order the query returned", async () => {
    queryMock.mockResolvedValue({
      rows: [row({ column_name: "id" }), row({ column_name: "name" }), row({ column_name: "region" })],
    });

    const result = await fetchColumnMetadata(pool, "state", ["region", "id", "name"]);
    expect(result.map((c) => c.columnName)).toEqual(["id", "name", "region"]);
  });

  it("returns an empty array for an unknown relation instead of throwing", async () => {
    // buildRelationSchema is what turns this into an error, with a message naming the
    // missing columns. This function stays a plain read.
    queryMock.mockResolvedValue({ rows: [] });
    await expect(fetchColumnMetadata(pool, "no_such_table", ["id"])).resolves.toEqual([]);
  });

  it("lets a driver error propagate", async () => {
    queryMock.mockRejectedValue(new Error("permission denied for schema demos_app"));
    await expect(fetchColumnMetadata(pool, "demonstration", ["id"])).rejects.toThrow(
      "permission denied for schema demos_app"
    );
  });
});
