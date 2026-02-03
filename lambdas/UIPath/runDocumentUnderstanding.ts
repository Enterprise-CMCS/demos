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
        const resultId = randomUUID();

        await client.query(
          `insert into ${schema}.uipath_result (id, request_id, project_id, response) values ($1, $2, $3, $4::jsonb)`,
          [resultId, requestId, projectId, JSON.stringify(status)]
        );

        const extractedFields = getExtractedFields(status);
        for (const field of extractedFields) {
          if (field.IsMissing) {
            continue;
          }
          const values = Array.isArray(field.Values) ? field.Values : [];
          const fieldValues = values[0];
          const valueText = fieldValues?.UnformattedValue ?? fieldValues?.Value;
          // Skip if fields are missing.
          if (!valueText || !field.FieldName || !field.FieldId) {
            continue;
          }

          await client.query(
            `insert into ${schema}.uipath_result_field (id, uipath_result_id, field_id, field_name, field_type, value, confidence, value_json, text_length)
             values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)`,
            [
              randomUUID(),
              resultId,
              field.FieldId ?? "unknown",
              field.FieldName ?? field.FieldId ?? "unknown",
              field.FieldType ?? "Text",
              valueText,
              fieldValues?.Confidence ?? 0,
              JSON.stringify(fieldValues),
              fieldValues?.Reference?.TextLength ?? valueText.length,
            ]
          );
        }

        log.info({ extractedFieldCount: extractedFields.length }, "Processed UiPath fields");

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
