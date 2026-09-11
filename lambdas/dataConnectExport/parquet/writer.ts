import { DuckDBInstance } from "@duckdb/node-api";
import type { PoolClient } from "pg";
import Cursor from "pg-cursor";

import { dbSchema } from "../database/pool";
import type { RelationSchema } from "../types";
import { castingSelect, quoteIdentifier, stagingTableDdl, textProjection } from "./typeMap";

const BATCH_SIZE = 500;

// Every column is projected with ::text, so a row is strings and nulls and nothing else.
type TextRow = Record<string, string | null>;

// Use the caller's snapshot client so every relation shares one transaction.
export async function writeRelationToFile(
  client: PoolClient,
  relation: string,
  relationSchema: RelationSchema,
  destinationPath: string
): Promise<number> {
  const instance = await DuckDBInstance.create(":memory:");
  const connection = await instance.connect();
  let rowCount = 0;

  await connection.run(stagingTableDdl(relationSchema));
  const appender = await connection.createAppender("staging");

  // Names come from EXPORT_DATASETS; quote them before interpolation.
  // Cast to text in PostgreSQL so JavaScript never parses dates or decimals.
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
    // Release the portal before the transaction moves to the next relation.
    await cursor.close();
  }

  appender.closeSync();

  await connection.run(
    `COPY (SELECT ${castingSelect(relationSchema)} FROM staging) ` +
      `TO '${destinationPath}' (FORMAT parquet, COMPRESSION snappy)`
  );

  return rowCount;
}
