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
const DEMOS_SCHEMA = "demo_app";

const UPSERT_RESULT_SQL = `insert into ${DEMOS_SCHEMA}.uipath_result (id, request_id, project_id, response, document_id, status_id)
 values ($1, $2, $3, $4::jsonb, $5, $6)
 on conflict (request_id)
 do update set
   document_id = coalesce(excluded.document_id, uipath_result.document_id),
   project_id = excluded.project_id,
   response = excluded.response,
   status_id = excluded.status_id
 returning id`;
const UPSERT_FIELD_SQL = `insert into ${DEMOS_SCHEMA}.uipath_result_field
  (id, uipath_result_id, field_id, field_name, field_type, value, confidence, value_json, text_length)
 values
  ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
 on conflict (uipath_result_id, field_id)
 do update set
   field_name = excluded.field_name,
   field_type = excluded.field_type,
   value = excluded.value,
   confidence = excluded.confidence,
   value_json = excluded.value_json,
   text_length = excluded.text_length`;

interface UiPathFieldValue {
  Value?: string;
  UnformattedValue?: string;
  Confidence?: number;
  Reference?: {
    TextLength?: number;
  };
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
  documentId: string | undefined,
): Promise<void> {
  log.info("Extraction succeeded, processing results");
  const pool = await getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resultId = await upsertResult(
      client,
      requestId,
      projectId,
      documentId,
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

        await client.query(UPSERT_FIELD_SQL, [
          randomUUID(),
          resultId,
          row.FieldId,
          row.FieldName,
          row.FieldType,
          row.valueText,
          confidence,
          JSON.stringify(row.fieldValue),
          textLength,
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

async function upsertResult(
  client: PoolClient,
  requestId: string,
  projectId: string,
  documentId: string | undefined,
  status: UiPathStatus,
  response: unknown,
): Promise<string> {
  const upsertedResult = await client.query<{ id: string }>(UPSERT_RESULT_SQL, [
    randomUUID(),
    requestId,
    projectId,
    JSON.stringify(response),
    documentId,
    status,
  ]);

  const resultId = upsertedResult.rows[0]?.id;
  if (!resultId) {
    throw new Error("Failed to persist UiPath result row.");
  }

  return resultId;
}

async function persistResultStatus(
  requestId: string,
  projectId: string,
  documentId: string | undefined,
  status: UiPathStatus,
  response: unknown,
): Promise<void> {
  const pool = await getDbPool();
  const client = await pool.connect();

  try {
    await upsertResult(client, requestId, projectId, documentId, status, response);
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
  } = options;
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
      "Pending",
      { status: "Pending" },
    );

    let attempt = 0;
    while (attempt < maxAttempts) {
      await sleep(pollIntervalMs);
      const status = await fetchExtractionResult(token, resultUrl);
      lastPolledStatus = status;

      if (status.status === "Succeeded") {
        await persistExtractionStatus(status, requestId, projectId, documentId);
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
        "Failed",
        buildFailureResponse(error, lastPolledStatus),
      );
    } catch (persistError) {
      log.error({ error: persistError }, "Failed to persist UiPath failure status");
    }

    throw error;
  }
}
