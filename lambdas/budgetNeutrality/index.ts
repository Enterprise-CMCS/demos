import { Context, SQSEvent } from "aws-lambda";
import { Pool } from "pg";
import type { PoolClient } from "pg";
import { als, log, reqIdChild, store } from "./log";
import { downloadDocumentFromS3 } from "./s3";
import { getDbPool } from "./db";
import {
  BudgetNeutralityMessage,
  getS3Path,
  parseAndValidateBudgetNeutralityMessage,
  validateSingleRecordCount,
} from "./budgetNeutralityValidation";
import { BNWorkbookInputError, parseBNWorkbook } from "demos-shared-library/BN";
import { validateBNWorkbook, ValidationResult } from "demos-shared-library/BN/validation";
import { validations } from "demos-shared-library/BN/rulesets";
import { extractBNReporting, extractorFunctions, type BNWorkbookExtract } from "demos-shared-library/BN/extractors";
import { clearBudgetNeutralityReportingSnapshot, replaceBudgetNeutralityReportingSnapshot } from "./reporting";

const SUCCEEDED_VALIDATION_STATUS_ID = "Succeeded";
const FAILED_VALIDATION_STATUS_ID = "Failed";
const MAX_SUPPORTED_HYPOTHETICAL_TEST = 13;
const DB_SCHEMA = "demos_app";
const LOCK_WORKBOOK_SQL = `SELECT id
  FROM ${DB_SCHEMA}.budget_neutrality_workbook
  WHERE id = $1::UUID
  FOR UPDATE;`;
const UPDATE_WORKBOOK_SQL = `UPDATE ${DB_SCHEMA}.budget_neutrality_workbook
  SET
    document_type_id = $2::TEXT,
    validation_status_id = $3::TEXT,
    validation_data = $4::JSON,
    actuals = $5::TEXT,
    net_variance_total = $6::NUMERIC,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $1::UUID;`;
interface Results {
  processedRecords: number;
  existingDocuments: number;
  missingDocuments: number;
  insertedWorkbooks: number;
}

export async function updateBudgetNeutralityWorkbook(
  pool: Pool,
  message: BudgetNeutralityMessage,
  validationResults: ValidationResult,
  reportingExtract?: BNWorkbookExtract,
): Promise<void> {
  const netVarianceTotal = validationResults.isValid
    ? requiredNetVarianceTotal(validationResults)
    : undefined;
  if (validationResults.isValid && !reportingExtract) {
    throw new Error("A valid BN workbook must have an extracted reporting snapshot.");
  }
  const client: PoolClient = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const workbook = await client.query(LOCK_WORKBOOK_SQL, [message.documentId]);
    if (workbook.rows.length === 0) {
      throw new Error(`Budget Neutrality workbook ${message.documentId} not found.`);
    }

    await client.query(UPDATE_WORKBOOK_SQL, [
      message.documentId,
      message.documentTypeId,
      validationResults.isValid ? SUCCEEDED_VALIDATION_STATUS_ID : FAILED_VALIDATION_STATUS_ID,
      JSON.stringify(validationResults.errors),
      validationResults.extractedValues.get("actuals"),
      netVarianceTotal,
    ]);

    if (netVarianceTotal !== undefined) {
      await replaceBudgetNeutralityReportingSnapshot(client, message.documentId, reportingExtract!);
    } else {
      await clearBudgetNeutralityReportingSnapshot(client, message.documentId);
    }
    await client.query("COMMIT");
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        log.error({ rollbackError }, "Unable to roll back BN workbook validation transaction.");
      }
    }
    throw error;
  } finally {
    client.release();
  }
}

function requiredNetVarianceTotal(validationResults: ValidationResult): number {
  const value = validationResults.extractedValues.get("netVariance");
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("A valid BN workbook must have a finite extracted net-variance value.");
  }
  return value;
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
      let validationResults: ValidationResult | undefined;
      let reportingExtract: BNWorkbookExtract | undefined;
      try {
        const parsedWorkbook = await parseBNWorkbook(downloadedDocumentPath);
        log.info(
          { documentId: message.documentId, cachedValuesMayBeStale: parsedWorkbook.cachedValuesMayBeStale },
          "BN workbook parsed.",
        );
        for (const warning of parsedWorkbook.warnings) {
          log.warn({ documentId: message.documentId, warning }, "BN workbook parser warning.");
        }

        log.info("Parsing completed. Starting validation against ruleset.");
        validationResults = await validateBNWorkbook(parsedWorkbook.data, validations, extractorFunctions);
        if (validationResults.isValid) {
          const reportingResult = extractBNReporting(
            parsedWorkbook.data,
            validationResults.extractedValues,
            { maxHypotheticalTest: MAX_SUPPORTED_HYPOTHETICAL_TEST },
          );
          reportingExtract = reportingResult.extract;
          for (const warning of reportingResult.warnings) {
            log.warn({ documentId: message.documentId, warning }, "BN reporting extraction warning.");
          }
        }
      } catch (error) {
        if (!(error instanceof BNWorkbookInputError)) throw error;
        validationResults = {
          isValid: false,
          errors: [error.validationError],
          extractedValues: new Map(),
        };
      }

      if (!validationResults) throw new Error("BN validation did not produce a result.");
      if (!validationResults.isValid) {
        for (const validationError of validationResults.errors) {
          log.warn({ documentId: message.documentId, validationError }, "BN workbook validation failed.");
        }
      }

      log.info("Validation completed. Inserting BN results into database.");
      results.existingDocuments = 1;
      await updateBudgetNeutralityWorkbook(pool, message, validationResults, reportingExtract);
      
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
