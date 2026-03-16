import { Context, SQSEvent } from "aws-lambda";
import { Pool } from "pg";
import { als, log, reqIdChild, store } from "./log";
import { getDbPool } from "./db";
import {
  BudgetNeutralityMessage,
  documentExists,
  parseAndValidateBudgetNeutralityMessage,
  validateSingleRecordCount,
} from "./budgetNeutralityValidation";

const INITIAL_VALIDATION_STATUS_ID = "Succeeded";
const DB_SCHEMA = "demos_app";
const INITIAL_VALIDATION_DATA = {
  source: "budgetNeutrality",
};

interface Results {
  processedRecords: number;
  existingDocuments: number;
  missingDocuments: number;
  insertedWorkbooks: number;
}

export async function insertBudgetNeutralityWorkbook(
  pool: Pool,
  message: BudgetNeutralityMessage
): Promise<void> {
  const query = `INSERT INTO ${DB_SCHEMA}.budget_neutrality_workbook (
      id,
      document_type_id,
      validation_status_id,
      validation_data,
      updated_at
    )
    VALUES ($1::UUID, $2::TEXT, $3::TEXT, $4::JSON, CURRENT_TIMESTAMP);`;

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
      insertedWorkbooks: 0,
    };

    try {
      const pool = await getDbPool();

      // BN VALIDATION STARTS HERE! budgetNeutralityValidation.ts is starter validation logic.
      validateSingleRecordCount(event.Records.length); // this will throw if fails.

      const record = event.Records[0];
      const message = parseAndValidateBudgetNeutralityMessage(record.body);
      const exists = await documentExists(pool, message.documentId);

      results.processedRecords = 1;

      if (!exists) {
        throw new Error(`Document with ID ${message.documentId} does not exist.`);
      }

      results.existingDocuments = 1;
      await insertBudgetNeutralityWorkbook(pool, message);
      results.insertedWorkbooks = 1;
      log.info(
        {
          documentId: message.documentId,
          documentTypeId: message.documentTypeId,
        },
        "Budget Neutrality workbook row inserted."
      );

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
