import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { getDbPool } from "../db";
import type { ExtractionStatus } from "../types";
import {
  getConfidence,
  getExtractedFields,
  getTextStartIndex,
  getTokenList,
  toPersistableFieldValues
} from "../uipathFields";
import type { PersistedUiPathValue } from "./applicationTagSuggestionExtracts";

const DEMOS_SCHEMA = "demos_app";

type UiPathStatus = "Pending" | "Finished" | "Failed";

const INSERT_RESULT_BY_REQUEST_SQL = `insert into ${DEMOS_SCHEMA}.uipath_result
 (id, request_id, project_id, response, document_id, application_id, status_id, updated_at)
 values ($1, $2, $3, $4::jsonb, $5, $6, $7, now())
 returning id`;
const UPDATE_RESULT_BY_REQUEST_SQL = `update ${DEMOS_SCHEMA}.uipath_result
 set
   document_id = $4,
   application_id = $5,
   project_id = $2,
   response = $3::jsonb,
   status_id = $6,
   updated_at = now()
 where request_id = $1
 returning id`;
const INSERT_VALUE_SQL = `insert into ${DEMOS_SCHEMA}.uipath_value
  (id, uipath_result_id, document_id, application_id, field_id, value, text_length, text_start_index, confidence, token_list, updated_at)
 values
  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, now())`;

export type PersistedUiPathExtraction = {
  extractedFieldCount: number;
  uiPathValues: PersistedUiPathValue[];
};

async function insertUiPathResult(
  client: PoolClient,
  requestId: string,
  projectId: string,
  documentId: string,
  applicationId: string,
  status: UiPathStatus,
  response: unknown
): Promise<string> {
  const insertedResult = await client.query<{ id: string }>(INSERT_RESULT_BY_REQUEST_SQL, [
    randomUUID(),
    requestId,
    projectId,
    JSON.stringify(response),
    documentId,
    applicationId,
    status
  ]);

  const resultId = insertedResult.rows[0]?.id;
  if (!resultId) {
    throw new Error("Failed to persist UiPath result row.");
  }

  return resultId;
}

async function updateUiPathResultByRequest(
  client: PoolClient,
  requestId: string,
  projectId: string,
  documentId: string,
  applicationId: string,
  status: UiPathStatus,
  response: unknown
): Promise<string> {
  const updatedResult = await client.query<{ id: string }>(UPDATE_RESULT_BY_REQUEST_SQL, [
    requestId,
    projectId,
    JSON.stringify(response),
    documentId,
    applicationId,
    status
  ]);

  const resultId = updatedResult.rows[0]?.id;
  if (!resultId) {
    throw new Error(`No existing UiPath result row found for request ${requestId}.`);
  }

  return resultId;
}

export async function persistResultStatus(
  requestId: string,
  projectId: string,
  documentId: string,
  applicationId: string,
  status: UiPathStatus,
  response: unknown
): Promise<void> {
  const pool = await getDbPool();
  const client = await pool.connect();

  try {
    if (status === "Pending") {
      await insertUiPathResult(
        client,
        requestId,
        projectId,
        documentId,
        applicationId,
        status,
        response
      );
      return;
    }

    await updateUiPathResultByRequest(
      client,
      requestId,
      projectId,
      documentId,
      applicationId,
      status,
      response
    );
  } finally {
    client.release();
  }
}

export async function persistFinishedUiPathExtraction(
  client: PoolClient,
  status: ExtractionStatus,
  requestId: string,
  projectId: string,
  documentId: string,
  applicationId: string
): Promise<PersistedUiPathExtraction> {
  await client.query("BEGIN");

  try {
    const resultId = await updateUiPathResultByRequest(
      client,
      requestId,
      projectId,
      documentId,
      applicationId,
      "Finished",
      status
    );

    const extractedFields = getExtractedFields(status);
    const uiPathValues: PersistedUiPathValue[] = [];

    for (const field of extractedFields) {
      for (const row of toPersistableFieldValues(field)) {
        const confidence = getConfidence(row.fieldValue);
        const textLength =
          typeof row.fieldValue.Reference?.TextLength === "number"
            ? row.fieldValue.Reference.TextLength
            : row.valueText.length;
        const textStartIndex = getTextStartIndex(row.fieldValue);
        const tokenList = getTokenList(row.fieldValue);
        const uiPathValueId = randomUUID();

        await client.query(INSERT_VALUE_SQL, [
          uiPathValueId,
          resultId,
          documentId,
          applicationId,
          row.FieldId,
          row.valueText,
          textLength,
          textStartIndex,
          confidence,
          JSON.stringify(tokenList)
        ]);

        uiPathValues.push({
          id: uiPathValueId,
          applicationId,
          fieldId: row.FieldId,
          value: row.valueText,
          tokenList
        });
      }
    }

    await client.query("COMMIT");

    return {
      extractedFieldCount: extractedFields.length,
      uiPathValues
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
