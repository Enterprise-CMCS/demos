import { randomUUID } from "node:crypto";
import type { Context, SQSEvent } from "aws-lambda";
import type { Pool, PoolClient } from "pg";
import { als, log, reqIdChild, store } from "./log";
import { downloadDocumentFromS3 } from "./s3";
import { getDbPool } from "./db";
import {
  BudgetNeutralityMessage,
  getS3Path,
  parseAndValidateBudgetNeutralityMessage,
  validateSingleRecordCount,
} from "./budgetNeutralityValidation";
import { parseBNWorkbook } from "demos-shared-library/BN";
import { validateBNWorkbook, type ValidationResult } from "demos-shared-library/BN/validation";
import { validations } from "demos-shared-library/BN/rulesets";
import {
  BN_PARSER_VERSION,
  extractBNReporting,
  extractorFunctions,
  type BNWorkbookExtract,
} from "demos-shared-library/BN/extractors";

const SUCCEEDED_VALIDATION_STATUS_ID = "Succeeded";
const FAILED_VALIDATION_STATUS_ID = "Failed";
const DB_SCHEMA = "demos_app";
const MAX_HYPOTHETICAL_TEST = 13;

const UPDATE_WORKBOOK_SQL = `UPDATE ${DB_SCHEMA}.budget_neutrality_workbook
  SET
    document_type_id = $2::TEXT,
    validation_status_id = $3::TEXT,
    validation_data = $4::JSON,
    actuals = $5::TEXT,
    net_variance_total = $6::NUMERIC,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $1::UUID
  RETURNING id;`;

const DELETE_CHILD_SNAPSHOT_SQL = [
  // Deleting spending limits cascades to their MEG rows.
  `DELETE FROM ${DB_SCHEMA}.budget_neutrality_workbook_spending_limit WHERE workbook_id = $1::UUID`,
  `DELETE FROM ${DB_SCHEMA}.budget_neutrality_workbook_test_value WHERE workbook_id = $1::UUID`,
  `DELETE FROM ${DB_SCHEMA}.budget_neutrality_workbook_test_year WHERE workbook_id = $1::UUID`,
];

async function insertRows(
  client: PoolClient,
  table: string,
  columns: readonly string[],
  rows: readonly (readonly unknown[])[],
): Promise<void> {
  if (rows.length === 0) return;

  const placeholders = rows.map((_, rowIndex) => {
    const values = columns.map((_, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`);
    return `(${values.join(", ")})`;
  });
  await client.query(
    `INSERT INTO ${DB_SCHEMA}.${table} (${columns.join(", ")}) VALUES ${placeholders.join(", ")}`,
    rows.flat(),
  );
}

function logExtractionWarnings(documentId: string, warnings: string[]): void {
  for (const warning of warnings) {
    log.warn({ documentId, parserVersion: BN_PARSER_VERSION, warning }, "BN workbook extraction warning.");
  }
}

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
  reportingExtract: BNWorkbookExtract | null,
): Promise<void> {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const extractedValues = validationResults.isValid ? validationResults.extractedValues : undefined;
    const updatedWorkbook = await client.query<{ id: string }>(UPDATE_WORKBOOK_SQL, [
      message.documentId,
      message.documentTypeId,
      validationResults.isValid ? SUCCEEDED_VALIDATION_STATUS_ID : FAILED_VALIDATION_STATUS_ID,
      JSON.stringify(validationResults.errors),
      extractedValues?.get("actuals") ?? null,
      extractedValues?.get("netVariance") ?? null,
    ]);
    if (updatedWorkbook.rows.length !== 1 || !updatedWorkbook.rows[0]?.id) {
      throw new Error(`No unique BN workbook record found for document ${message.documentId}.`);
    }
    const workbookId = updatedWorkbook.rows[0].id;

    for (const query of DELETE_CHILD_SNAPSHOT_SQL) {
      await client.query(query, [workbookId]);
    }

    if (validationResults.isValid) {
      if (!reportingExtract) {
        throw new Error(`A valid BN workbook extraction is required for document ${message.documentId}.`);
      }

      await insertRows(client, "budget_neutrality_workbook_test_value", [
        "id", "workbook_id", "test_id", "measure_id", "meg_name", "dy_number", "value",
      ], reportingExtract.testValues.map((row) => [
        randomUUID(), workbookId, row.testId, row.measureId, row.megName, row.dyNumber, row.value,
      ]));
      await insertRows(client, "budget_neutrality_workbook_test_year", [
        "workbook_id", "test_id", "dy_number", "cap_needed",
      ], reportingExtract.testYears.map((row) => [
        workbookId, row.testId, row.dyNumber, row.capNeeded ?? null,
      ]));
      await insertRows(client, "budget_neutrality_workbook_spending_limit", [
        "workbook_id", "program_index", "program_name", "cap_total", "variance_total", "over_cap",
      ], reportingExtract.spendingLimits.map((row) => [
        workbookId, row.programIndex, row.programName, row.capTotal ?? null, row.varianceTotal ?? null, row.overCap ?? null,
      ]));
      await insertRows(client, "budget_neutrality_workbook_spending_limit_meg", [
        "workbook_id", "program_index", "line_number", "meg_name", "subject_to_cap_total",
      ], reportingExtract.spendingLimits.flatMap((row) => row.megs.map((meg) => [
        workbookId, row.programIndex, meg.lineNumber, meg.megName, meg.subjectToCapTotal ?? null,
      ])));
    }

    await client.query("COMMIT");
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        log.error(
          { documentId: message.documentId, error: rollbackError },
          "Failed to roll back BN workbook update.",
        );
      }
    }
    throw error;
  } finally {
    client.release();
  }
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
      
      log.info({ documentId: message.documentId }, "Download completed. Starting parsing of BN workbook.");
      let parsedWorkbook;
      try {
        parsedWorkbook = await parseBNWorkbook(downloadedDocumentPath);
      } catch (error) {
        log.error(
          {
            documentPath: downloadedDocumentPath,
            error: error instanceof Error ? error.message : String(error),
          },
          "Unable to parse BN workbook."
        );
        throw error;
      }

      log.info(
        {
          documentId: message.documentId,
          parserVersion: BN_PARSER_VERSION,
          cachedValuesMayBeStale: parsedWorkbook.cachedValuesMayBeStale,
        },
        "BN workbook parsed.",
      );
      logExtractionWarnings(message.documentId, parsedWorkbook.warnings);

      log.info("Parsing completed. Starting validation against ruleset.");
      const validationResults = await validateBNWorkbook(parsedWorkbook.data, validations, extractorFunctions);
      let reportingExtract: BNWorkbookExtract | null = null;

      if (validationResults.isValid) {
        const extractedValues = validationResults.extractedValues ?? new Map<string, string | number>();
        const extractionResult = extractBNReporting(
          parsedWorkbook.data,
          extractedValues,
          { maxHypotheticalTest: MAX_HYPOTHETICAL_TEST },
        );
        reportingExtract = extractionResult.extract;
        logExtractionWarnings(message.documentId, extractionResult.warnings);
      } else {
        for (const error of validationResults.errors) {
          log.warn(
            { documentId: message.documentId, parserVersion: BN_PARSER_VERSION, validationError: error },
            "BN workbook validation error.",
          );
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
