import type { Pool, PoolClient } from "pg";

import { dbSchema } from "./pool";
import { log } from "../log";
import { quoteIdentifier } from "../parquet/typeMap";

/**
 * Run an export against one repeatable-read snapshot.
 *
 * Reading relations on separate pooled connections can observe different database states.
 * This transaction keeps every exported relation consistent.
 *
 * Lock all relations before reading so a schema migration blocks before the snapshot is in
 * use. ACCESS SHARE permits ordinary writes, and PostgreSQL holds it until the transaction ends.
 */
export async function withSnapshot(
  pool: Pool,
  relations: readonly string[],
  fn: (client: PoolClient) => Promise<void>
): Promise<Date> {
  if (relations.length === 0) {
    throw new Error("withSnapshot requires at least one relation to lock.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");

    // Quote lock targets exactly as the later reads do.
    const targets = relations
      .map((relation) => `${dbSchema}.${quoteIdentifier(relation)}`)
      .join(", ");
    await client.query(`LOCK TABLE ${targets} IN ACCESS SHARE MODE`);

    // Unlike now(), clock_timestamp() includes time spent waiting for the lock.
    const { rows } = await client.query<{ snapshot_time: Date }>(
      "SELECT clock_timestamp() AS snapshot_time"
    );

    await fn(client);

    await client.query("COMMIT");
    return rows[0].snapshot_time;
  } catch (error) {
    // Keep the original export error if ROLLBACK also fails.
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      log.warn(
        { error: (rollbackError as Error).message },
        "rollback failed after the export aborted"
      );
    }
    throw error;
  } finally {
    client.release();
  }
}
