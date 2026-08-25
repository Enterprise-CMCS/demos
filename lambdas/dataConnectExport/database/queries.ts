import type { Pool } from "pg";

import { dbSchema } from "./pool";
import type { ColumnMeta } from "../types";

export async function fetchColumnMetadata(
  pool: Pool,
  relation: string,
  columns: readonly string[]
): Promise<ColumnMeta[]> {
  const result = await pool.query(COLUMN_METADATA_QUERY, [dbSchema, relation, [...columns]]);
  return result.rows.map((r) => ({
    columnName: r.column_name,
    dataType: r.data_type,
    isNullable: r.is_nullable === "YES",
    numericPrecision: r.numeric_precision,
    numericScale: r.numeric_scale,
  }));
}


const COLUMN_METADATA_QUERY = `
  SELECT
      column_name,
      data_type,
      is_nullable,
      numeric_precision,
      numeric_scale
  FROM
      information_schema.columns
  WHERE
      table_schema = $1::TEXT
      AND table_name = $2::TEXT
      AND column_name = ANY($3::TEXT[])
  ORDER BY
      ordinal_position;
`;
