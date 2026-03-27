import { randomUUID } from "node:crypto";
import { log } from "./log";
import { getToken } from "./getToken";
import { uploadDocument } from "./uploadDocument";
import { extractDoc } from "./extractDoc";
import { fetchExtractionResult, ExtractionStatus } from "./fetchExtractResult";
import { getDbPool } from "./db";
import { getProjectIdByName } from "./getProjectId";
import type { PoolClient } from "pg";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

type UiPathStatus = "Pending" | "Finished" | "Failed";
// Right now, we only check for multiple demo_type values in 1 row
const DEMO_TYPE_FIELD_ID = "demo_type";
const DEMOS_SCHEMA = "demos_app";

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

interface UiPathFieldValue {
  Value?: string;
  UnformattedValue?: string;
  Confidence?: number;
  Reference?: {
    TextLength?: number;
    TextStartIndex?: number;
    TokenList?: unknown;
    Tokens?: unknown;
  };
  TokenList?: unknown;
  Tokens?: unknown;
  [key: string]: unknown;
}

interface UiPathField {
  FieldId?: string;
  FieldName?: string;
  FieldType?: string;
  IsMissing?: boolean;
  Values?: UiPathFieldValue[];
}

function getExtractedFields(status: ExtractionStatus): UiPathField[] {
  const payload = status as {
    Fields?: unknown;
    result?: {
      extractionResult?: {
        ResultsDocument?: {
          Fields?: unknown;
        };
      };
    };
  };

  const topLevelFields = payload.Fields;
  if (Array.isArray(topLevelFields)) {
    return topLevelFields as UiPathField[];
  }

  const nestedFields = payload.result?.extractionResult?.ResultsDocument?.Fields;
  if (Array.isArray(nestedFields)) {
    return nestedFields as UiPathField[];
  }

  return [];
}

type PersistableFieldValue = {
  FieldId: string;
  FieldName: string;
  FieldType: string;
  valueText: string;
  fieldValue: UiPathFieldValue;
};

function getConfidence(value: UiPathFieldValue): number {
  return typeof value.Confidence === "number" ? value.Confidence : 0;
}

function getTextStartIndex(value: UiPathFieldValue): number {
  const startIndex = value.Reference?.TextStartIndex;
  return typeof startIndex === "number" ? startIndex : 0;
}

function getTokenList(value: UiPathFieldValue): unknown[] {
  const tokenList =
    value.Reference?.TokenList ?? value.Reference?.Tokens ?? value.TokenList ?? value.Tokens;
  return Array.isArray(tokenList) ? tokenList : [];
}

function coerceValueText(value: UiPathFieldValue): string | null {
  const text = value.UnformattedValue ?? value.Value;
  if (typeof text !== "string") {
    return null;
  }

  return text.trim();
}

/**
 * This loops over the response and collects fields and saves then,
 * @param field
 * @returns
 */
function toPersistableFieldValues(field: UiPathField): PersistableFieldValue[] {
  // Some of these fields will not be here
  if (field.IsMissing) return [];
  if (!field.FieldId || !field.FieldName) return [];
  const values = field.Values ?? [];
  const fieldType = field.FieldType || "Text";

  const persistableValues: PersistableFieldValue[] = [];
  for (const fieldValue of values) {
    try {
      const valueText = coerceValueText(fieldValue);
      if (!valueText) continue;
      persistableValues.push({
        FieldId: field.FieldId,
        FieldName: field.FieldName,
        FieldType: fieldType,
        valueText,
        fieldValue,
      });
    } catch (error) {
      log.warn({ error, fieldId: field.FieldId }, "Skipping invalid UiPath field value");
    }
  }

  // only looks for demo_type with multiple values.
  if (field.FieldId !== DEMO_TYPE_FIELD_ID || persistableValues.length <= 1) {
    return persistableValues;
  }

  const bestByValue = new Map<string, PersistableFieldValue>();
  for (const persistableValue of persistableValues) {
    const key = persistableValue.valueText.toUpperCase();
    const existing = bestByValue.get(key);
    if (!existing || getConfidence(persistableValue.fieldValue) > getConfidence(existing.fieldValue)) {
      bestByValue.set(key, persistableValue);
    }
  }

  const uniqueValues = Array.from(bestByValue.values());
  if (uniqueValues.length <= 1) {
    return uniqueValues;
  }

  uniqueValues.sort((a, b) => getConfidence(b.fieldValue) - getConfidence(a.fieldValue));
  const combinedValueText = uniqueValues.map((value) => value.valueText).join(", ");
  const maxConfidence = Math.max(...uniqueValues.map((value) => getConfidence(value.fieldValue)));
  const sample = uniqueValues[0];
  if (!sample) return [];

  return [
    {
      FieldId: sample.FieldId,
      FieldName: sample.FieldName,
      FieldType: sample.FieldType,
      valueText: combinedValueText,
      fieldValue: {
        Value: combinedValueText,
        Confidence: maxConfidence,
        SelectedValues: uniqueValues.map((value) => value.valueText),
        RawValues: uniqueValues.map((value) => value.fieldValue),
      }
    },
  ];
}

