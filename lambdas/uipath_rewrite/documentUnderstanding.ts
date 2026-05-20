import { getUiPathProjectName } from "./config";
import { log } from "./log";
import type { PreparedDocumentInput } from "./documentInput";
import type { ExtractionStatus } from "./types";
import { getToken } from "./uipathAuth";

import {
  getExtractionStatus,
  getProjectIdByName,
  startExtraction,
  uploadDocument
} from "./uipathApi";

import {
  saveFailedExtraction,
  saveFinishedExtraction,
  savePendingExtraction,
  type PersistenceContext
} from "./persistence";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type DocumentUnderstandingInput = PreparedDocumentInput & {
  requestId: string;
};

export type DocumentUnderstandingOptions = {
  token?: string;
  pollIntervalMs?: number;
  maxAttempts?: number;
};

async function waitForExtraction(
  token: string,
  resultUrl: string,
  context: PersistenceContext,
  options: Required<Pick<DocumentUnderstandingOptions, "pollIntervalMs" | "maxAttempts">>
): Promise<ExtractionStatus> {
  let lastPolledStatus: ExtractionStatus | null = null;

  try {
    for (let attempt = 0; attempt < options.maxAttempts; attempt += 1) {
      await sleep(options.pollIntervalMs);

      const status = await getExtractionStatus(token, resultUrl);
      lastPolledStatus = status;

      if (status.status === "Succeeded") {
        await saveFinishedExtraction(status, context);
        return status;
      }

      if (status.status === "Failed") {
        throw new Error("UiPath extraction returned Failed status.");
      }

      log.info(
        { status, attempt, pollIntervalMs: options.pollIntervalMs },
        "Extraction still running"
      );
    }

    throw new Error("UiPath extraction did not succeed within the configured attempts.");
  } catch (error) {
    try {
      await saveFailedExtraction(error, lastPolledStatus, context);
    } catch (persistError) {
      log.error({ error: persistError }, "Failed to Fail UiPath status");
    }

    throw error;
  }
}

// Main flow:
export async function runDocumentUnderstanding(
  input: DocumentUnderstandingInput,
  options: DocumentUnderstandingOptions = {}
): Promise<ExtractionStatus> {
  const token = options.token ?? await getToken();
  const projectId = await getProjectIdByName(token, getUiPathProjectName());
  const uploadedDocumentId = await uploadDocument(
    token,
    input.localPath,
    projectId,
    input.uploadFileNameWithExtension
  );
  const resultUrl = await startExtraction(token, uploadedDocumentId, projectId);

  const persistenceContext = {
    requestId: input.requestId,
    projectId,
    documentId: input.documentId,
    applicationId: input.applicationId
  };

  await savePendingExtraction(persistenceContext);

  return waitForExtraction(token, resultUrl, persistenceContext, {
    pollIntervalMs: options.pollIntervalMs ?? 3000,
    maxAttempts: options.maxAttempts ?? 50
  });
}
