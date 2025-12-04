import { randomUUID } from "node:crypto";
import { DocumentAdapter } from "./DocumentAdapter.js";
import { prisma } from "../../prismaClient.js";
import { log } from "../../log.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { UploadDocumentInput, UploadDocumentResponse } from "../../types.js";
import { createDocument } from "../../model/document/queries/createDocument.js";

const HOSTNAME = "LocalS3Adapter";
const BUCKET_NAME = "local-demos-bucket";

/**
 * Creates a local in-memory adapter for simple local development.
 * Does not persist files - just tracks "uploaded" keys in memory.
 */
export function createLocalDocumentAdapter(): DocumentAdapter {
  const uploadedFiles = new Set<string>();

  async function getPresignedUploadUrl(key: string): Promise<string> {
    uploadedFiles.add(key);
    return `${HOSTNAME}/${BUCKET_NAME}/${key}?upload=true&expires=3600`;
  }

  return {
    async getPresignedDownloadUrl(key: string): Promise<string> {
      if (uploadedFiles.has(key)) {
        return `${HOSTNAME}/${BUCKET_NAME}/${key}?download=true&expires=3600`;
      }

      return `${key} does not exist!`;
    },

    async moveDocumentFromCleanToDeleted(key: string): Promise<void> {
      uploadedFiles.delete(key);
    },

    async uploadDocument(
      { input }: { input: UploadDocumentInput },
      ownerUserId: string
    ): Promise<UploadDocumentResponse> {
      try {
        // Looks for localstack pre-signed and does a simplified upload flow
        const documentId = randomUUID();
        const uploadBucket = process.env.UPLOAD_BUCKET ?? "local-simple-upload";
        const s3Path = `s3://${uploadBucket}/${input.applicationId}/${documentId}`;
        return await prisma().$transaction(async (tx) => {
          const document = await createDocument(tx, input, ownerUserId, documentId, s3Path);

          const fakePresignedUrl = await getPresignedUploadUrl(document.id);
          log.debug("fakePresignedUrl", undefined, fakePresignedUrl);
          return {
            presignedURL: fakePresignedUrl,
            documentId: document.id,
          };
        });
      } catch (error) {
        handlePrismaError(error);
      }
    },
  };
}