async function persistExtractionStatus(
  status: ExtractionStatus,
  requestId: string,
  projectId: string,
  documentId: string,
  applicationId: string,
): Promise<void> {
  log.info("Extraction succeeded, processing results");
  const pool = await getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resultId = await updateUiPathResultByRequest(
      client,
      requestId,
      projectId,
      documentId,
      applicationId,
      "Finished",
      status,
    );

    const extractedFields = getExtractedFields(status);
    for (const field of extractedFields) {
      const persistableValues = toPersistableFieldValues(field);
      if (!persistableValues.length) continue;

      for (const row of persistableValues) {
        const confidence = typeof row.fieldValue.Confidence === "number" ? row.fieldValue.Confidence : 0;
        const textLength =
          typeof row.fieldValue.Reference?.TextLength === "number"
            ? row.fieldValue.Reference.TextLength
            : row.valueText.length;
        const textStartIndex = getTextStartIndex(row.fieldValue);
        const tokenList = getTokenList(row.fieldValue);

        await client.query(INSERT_VALUE_SQL, [
          randomUUID(),
          resultId,
          documentId,
          applicationId,
          row.FieldId,
          row.valueText,
          textLength,
          textStartIndex,
          confidence,
          JSON.stringify(tokenList),
        ]);
      }
    }

    await client.query("COMMIT");

    log.info(
      { extractedFieldCount: extractedFields.length },
      "Processed UiPath fields"
    );
    log.info("UiPath extraction succeeded");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function insertUiPathResult(
  client: PoolClient,
  requestId: string,
  projectId: string,
  documentId: string,
  applicationId: string,
  status: UiPathStatus,
  response: unknown,
): Promise<string> {
  const insertedResult = await client.query<{ id: string }>(INSERT_RESULT_BY_REQUEST_SQL, [
    randomUUID(),
    requestId,
    projectId,
    JSON.stringify(response),
    documentId,
    applicationId,
    status,
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
  response: unknown,
): Promise<string> {
  const updatedResult = await client.query<{ id: string }>(UPDATE_RESULT_BY_REQUEST_SQL, [
    requestId,
    projectId,
    JSON.stringify(response),
    documentId,
    applicationId,
    status,
  ]);

  const resultId = updatedResult.rows[0]?.id;
  if (!resultId) {
    throw new Error(`No existing UiPath result row found for request ${requestId}.`);
  }

  return resultId;
}

async function persistResultStatus(
  requestId: string,
  projectId: string,
  documentId: string,
  applicationId: string,
  status: UiPathStatus,
  response: unknown,
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
        response,
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
      response,
    );
  } finally {
    client.release();
  }
}

function buildFailureResponse(error: Error, lastPolledStatus: ExtractionStatus | null): Record<string, unknown> {
  const message = error.message;
  const response: Record<string, unknown> = { error: message };

  if (lastPolledStatus) {
    response.lastPolledStatus = lastPolledStatus;
  }

  return response;
}

export interface RunDocumentUnderstandingOptions {
  token?: string;
  pollIntervalMs?: number;
  maxAttempts?: number;
  requestId?: string;
  fileNameWithExtension?: string;
  documentId?: string;
  applicationId?: string;
}

export async function runDocumentUnderstanding(
  inputFile: string,
  options: RunDocumentUnderstandingOptions = {}
): Promise<ExtractionStatus> {
  const {
    token: providedToken,
    pollIntervalMs = 3000,
    maxAttempts = 50,
    requestId = "n/a",
    fileNameWithExtension,
    documentId,
    applicationId,
  } = options;

  if (!documentId || !applicationId) {
    throw new Error("documentId and applicationId are required to persist UiPath results.");
  }

  const token = providedToken ?? (await getToken());
  const projectId = await getProjectIdByName(token, process.env.UIPATH_PROJECT_NAME ?? "demosOCR");
  const docId = await uploadDocument(token, inputFile, projectId, fileNameWithExtension);
  const resultUrl = await extractDoc(token, docId, projectId);

  if (! token || ! projectId || ! docId || ! resultUrl) {
    log.error("Missing required information to run document understanding");
    throw new Error("Failed to initiate document understanding due to missing information.");
  }

  let lastPolledStatus: ExtractionStatus | null = null;

  try {
    await persistResultStatus(
      requestId,
      projectId,
      documentId,
      applicationId,
      "Pending",
      { status: "Pending" },
    );

    let attempt = 0;
    while (attempt < maxAttempts) {
      await sleep(pollIntervalMs);
      const status = await fetchExtractionResult(token, resultUrl);
      lastPolledStatus = status;

      if (status.status === "Succeeded") {
        await persistExtractionStatus(status, requestId, projectId, documentId, applicationId);
        return status;
      }

      if (status.status === "Failed") {
        throw new Error("UiPath extraction returned Failed status.");
      }

      log.info({ status, attempt, pollIntervalMs }, "Extraction still running");
      attempt += 1;
    }

    throw new Error("UiPath extraction did not succeed within the configured attempts.");
  } catch (error) {
    try {
      await persistResultStatus(
        requestId,
        projectId,
        documentId,
        applicationId,
        "Failed",
        buildFailureResponse(error, lastPolledStatus),
      );
    } catch (persistError) {
      log.error({ error: persistError }, "Failed to Fail UiPath status");
    }

    throw error;
  }
}
