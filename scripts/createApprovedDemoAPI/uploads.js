/* global fetch, setTimeout */

import { access, readFile } from "node:fs/promises";
import { basename } from "node:path";
import { SEED_CONFIG } from "./config.js";

async function wait(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForProcessedDocument({ db, documentId, documentType }) {
  const startedAt = Date.now();
  while (true) {
    const document = await db.document.findUnique({ where: { id: documentId } });
    if (document) {
      return document;
    }

    if (Date.now() - startedAt >= SEED_CONFIG.processedUploadTimeoutMs) {
      throw new Error(
        `Timed out waiting for uploaded ${documentType} document ${documentId} to be processed.`
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
  db,
  documentPendingUploadResolvers,
  applicationId,
  phaseName,
  documentType,
  context,
  pdfBytes,
}) {
  const pendingUpload =
    await documentPendingUploadResolvers.Mutation.uploadDocumentToPhase(
      null,
      {
        input: {
          name: `${documentType} - ${basename(SEED_CONFIG.documentPath)}`,
          description: SEED_CONFIG.demoDescription,
          documentType,
          applicationId,
          phaseName,
        },
      },
      context
    );

  const uploadUrl =
    await documentPendingUploadResolvers.DocumentPendingUpload.presignedUploadUrl(pendingUpload);

  await putPdfToPresignedUrl(uploadUrl, documentType, pdfBytes);
  await waitForProcessedDocument({ db, documentId: pendingUpload.id, documentType });
  return pendingUpload;
}

export async function uploadPhaseDocuments({
  db,
  documentPendingUploadResolvers,
  applicationId,
  phaseName,
  documentTypes,
  context,
  pdfBytes,
}) {
  for (const documentType of documentTypes) {
    await uploadPhaseDocument({
      db,
      documentPendingUploadResolvers,
      applicationId,
      phaseName,
      documentType,
      context,
      pdfBytes,
    });
  }
}

export async function readUploadPdf() {
  try {
    await access(SEED_CONFIG.documentPath);
    return await readFile(SEED_CONFIG.documentPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot read configured upload PDF at ${SEED_CONFIG.documentPath}: ${message}`
    );
  }
}
