import { SQSEvent, Context } from "aws-lambda";

import { Client } from "pg";
import { als, log, store, reqIdChild } from "./log";
import { getDatabaseConfig } from "demos-shared-library/database";

const DELETE_INFECTED_DOCUMENT = "delete_infected_document";
const LIFECYCLE_EXPIRATION_DELETE_EVENT = "LifecycleExpiration:DeleteMarkerCreated";
const INFECTED_BUCKET = "infected-bucket";

const dbSchema = process.env.DB_SCHEMA || "demos_app";

interface Results {
  deletedInfectedDocuments: number;
}

export async function deleteInfectedDocument(client: typeof Client, documentKey: string) {
  const processDocumentQuery = `CALL ${dbSchema}.${DELETE_INFECTED_DOCUMENT}($1::TEXT);`;
  await client.query(processDocumentQuery, [documentKey]);
  log.info("successfully deleted infected document in database.");
}

function validateS3Event(s3Record: any): void {
  const eventName = s3Record.eventName;

  // Only accept LifecycleExpiration:DeleteMarkerCreated events (versioned buckets)
  if (eventName !== LIFECYCLE_EXPIRATION_DELETE_EVENT) {
    log.error(
      { eventName, s3Record },
      `Invalid event type - expected ${LIFECYCLE_EXPIRATION_DELETE_EVENT}`
    );
    throw new Error(
      `Invalid event type: ${eventName}. Expected ${LIFECYCLE_EXPIRATION_DELETE_EVENT}.`
    );
  }

  // Validate bucket name
  const bucketName = s3Record.s3?.bucket?.name;
  if (bucketName !== INFECTED_BUCKET) {
    log.error({ bucketName, s3Record }, `Invalid bucket - expected ${INFECTED_BUCKET}.`);
    throw new Error(`Invalid bucket: ${bucketName}. Expected ${INFECTED_BUCKET}.`);
  }

  log.debug({ eventName, bucketName }, "S3 event validation passed.");
}

export const handler = async (event: SQSEvent, context: Context) =>
  als.run(store, async () => {
    reqIdChild(context.awsRequestId);
    log.debug(
      {
        DB_SCHEMA: dbSchema,
      },
      "environment variables"
    );

    let client;

    const results: Results = {
      deletedInfectedDocuments: 0,
    };

    try {
      client = new Client(await getDatabaseConfig(process.env.DATABASE_SECRET_ARN));
      await client.connect();
      const setSearchPathQuery = `SET search_path TO ${dbSchema}, public;`;
      await client.query(setSearchPathQuery);

      for (const record of event.Records) {
        if (!record.body || typeof record.body !== "string") {
          log.error({ record }, "event record body invalid.");
          throw new Error("Lambda failed: event record body invalid.");
        }
        log.debug({ record }, "Processing SQS record.");
        const eventRecords = JSON.parse(record.body);

        for (const s3Record of eventRecords.Records) {
          try {
            // Validate the S3 event before processing
            validateS3Event(s3Record);

            const documentKey = s3Record.s3?.object?.key;
            if (!documentKey) {
              log.error({ s3Record }, "S3 record object key missing.");
              throw new Error("Lambda failed: S3 record object key missing.");
            }
            await deleteInfectedDocument(client, documentKey);
            results.deletedInfectedDocuments++;
          } catch (error) {
            log.error({ error: error.message }, "error processing record.");
            throw error;
          }
        }
      }

      log.info({ results }, "all records processed successfully.");

      return {
        statusCode: 200,
        body: `Deleted ${results.deletedInfectedDocuments} records.`,
      };
    } catch (error) {
      log.error({ error: error.message }, "lambda execution failed.");
      throw new Error(`Lambda failed: ${(error as Error).message}`);
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (closeError) {
          log.error({ error: closeError }, "error closing database connection.");
        }
      }
    }
  });
