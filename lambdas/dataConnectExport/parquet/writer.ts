import { ParquetSchema, ParquetWriter } from "@dsnp/parquetjs";
import type { Pool } from "pg";
import Cursor from "pg-cursor";

import { dbSchema } from "../database/pool";
import { toParquetRow } from "./typeMap";
import type { ColumnMeta, RelationSchema } from "../types";

const BATCH_SIZE = 500;

export async function writeRelationToFile(
  pool: Pool,
  relation: string,
  columns: readonly string[],
  relationSchema: RelationSchema,
  destinationPath: string
): Promise<number> {
  const client = await pool.connect();
  const writer = await ParquetWriter.openFile(relationSchema.parquetSchema, destinationPath);
  let rowCount = 0;

  try {
    // Column and relation names come from a code constant, never from input,
    // so quoting them here is sufficient; they can never be user-controlled.
    const columnList = columns.map((c) => `"${c}"`).join(", ");
    const cursor = client.query(
      new Cursor(`SELECT ${columnList} FROM ${dbSchema}."${relation}";`)
    );

    for (;;) {
      const rows = await cursor.read(BATCH_SIZE);
      if (rows.length === 0) break;

      for (const row of rows) {
        await writer.appendRow(toParquetRow(row, relationSchema.columns));
      }
      rowCount += rows.length;
    }

    await cursor.close();
  } finally {
    await writer.close();
    client.release();
  }

  return rowCount;
}
