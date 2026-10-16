import type { DuckDBConnection } from "@duckdb/node-api";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { PoolClient } from "pg";
import { to as copyTo } from "pg-copy-streams";

import type { ExportViewDefinition } from "../types";
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
  definition: ExportViewDefinition,
  destinationPath: string
): Promise<number> {
  const csvFile = csvPath(relation);

  try {
    // Both SQL and the ordered output projection come only from reviewed code. The ORDER BY sits
    // on the outer SELECT because an ORDER BY inside a subquery is not guaranteed to survive.
    const orderBy = definition.orderBy.length > 0
      ? ` ORDER BY ${definition.orderBy.map(quoteIdentifier).join(", ")}`
      : "";
    const copy = client.query(
      copyTo(
        `COPY (SELECT ${copyColumnList(definition.schema)} ` +
          `FROM (${definition.query}) AS export_view${orderBy}) TO STDOUT WITH (FORMAT csv)`
      )
    );
    await pipeline(copy, createWriteStream(csvFile));

    const result = await connection.run(
      `COPY (SELECT * FROM read_csv(${quoteLiteral(csvFile)}, ` +
        `columns = ${csvColumnSpec(definition.schema)}, ${CSV_READ_OPTIONS})) ` +
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
