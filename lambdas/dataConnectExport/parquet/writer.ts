import type { DuckDBConnection } from "@duckdb/node-api";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { PoolClient } from "pg";
import { to as copyTo } from "pg-copy-streams";

import { dbSchema } from "../database/pool";
import type { RelationSchema } from "../types";
import { csvPath, removeStagedFile } from "../util/staging";
import { copyColumnList, csvColumnSpec, quoteIdentifier, quoteLiteral } from "./typeMap";

/**
 * How DuckDB is told to read what Postgres wrote. Every one of these is load bearing.
 *
 * allow_quoted_nulls = false is the important one. Postgres writes an empty string as "" and a
 * NULL as nothing at all, but DuckDB's default reads a quoted empty field as NULL too, which
 * silently merges the two. This is the same defect a pandas-based reader has.
 *
 * auto_detect = false stops DuckDB sniffing the dialect. Sniffing an empty file fails outright,
 * so without this a relation with no rows aborts the export instead of producing an empty file.
 *
 * max_line_size defaults to 2 MB and a single free-text column can exceed that. The buffer is
 * not preallocated, so raising the ceiling costs nothing until a row needs it.
 */
const CSV_READ_OPTIONS = [
  "header = false",
  "auto_detect = false",
  "delim = ','",
  "quote = '\"'",
  "escape = '\"'",
  "nullstr = ''",
  "allow_quoted_nulls = false",
  "max_line_size = 67108864",
].join(", ");

/**
 * Stage one relation as parquet and return the number of rows written.
 *
 * Postgres streams the rows out with COPY, so the whole relation never exists in the Node
 * heap, and DuckDB converts the text to typed parquet in one statement. The client belongs to
 * the caller's snapshot transaction; taking a connection here would read a different instant.
 */
export async function writeRelationToFile(
  client: PoolClient,
  connection: DuckDBConnection,
  relation: string,
  relationSchema: RelationSchema,
  destinationPath: string
): Promise<number> {
  const csvFile = csvPath(relation);

  try {
    // Column and relation names come from a code constant, never from input, so quoting
    // them is sufficient.
    const copy = client.query(
      copyTo(
        `COPY (SELECT ${copyColumnList(relationSchema)} ` +
          `FROM ${dbSchema}.${quoteIdentifier(relation)}) TO STDOUT WITH (FORMAT csv)`
      )
    );
    await pipeline(copy, createWriteStream(csvFile));

    const result = await connection.run(
      `COPY (SELECT * FROM read_csv(${quoteLiteral(csvFile)}, ` +
        `columns = ${csvColumnSpec(relationSchema)}, ${CSV_READ_OPTIONS})) ` +
        `TO ${quoteLiteral(destinationPath)} (FORMAT parquet, COMPRESSION snappy)`
    );

    // COPY reports what it wrote. Comparing it against the COPY tag Postgres returned is what
    // rules out a CSV that parsed cleanly but lost rows on the way.
    const [{ Count: written }] = (await result.getRowObjectsJS()) as { Count: bigint }[];
    if (BigInt(written) !== BigInt(copy.rowCount)) {
      throw new Error(
        `Relation ${relation} wrote ${written} rows but Postgres sent ${copy.rowCount}.`
      );
    }

    return copy.rowCount;
  } finally {
    await removeStagedFile(csvFile);
  }
}
