import { Context, SQSEvent } from "aws-lambda";
import { Pool } from "pg";
import { als, log, reqIdChild, store } from "./log";
import { getDbPool, getDbSchema } from "./db";

const DEFAULT_DOCUMENT_TYPE_ID = "Final BN Worksheet";
const INITIAL_VALIDATION_STATUS_ID = "Succeeded";
const INITIAL_VALIDATION_DATA = {
  source: "budgetNeutrality",
};

interface BudgetNeutralityMessage {
  documentId: string;
  documentTypeId: string;
}

interface Results {
  processedRecords: number;
  existingDocuments: number;
  missingDocuments: number;
  upsertedWorkbooks: number;
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
    documentTypeId:
      typeof parsed.documentTypeId === "string" ? parsed.documentTypeId : DEFAULT_DOCUMENT_TYPE_ID,
  };
}

export async function upsertBudgetNeutralityWorkbook(
  pool: Pool,
  message: BudgetNeutralityMessage
): Promise<void> {
  const query = `INSERT INTO ${getDbSchema()}.budget_neutrality_workbook (
      id,
      document_type_id,
      validation_status_id,
      validation_data,
      updated_at
    )
    VALUES ($1::UUID, $2::TEXT, $3::TEXT, $4::JSON, CURRENT_TIMESTAMP)
    ON CONFLICT (id)
    DO UPDATE SET
      document_type_id = EXCLUDED.document_type_id,
      validation_status_id = EXCLUDED.validation_status_id,
      validation_data = EXCLUDED.validation_data,
      updated_at = CURRENT_TIMESTAMP;`;

  await pool.query(query, [
    message.documentId,
    message.documentTypeId,
    INITIAL_VALIDATION_STATUS_ID,
    JSON.stringify(INITIAL_VALIDATION_DATA),
  ]);
}

export const handler = async (event: SQSEvent, context: Context) =>
  als.run(store, async () => {
    reqIdChild(context.awsRequestId);

    const results: Results = {
      processedRecords: 0,
      existingDocuments: 0,
      missingDocuments: 0,
      upsertedWorkbooks: 0,
    };

    try {
      const pool = await getDbPool();

      for (const record of event.Records) {
        const message = parseMessage(record.body);
        const exists = await documentExists(pool, message.documentId);

        results.processedRecords++;

        if (exists) {
          results.existingDocuments++;
          await upsertBudgetNeutralityWorkbook(pool, message);
          results.upsertedWorkbooks++;
          log.info(
            {
              documentId: message.documentId,
              documentTypeId: message.documentTypeId,
            },
            "Budget Neutrality workbook row upserted."
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
