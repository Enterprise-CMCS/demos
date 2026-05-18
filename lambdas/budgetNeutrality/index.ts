import { Context, SQSEvent } from "aws-lambda";
import { Pool } from "pg";
import { als, log, reqIdChild, store } from "./log";
import { downloadDocumentFromS3 } from "./s3";
import { getDbPool } from "./db";
import {
  BudgetNeutralityMessage,
  getS3Path,
  parseAndValidateBudgetNeutralityMessage,
  validateSingleRecordCount,
} from "./budgetNeutralityValidation";
import { parseBNFileFromPath } from "demos-shared-library/src/BN/index";
import { validateBNWorkbook, ValidationError } from "demos-shared-library/src/BN/validation";
import { validations } from "demos-shared-library/src/BN/rulesets/v1/index";

const SUCCEEDED_VALIDATION_STATUS_ID = "Succeeded";
const FAILED_VALIDATION_STATUS_ID = "Failed";
const DB_SCHEMA = "demos_app";

interface Results {
  processedRecords: number;
  existingDocuments: number;
  missingDocuments: number;
  insertedWorkbooks: number;
}

export async function updateBudgetNeutralityWorkbook(
  pool: Pool,
  message: BudgetNeutralityMessage,
  validationResults: ValidationError[]
): Promise<void> {
  const query = `UPDATE ${DB_SCHEMA}.budget_neutrality_workbook
    SET
      document_type_id = $2::TEXT,
      validation_status_id = $3::TEXT,
      validation_data = $4::JSON,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1::UUID;`;

  await pool.query(query, [
    message.documentId,
    message.documentTypeId,
    validationResults.length > 0 ? FAILED_VALIDATION_STATUS_ID : SUCCEEDED_VALIDATION_STATUS_ID,
    JSON.stringify(validationResults),
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
      
      // Validate that there's exactly one record in the event. This is a common pattern for SQS-triggered Lambdas that are designed to process one message at a time.
      validateSingleRecordCount(event.Records.length); // this will throw if fails.

      const record = event.Records[0];
      const message = parseAndValidateBudgetNeutralityMessage(record.body);
      const s3Path = await getS3Path(pool, message.documentId);

      results.processedRecords = 1;

      if (!s3Path) {
        throw new Error(`Document with ID ${message.documentId} does not exist.`);
      }

      log.info({ s3Path }, "Starting Download of BN workbook from S3.");
      const downloadedDocumentPath = await downloadDocumentFromS3(s3Path);
      
      log.info("Download completed. Starting parsing of BN workbook.");
      const parsedData = await parseBNFileFromPath(downloadedDocumentPath); 

      log.info("Parsing completed. Starting validation against ruleset.");
      const validationResults = await validateBNWorkbook(parsedData, validations);
      

      log.info("Validation completed. Inserting BN results into database.");
      results.existingDocuments = 1;
      await updateBudgetNeutralityWorkbook(pool, message, validationResults);
      
      results.insertedWorkbooks = 1;
      log.info(
        {
          documentId: message.documentId,
          documentTypeId: message.documentTypeId,
        },
        "Budget Neutrality workbook row inserted."
      );

      log.info({ results }, "Budget Neutrality validation completed.");

      return {
        statusCode: 200,
        body: `Processed ${results.processedRecords} records.`,
      };
    } catch (error) {
      log.error({ error: (error as Error).message }, "Budget Neutrality validation failed.");
      throw error;
    }
  });
