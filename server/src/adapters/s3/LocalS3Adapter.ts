import { randomUUID } from "node:crypto";
import { PrismaTransactionClient } from "../../prismaClient";
import { log } from "../../log";
import { UploadDocumentInput } from "../../types";
import { S3Adapter } from "../";

const HOSTNAME = "LocalS3Adapter";
const BUCKET_NAME = "local-demos-bucket";

/**
 * Creates a local in-memory adapter for simple local development.
 * Does not persist files - just tracks "uploaded" keys in memory.
 */
export function createLocalS3Adapter(): S3Adapter {
  const uploadedFiles = new Set<string>();

  return {
    async getPresignedUploadUrl(key: string): Promise<string> {
      uploadedFiles.add(key);
      return `${HOSTNAME}/${BUCKET_NAME}/${key}?upload=true&expires=3600`;
    },

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
      tx: PrismaTransactionClient,
      input: UploadDocumentInput,
      userId: string
    ): Promise<{
      presignedURL: string;
      documentId: string;
    }> {
      const documentId = randomUUID();
      const uploadBucket = process.env.UPLOAD_BUCKET ?? "local-simple-upload";
      const s3Path = `s3://${uploadBucket}/${input.applicationId}/${documentId}`;
      const document = await tx.document.create({
        data: {
          id: documentId,
          name: input.name,
          description: input.description ?? "",
          ownerUserId: userId,
          documentTypeId: input.documentType,
          applicationId: input.applicationId,
          phaseId: input.phaseName,
          s3Path,
        },
      });

      const fakePresignedUrl = await this.getPresignedUploadUrl(document.id);
      log.debug("fakePresignedUrl", undefined, fakePresignedUrl);
      return {
        presignedURL: fakePresignedUrl,
        documentId: document.id,
      };
    },
  };
}
