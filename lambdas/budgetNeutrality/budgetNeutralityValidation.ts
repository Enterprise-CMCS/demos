import { Pool } from "pg";
import { dbSchema } from "./db";

/**
 * Let's document the checks as we go.
 */

export const FINAL_BN_WORKSHEET_DOCUMENT_TYPE = "BN Workbook";

/**
 * Checks if a document with the given ID exists in the database.
 * @param pool - The PostgreSQL connection pool.
 * @param documentId - The ID of the document to check for existence.
 * @returns A promise that resolves to true if the document exists, false otherwise.
 * @throws An error if the database query fails.
 */
export async function documentExists(pool: Pool, documentId: string): Promise<boolean> {
  const query = `SELECT EXISTS(SELECT 1 FROM ${dbSchema}.document WHERE id = $1::UUID);`;
  const result = await pool.query(query, [documentId]);
  return result.rows[0]?.exists || false;
}

export async function getS3Path(pool: Pool, documentId: string): Promise<string | null> {
  const query = `SELECT s3_path FROM ${dbSchema}.document WHERE id = $1::UUID;`;
  const result = await pool.query(query, [documentId]);
  return result.rows[0]?.s3_path || null;
}

export interface BudgetNeutralityMessage {
  documentId: string;
  documentTypeId: string;
}

/**
 * Validates that exactly one record is being processed.
 * @param recordCount - The number of records to validate.
 * @throws An error if the record count is not exactly one.
 */

export function validateSingleRecordCount(recordCount: number): void {
  if (recordCount !== 1) {
    throw new Error(`Lambda failed: Expected exactly 1 record, received ${recordCount}.`);
  }
}

/**
 * Parses and validates the budget neutrality message from the SQS record body.
 * @param recordBody - The JSON string from the SQS record body.
 * @returns The parsed and validated BudgetNeutralityMessage object.
 * @throws An error if the message is invalid or missing required fields.
 */
export function parseAndValidateBudgetNeutralityMessage(
  recordBody: string
): BudgetNeutralityMessage {
  const parsed = JSON.parse(recordBody);

  if (!parsed.documentId || typeof parsed.documentId !== "string") {
    throw new Error("Lambda failed: Invalid message: documentId is required.");
  }

  if (!parsed.documentTypeId || typeof parsed.documentTypeId !== "string") {
    throw new Error("Lambda failed: Invalid message: documentTypeId is required.");
  }

  if (parsed.documentTypeId !== FINAL_BN_WORKSHEET_DOCUMENT_TYPE) {
    throw new Error(
      `Lambda failed: Invalid message: documentTypeId must be "${FINAL_BN_WORKSHEET_DOCUMENT_TYPE}". Received "${parsed.documentTypeId}".`
    );
  }

  return {
    documentId: parsed.documentId,
    documentTypeId: parsed.documentTypeId,
  };
}
