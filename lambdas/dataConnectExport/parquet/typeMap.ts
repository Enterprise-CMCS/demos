import type { RelationSchema } from "../types";

export function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** A DuckDB single-quoted string literal, for the type spec and the file paths. */
export function quoteLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Column list for the server-side COPY.
 *
 * No casts: COPY formats every value with the same type output functions psql uses, so
 * Postgres does the rendering and no JavaScript sees a date or a decimal.
 */
export function copyColumnList(schema: RelationSchema): string {
  return schema.columns.map((c) => quoteIdentifier(c.name)).join(", ");
}

/**
 * The columns argument for DuckDB's read_csv.
 *
 * The CSV carries no header, so a column is identified by position alone. Both this and
 * copyColumnList walk schema.columns in order, which is the only thing keeping the parquet
 * column names attached to the right data.
 */
export function csvColumnSpec(schema: RelationSchema): string {
  const entries = schema.columns.map(
    (c) => `${quoteLiteral(c.name)}: ${quoteLiteral(c.duckdbType)}`
  );
  return `{${entries.join(", ")}}`;
}
