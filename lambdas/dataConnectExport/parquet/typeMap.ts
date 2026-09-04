import type { Pool } from "pg";

import { fetchColumnMetadata } from "../database/queries";
import type { ColumnMeta, RelationColumn, RelationSchema } from "../types";

// DuckDB's DECIMAL maximum. Beyond this there is no lossless representation.
const MAX_DECIMAL_PRECISION = 38;

function duckdbTypeFor(column: ColumnMeta): string {
  switch (column.dataType) {
    case "boolean":
      return "BOOLEAN";
    case "smallint":
      return "SMALLINT";
    case "integer":
      return "INTEGER";
    case "bigint":
      return "BIGINT";
    case "real":
      return "FLOAT";
    case "double precision":
      return "DOUBLE";
    case "numeric": {
      // An unconstrained numeric reports no precision, so there is no DECIMAL to cast to.
      // VARCHAR keeps the digits Postgres produced. DOUBLE would round them: it holds about
      // 17 significant digits, and differences stop landing on zero, so the cost is borne by
      // whatever tool reads the file and reconciles a total, not here.
      if (column.numericPrecision === null) return "VARCHAR";
      if (column.numericPrecision > MAX_DECIMAL_PRECISION) {
        throw new Error(
          `Column ${column.columnName} has numeric precision ${column.numericPrecision}, ` +
            `above DuckDB's DECIMAL maximum of ${MAX_DECIMAL_PRECISION}.`
        );
      }
      return `DECIMAL(${column.numericPrecision},${column.numericScale ?? 0})`;
    }
    case "date":
      return "DATE";
    // TIMESTAMP_MS rather than TIMESTAMP: the plain type writes TIMESTAMP_MICROS.
    case "timestamp without time zone":
      return "TIMESTAMP_MS";
    case "timestamp with time zone":
      return "TIMESTAMPTZ";
    case "uuid":
      return "UUID";
    case "json":
    case "jsonb":
      return "JSON";
    default:
      return "VARCHAR";
  }
}

export function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

export async function buildRelationSchema(
  pool: Pool,
  relation: string,
  columns: readonly string[]
): Promise<RelationSchema> {
  const metadata = await fetchColumnMetadata(pool, relation, columns);

  if (metadata.length !== columns.length) {
    const found = new Set(metadata.map((m) => m.columnName));
    const missing = columns.filter((c) => !found.has(c));
    throw new Error(`Relation ${relation} is missing allowlisted columns: ${missing.join(", ")}`);
  }

  const relationColumns: RelationColumn[] = metadata.map((m) => ({
    name: m.columnName,
    duckdbType: duckdbTypeFor(m),
  }));

  return { columns: relationColumns };
}

// Every staging column is VARCHAR. Postgres hands us text, DuckDB does every conversion,
// and no JavaScript ever touches a date or a decimal.
export function stagingTableDdl(schema: RelationSchema): string {
  const columns = schema.columns.map((c) => `${quoteIdentifier(c.name)} VARCHAR`).join(", ");
  return `CREATE TABLE staging (${columns})`;
}

export function castingSelect(schema: RelationSchema): string {
  return schema.columns
    .map((c) => `CAST(${quoteIdentifier(c.name)} AS ${c.duckdbType}) AS ${quoteIdentifier(c.name)}`)
    .join(", ");
}

// The alias is not redundant. It guarantees the JS property name matches the column name
// regardless of how Postgres chooses to label a cast expression.
export function textProjection(schema: RelationSchema): string {
  return schema.columns
    .map((c) => `${quoteIdentifier(c.name)}::text AS ${quoteIdentifier(c.name)}`)
    .join(", ");
}
