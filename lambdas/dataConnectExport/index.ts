import type { Context, ScheduledEvent } from "aws-lambda";

import { getDbPool } from "./database/pool";
import { withSnapshot } from "./database/snapshot";
import { als, log, reqIdChild, store } from "./log";
import { withDuckDBConnection } from "./parquet/duckdb";
import { writeRelationToFile } from "./parquet/writer";
import { uploadParquet, uploadSuccessMarker } from "./services/s3";
import type { ExportedRelation, ExportViewDefinition } from "./types";
import { partitionKey } from "./util/keys";
import { cleanupTmp, removeStagedFile, stagingPath } from "./util/staging";
import { EXPORT_VIEWS } from "./views";

// Export names are output datasets, never lock targets. Only physical tables are locked.
export const snapshotTables = (views: Record<string, ExportViewDefinition>): string[] =>
  [...new Set(Object.values(views).flatMap((view) => view.baseTables))].sort();

export const handler = async (event: ScheduledEvent, context: Context) =>
  als.run(store, async () => {
    reqIdChild(context.awsRequestId);
    const runDate = new Date();

    try {
      const pool = await getDbPool();
      const exported: ExportedRelation[] = [];

      await withDuckDBConnection(async (connection) => {
        // Upload each relation from the same snapshot before moving to the next one. This
        // bounds local storage to one CSV and one parquet file at a time.
        const snapshotTime = await withSnapshot(
          pool,
          snapshotTables(EXPORT_VIEWS),
          async (client) => {
            for (const [relation, definition] of Object.entries(EXPORT_VIEWS)) {
              const localPath = stagingPath(relation);
              try {
                const rowCount = await writeRelationToFile(
                  client,
                  connection,
                  relation,
                  definition,
                  localPath
                );
                await uploadParquet(localPath, partitionKey(relation, runDate));
                exported.push({ relation, rowCount });
                log.info({ relation, rowCount }, "exported relation to parquet");
              } finally {
                await removeStagedFile(localPath);
              }
            }
          }
        );

        // Written after commit so consumers can tell a complete partition from partial output.
        await uploadSuccessMarker(runDate, exported, snapshotTime);

        log.info({ relations: exported.length, runDate, snapshotTime }, "data export completed.");
      });
    } catch (error) {
      log.error({ error: (error as Error).message }, "data export failed.");
      throw error;
    } finally {
      await cleanupTmp();
    }
  });
