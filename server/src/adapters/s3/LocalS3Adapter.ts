import { randomUUID } from "node:crypto";
import { PrismaTransactionClient } from "../../prismaClient";
import { log } from "../../log";
import { S3Adapter } from "../";
import { Prisma } from "@prisma/client";

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
      documentData: Omit<Prisma.DocumentCreateArgs["data"], "s3Path">,
      tx: PrismaTransactionClient
    ): Promise<{
      presignedURL: string;
      documentId: string;
    }> {
      const documentId = randomUUID();
      const uploadBucket = process.env.UPLOAD_BUCKET ?? "local-simple-upload";
      const s3Path = `s3://${uploadBucket}/${documentData.applicationId}/${documentId}`;
      const document = await tx.document.create({
        data: {
          ...documentData,
          id: documentId,
          s3Path,
        } as Prisma.DocumentCreateArgs["data"],
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
