/* global fetch, setTimeout */

import { access, readFile } from "node:fs/promises";
import { basename } from "node:path";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_CONFIG } from "./config.js";

const scriptsDir = fileURLToPath(new URL("../", import.meta.url));

function resolveDocumentPath(documentPath) {
  return isAbsolute(documentPath) ? documentPath : resolve(scriptsDir, documentPath);
}

async function wait(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForProcessedDocument({
  documentExists,
  documentId,
  documentType,
  usedDatabaseCreateFile,
}) {
  console.log("waitForProcessedDocument for " + documentType);
  const startedAt = Date.now();
  while (true) {
    if (await documentExists(documentId)) {
      return;
    }

    if (Date.now() - startedAt >= SEED_CONFIG.processedUploadTimeoutMs) {
      const guidance = usedDatabaseCreateFile
        ? ""
        : " Ensure the fileprocess pipeline is running, or set DATABASE_CREATE_FILE=true to use the direct database finalize path.";
      throw new Error(
        `Timed out waiting for uploaded ${documentType} document ${documentId} to be processed.${guidance}`
      );
    }
    await wait(SEED_CONFIG.processedUploadPollMs);
  }
}

async function putPdfToPresignedUrl(uploadUrl, documentType, pdfBytes) {
  if (!uploadUrl.startsWith("http://") && !uploadUrl.startsWith("https://")) {
    throw new Error(`Upload URL for ${documentType} is not an HTTP URL: ${uploadUrl}`);
  }

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": "application/pdf" },
    body: pdfBytes,
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Upload PUT for ${documentType} failed with ${response.status} ${response.statusText}: ` +
        responseBody.slice(0, 500)
    );
  }
}

async function uploadPhaseDocument({
  api,
  applicationId,
  phaseName,
  documentType,
  pdfBytes,
}) {
  const pendingUpload = await api.uploadDocumentToPhase({
    name: `${documentType} - ${basename(SEED_CONFIG.documentPath)}`,
    description: SEED_CONFIG.demoDescription,
    documentType,
    applicationId,
    phaseName,
  });

  const usedDatabaseCreateFile = SEED_CONFIG.databaseCreateFile;

  await putPdfToPresignedUrl(pendingUpload.presignedUploadUrl, documentType, pdfBytes);

  if (usedDatabaseCreateFile) {
    await api.processUploadedDocument(pendingUpload.id, applicationId);
  }

  await waitForProcessedDocument({
    documentExists: api.documentExists,
    documentId: pendingUpload.id,
    documentType,
    usedDatabaseCreateFile,
  });
  return pendingUpload;
}

export async function uploadPhaseDocuments({
  api,
  applicationId,
  phaseName,
  documentTypes,
  pdfBytes,
}) {
  for (const documentType of documentTypes) {
    await uploadPhaseDocument({
      api,
      applicationId,
      phaseName,
      documentType,
      pdfBytes,
    });
  }
}

export async function readUploadPdf() {
  const documentPath = resolveDocumentPath(SEED_CONFIG.documentPath);

  try {
    await access(documentPath);
    return await readFile(documentPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot read configured upload PDF at ${documentPath}: ${message}`
    );
  }
}
