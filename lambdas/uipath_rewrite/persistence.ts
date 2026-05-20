import { getDbPool } from "./db";
import { log } from "./log";
import type { ExtractionStatus } from "./types";
import { persistApplicationTagSuggestionExtracts } from "./db/applicationTagSuggestionExtracts";
import { persistFinishedUiPathExtraction, persistResultStatus } from "./db/uiPathResults";

export type PersistenceContext = {
  requestId: string;
  projectId: string;
  documentId: string;
  applicationId: string;
};

export async function savePendingExtraction(context: PersistenceContext): Promise<void> {
  await persistResultStatus(
    context.requestId,
    context.projectId,
    context.documentId,
    context.applicationId,
    "Pending",
    { status: "Pending" }
  );
}

export async function saveFinishedExtraction(
  status: ExtractionStatus,
  context: PersistenceContext
): Promise<void> {
  log.info("Extraction succeeded, processing results");

  const pool = await getDbPool();
  const client = await pool.connect();

  try {
    const persistedExtraction = await persistFinishedUiPathExtraction(
      client,
      status,
      context.requestId,
      context.projectId,
      context.documentId,
      context.applicationId
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

export async function saveFailedExtraction(
  error: unknown,
  lastPolledStatus: ExtractionStatus | null,
  context: PersistenceContext
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const response: Record<string, unknown> = { error: message };

  if (lastPolledStatus) {
    response.lastPolledStatus = lastPolledStatus;
  }

  await persistResultStatus(
    context.requestId,
    context.projectId,
    context.documentId,
    context.applicationId,
    "Failed",
    response
  );
}
