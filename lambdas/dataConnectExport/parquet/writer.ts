import { DuckDBInstance } from "@duckdb/node-api";
import type { Pool } from "pg";
import Cursor from "pg-cursor";

import { dbSchema } from "../database/pool";
import type { RelationSchema } from "../types";
import { castingSelect, quoteIdentifier, stagingTableDdl, textProjection } from "./typeMap";

const BATCH_SIZE = 500;

// Every column is projected with ::text, so a row is strings and nulls and nothing else.
type TextRow = Record<string, string | null>;

export async function writeRelationToFile(
  pool: Pool,
  relation: string,
  relationSchema: RelationSchema,
  destinationPath: string
): Promise<number> {
  const client = await pool.connect();
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  let rowCount = 0;

  try {
    await connection.run(stagingTableDdl(relationSchema));
    const appender = await connection.createAppender("staging");

    // Column and relation names come from a code constant, never from input, so quoting
    // them is sufficient. ::text makes Postgres do the formatting for every type.
    const cursor = client.query(
      new Cursor<TextRow>(
        `SELECT ${textProjection(relationSchema)} FROM ${dbSchema}.${quoteIdentifier(relation)};`
      )
    );

    try {
      for (;;) {
        const rows = await cursor.read(BATCH_SIZE);
        if (rows.length === 0) break;

        for (const row of rows) {
          for (const column of relationSchema.columns) {
            const value = row[column.name];
            if (value === null || value === undefined) {
              appender.appendNull();
            } else {
              appender.appendVarchar(value);
            }
          }
          appender.endRow();
        }
        appender.flushSync();
        rowCount += rows.length;
      }
    } finally {
      await cursor.close();
    }

    appender.closeSync();

    await connection.run(
      `COPY (SELECT ${castingSelect(relationSchema)} FROM staging) ` +
        `TO '${destinationPath}' (FORMAT parquet, COMPRESSION snappy)`
    );
  } finally {
    client.release();
  }

  return rowCount;
}
