import { Context, SQSEvent } from "aws-lambda";
import { Pool } from "pg";
import { als, log, reqIdChild, store } from "./log";
import { getDbPool, getDbSchema } from "./db";

interface BudgetNeutralityMessage {
  documentId: string;
  documentTypeId?: string;
}

interface Results {
  processedRecords: number;
  existingDocuments: number;
  missingDocuments: number;
}

export async function documentExists(pool: Pool, documentId: string): Promise<boolean> {
  const query = `SELECT EXISTS(SELECT 1 FROM ${getDbSchema()}.document WHERE id = $1::UUID) AS exists;`;
  const result = await pool.query(query, [documentId]);
  return Boolean(result.rows[0]?.exists);
}

function parseMessage(recordBody: string): BudgetNeutralityMessage {
  const parsed = JSON.parse(recordBody);

  if (!parsed.documentId || typeof parsed.documentId !== "string") {
    throw new Error("Invalid message: documentId is required.");
  }

  return {
    documentId: parsed.documentId,
    documentTypeId: parsed.documentTypeId,
  };
}

export const handler = async (event: SQSEvent, context: Context) =>
  als.run(store, async () => {
    reqIdChild(context.awsRequestId);

    const results: Results = {
      processedRecords: 0,
      existingDocuments: 0,
      missingDocuments: 0,
    };

    try {
      const pool = await getDbPool();

      for (const record of event.Records) {
        const message = parseMessage(record.body);
        const exists = await documentExists(pool, message.documentId);

        results.processedRecords++;

        if (exists) {
          results.existingDocuments++;
          log.info(
            {
              documentId: message.documentId,
              documentTypeId: message.documentTypeId,
            },
            "Budget Neutrality validation placeholder accepted message."
          );
        } else {
          results.missingDocuments++;
          log.warn(
            {
              documentId: message.documentId,
              documentTypeId: message.documentTypeId,
            },
            "Budget Neutrality validation placeholder did not find document in database."
          );
        }
      }

      log.info({ results }, "Budget Neutrality validation placeholder completed.");

      return {
        statusCode: 200,
        body: `Processed ${results.processedRecords} records.`,
      };
    } catch (error) {
      log.error({ error: (error as Error).message }, "Budget Neutrality validation failed.");
      throw new Error(`Lambda failed: ${(error as Error).message}`);
    }
  });
