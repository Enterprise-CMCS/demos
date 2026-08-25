import { ParquetSchema } from "@dsnp/parquetjs";
import type { FieldDefinition, SchemaDefinition } from "@dsnp/parquetjs";
import type { Pool } from "pg";

import { fetchColumnMetadata } from "../database/queries";
import type { ColumnMeta, RelationSchema } from "../types";

const MILLIS_PER_DAY = 86_400_000;

// Above this, @dsnp/parquetjs backs DECIMAL with BYTE_ARRAY and calls Buffer.from()
// on the value, which expects unscaled two's-complement bytes rather than a string.
// Rejecting is safer than emitting bytes a reader would silently misread.
const MAX_DECIMAL_PRECISION = 18;

type Convert = (value: unknown) => unknown;

interface Mapping {
  field: FieldDefinition;
  convert: Convert;
}

/**
 * pg returns `numeric` as a string. A DECIMAL field of precision <= 18 is an INT64
 * underneath, so the value must be the unscaled integer: "123.45" at scale 2 is 12345n.
 */
export function unscale(text: string, scale: number): bigint {
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = (negative ? text.slice(1) : text).split(".");

  if (fraction.length > scale) {
    throw new Error(`value "${text}" has more decimal places than the declared scale ${scale}`);
  }

  const unscaled = BigInt(`${whole}${fraction.padEnd(scale, "0")}`);
  return negative ? -unscaled : unscaled;
}

/**
 * pg parses a `date` into a JS Date at *local* midnight. The library's DATE codec does
 * `getTime() / 86400000` with no flooring, so a non-UTC local midnight yields a
 * fractional day. Rebuilding the day from the local calendar fields keeps it integral.
 */
export function dateToDays(value: Date): number {
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / MILLIS_PER_DAY;
}

function mapColumn(relation: string, column: ColumnMeta): Mapping {
  const { columnName, dataType, numericPrecision, numericScale } = column;
  const optional = column.isNullable;
  const base = { optional, compression: "SNAPPY" } as const;

  switch (dataType) {
    case "boolean":
      return { field: { ...base, type: "BOOLEAN" }, convert: (v) => Boolean(v) };

    case "smallint":
    case "integer":
      return { field: { ...base, type: "INT32" }, convert: (v) => v as number };

    case "bigint":
      // pg returns int8 as a string to avoid precision loss; INT64 accepts BigInt.
      return { field: { ...base, type: "INT64" }, convert: (v) => BigInt(v as string) };

    case "numeric": {
      if (numericPrecision === null || numericScale === null) {
        throw new Error(
          `${relation}.${columnName}: unconstrained numeric has no precision or scale, ` +
            `so a parquet DECIMAL cannot be declared. Constrain the column or drop it ` +
            `from the allowlist.`
        );
      }
      if (numericPrecision > MAX_DECIMAL_PRECISION) {
        throw new Error(
          `${relation}.${columnName}: numeric precision ${numericPrecision} exceeds ` +
            `${MAX_DECIMAL_PRECISION}, which @dsnp/parquetjs encodes as raw BYTE_ARRAY.`
        );
      }
      return {
        field: { ...base, type: "DECIMAL", precision: numericPrecision, scale: numericScale },
        convert: (v) => unscale(String(v), numericScale),
      };
    }

    case "real":
      return { field: { ...base, type: "FLOAT" }, convert: (v) => v as number };

    case "double precision":
      return { field: { ...base, type: "DOUBLE" }, convert: (v) => v as number };

    case "date":
      return { field: { ...base, type: "DATE" }, convert: (v) => dateToDays(v as Date) };

    case "timestamp without time zone":
    case "timestamp with time zone":
      // Passed as a Date on purpose: the codec calls getTime() directly, skipping the
      // library's non-negative bounds check that a plain number would hit.
      return { field: { ...base, type: "TIMESTAMP_MILLIS" }, convert: (v) => v as Date };

    case "uuid":
    case "text":
    case "character varying":
    case "character":
      return { field: { ...base, type: "UTF8" }, convert: (v) => String(v) };

    case "json":
    case "jsonb":
      // node-postgres already parsed these into objects.
      return { field: { ...base, type: "UTF8" }, convert: (v) => JSON.stringify(v) };

    default:
      throw new Error(
        `${relation}.${columnName}: no parquet mapping for data_type "${dataType}". ` +
          `Add one to mapColumn rather than letting the column export as a string.`
      );
  }
}

const converters = new WeakMap<ColumnMeta[], Map<string, Convert>>();

export async function buildParquetSchema(
  pool: Pool,
  relation: string,
  columns: readonly string[]
): Promise<RelationSchema> {
  const metadata = await fetchColumnMetadata(pool, relation, columns);

  if (metadata.length !== columns.length) {
    const found = new Set(metadata.map((c) => c.columnName));
    const missing = columns.filter((c) => !found.has(c));
    throw new Error(
      `${relation}: allowlist names ${columns.length} columns but ${metadata.length} exist. ` +
        `Missing: ${missing.join(", ")}`
    );
  }

  const definition: SchemaDefinition = {};
  const rowConverters = new Map<string, Convert>();

  for (const column of metadata) {
    const { field, convert } = mapColumn(relation, column);
    definition[column.columnName] = field;
    rowConverters.set(column.columnName, convert);
  }

  converters.set(metadata, rowConverters);
  return { parquetSchema: new ParquetSchema(definition), columns: metadata };
}

export function toParquetRow(
  row: Record<string, unknown>,
  columns: ColumnMeta[]
): Record<string, unknown> {
  const rowConverters = converters.get(columns);
  if (!rowConverters) {
    throw new Error("toParquetRow received columns that did not come from buildParquetSchema");
  }

  const out: Record<string, unknown> = {};

  for (const column of columns) {
    const value = row[column.columnName];

    if (value === null || value === undefined) {
      if (!column.isNullable) {
        throw new Error(`${column.columnName} is NOT NULL in Postgres but arrived null`);
      }
      // Left absent on purpose. shredRecord treats a missing or null key on an
      // optional field as a real null, so this is what preserves nulls.
      continue;
    }

    out[column.columnName] = rowConverters.get(column.columnName)!(value);
  }

  return out;
}
