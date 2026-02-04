import util from "node:util";
import { randomUUID } from "node:crypto";
import { log } from "./log";
import { getToken } from "./getToken";
import { uploadDocument } from "./uploadDocument";
import { extractDoc } from "./extractDoc";
import { fetchExtractionResult, ExtractionStatus } from "./fetchExtractResult";
import { getDbPool, getDbSchema } from "./db";
import { getProjectId } from "./uipathClient";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

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

type PersistableField = {
  FieldId: string;
  FieldName: string;
  FieldType: string;
  valueText: string;
  fieldValue: UiPathFieldValue;
};

function coerceValueText(v: UiPathFieldValue): string | null {
  const text = v.UnformattedValue ?? v.Value;
  if (typeof text !== "string") return null;

  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toPersistableField(field: UiPathField): PersistableField | null {
  if (field.IsMissing) return null;
  if (typeof field.FieldId !== "string" || field.FieldId.trim() === "") return null;
  if (typeof field.FieldName !== "string" || field.FieldName.trim() === "") return null;

  const values = Array.isArray(field.Values) ? field.Values : null;
  if (!values || values.length === 0) return null;

  const fieldValue = values[0];
  if (!fieldValue) return null;

  const valueText = coerceValueText(fieldValue);
  if (!valueText) return null;

  const fieldType =
    typeof field.FieldType === "string" && field.FieldType.trim() !== ""
      ? field.FieldType
      : "Text";

  return {
    FieldId: field.FieldId,
    FieldName: field.FieldName,
    FieldType: fieldType,
    valueText,
    fieldValue,
  };
}

export interface RunDocumentUnderstandingOptions {
  token?: string;
  logFullResult?: boolean;
  pollIntervalMs?: number;
  maxAttempts?: number;
  requestId?: string;
}

export async function runDocumentUnderstanding(
  inputFile: string,
  options: RunDocumentUnderstandingOptions = {}
): Promise<ExtractionStatus> {
  const {
    token: providedToken,
    pollIntervalMs = 3000,
    maxAttempts = 500,
    logFullResult = true,
    requestId = "n/a",
  } = options;

  const token = providedToken ?? (await getToken());
  const projectId = await getProjectId();
  log.info("Got auth token.");

  const docId = await uploadDocument(token, inputFile);
  log.info({ docId }, "Uploaded document.");

  const resultUrl = await extractDoc(token, docId);
  log.info({ resultUrl }, "Started extraction.");

  let attempt = 0;
  while (attempt < maxAttempts) {
    await sleep(pollIntervalMs);
    const status = await fetchExtractionResult(token, resultUrl);

    if (status.status === "Succeeded") {
      const pool = await getDbPool();
      const client = await pool.connect();
      try {
        const schema = getDbSchema();

        const upsertedResult = await client.query<{ id: string }>(
          `insert into ${schema}.uipath_result (id, request_id, project_id, response)
           values ($1, $2, $3, $4::jsonb)
           on conflict (request_id)
           do update set
             project_id = excluded.project_id,
             response = excluded.response
           returning id`,
          [randomUUID(), requestId, projectId, JSON.stringify(status)]
        );

        const resultId = upsertedResult.rows[0]?.id;
        if (!resultId) {
          throw new Error("Failed to persist UiPath result row.");
        }

        const extractedFields = getExtractedFields(status);

        for (const field of extractedFields) {
          const p = toPersistableField(field);
          if (!p) continue;

          const confidence =
            typeof p.fieldValue.Confidence === "number" ? p.fieldValue.Confidence : 0;

          const textLength =
            typeof p.fieldValue.Reference?.TextLength === "number"
              ? p.fieldValue.Reference.TextLength
              : p.valueText.length;

          await client.query(
            `insert into ${schema}.uipath_result_field
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
               text_length = excluded.text_length`,
            [
              randomUUID(),
              resultId,
              p.FieldId,
              p.FieldName,
              p.FieldType,
              p.valueText,
              confidence,
              JSON.stringify(p.fieldValue),
              textLength,
            ]
          );
        }

        log.info(
          { extractedFieldCount: extractedFields.length },
          "Processed UiPath fields"
        );

        if (logFullResult) {
          log.info(util.inspect(status, false, null, true));
        } else {
          log.info({ status }, "UiPath extraction succeeded");
        }
      } finally {
        client.release();
      }

      return status;
    }

    log.info({ status, attempt, pollIntervalMs }, "Extraction still running");
    attempt += 1;
  }

  throw new Error("UiPath extraction did not succeed within the configured attempts.");
}
