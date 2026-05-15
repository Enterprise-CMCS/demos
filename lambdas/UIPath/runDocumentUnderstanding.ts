import { log } from "./log";
import { getToken } from "./getToken";
import { uploadDocument } from "./uploadDocument";
import { extractDoc } from "./extractDoc";
import { fetchExtractionResult, ExtractionStatus } from "./fetchExtractResult";
import { getDbPool } from "./db";
import { getProjectIdByName } from "./getProjectId";
import {
  ApplicationTagSuggestionExtractError,
  persistApplicationTagSuggestionExtracts,
} from "./db/applicationTagSuggestionExtracts";
import {
  persistFinishedUiPathExtraction,
  persistResultStatus,
} from "./db/uiPathResults";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

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
    const persistedExtraction = await persistFinishedUiPathExtraction(
      client,
      status,
      requestId,
      projectId,
      documentId,
      applicationId,
    );
    await persistApplicationTagSuggestionExtracts(client, persistedExtraction.uiPathValues);

    log.info(
      { extractedFieldCount: persistedExtraction.extractedFieldCount },
      "Processed UiPath fields"
    );
    log.info("UiPath extraction succeeded");
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
    if (error instanceof ApplicationTagSuggestionExtractError) {
      throw error;
    }

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
