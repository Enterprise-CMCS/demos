import type { Context, ScheduledEvent } from "aws-lambda";

import { EXPORT_DATASETS } from "./allowlist";
import { getDbPool } from "./database/pool";
import { als, log, reqIdChild, store } from "./log";
import { buildRelationSchema } from "./parquet/typeMap";
import { writeRelationToFile } from "./parquet/writer";
import { uploadParquet, uploadSuccessMarker } from "./services/s3";
import type { WrittenFile } from "./types";
import { partitionKey } from "./util/keys";
import { cleanupTmp, stagingPath } from "./util/staging";

export const handler = async (event: ScheduledEvent, context: Context) =>
  als.run(store, async () => {
    reqIdChild(context.awsRequestId);
    const runDate = new Date();

    try {
      const pool = await getDbPool();
      const written: WrittenFile[] = [];

      // Stage every relation to /tmp first. A failure here publishes nothing.
      for (const [relation, columns] of Object.entries(EXPORT_DATASETS)) {
        const schema = await buildRelationSchema(pool, relation, columns);
        const localPath = stagingPath(relation);
        const rowCount = await writeRelationToFile(pool, relation, schema, localPath);
        written.push({ relation, localPath, rowCount });
        log.info({ relation, rowCount }, "staged relation to local parquet");
      }

      for (const file of written) {
        await uploadParquet(file.localPath, partitionKey(file.relation, runDate));
      }

      // Written last so consumers can tell a complete partition from a partial upload.
      await uploadSuccessMarker(runDate, written);

      log.info({ relations: written.length, runDate }, "data export completed.");
    } catch (error) {
      log.error({ error: (error as Error).message }, "data export failed.");
      throw error;
    } finally {
      await cleanupTmp();
    }
  });
