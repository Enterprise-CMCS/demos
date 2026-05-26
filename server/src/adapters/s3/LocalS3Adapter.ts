import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { S3Adapter } from "../";
import { Prisma, DocumentPendingUpload as PrismaDocumentPendingUpload } from "@prisma/client";

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
      documentData: Prisma.DocumentPendingUploadCreateArgs["data"],
      tx?: PrismaTransactionClient
    ): Promise<PrismaDocumentPendingUpload> {
      const createPendingDocumentAndDocument = async (transaction: PrismaTransactionClient) => {
        const documentPendingUpload = await transaction.documentPendingUpload.create({
          data: documentData,
        });
        uploadedFiles.add(documentPendingUpload.id);
        await transaction.document.create({
          data: {
            ...documentData,
            id: documentPendingUpload.id,
            s3Path: `${HOSTNAME}/${BUCKET_NAME}/${documentPendingUpload.id}`,
          },
        });
        return documentPendingUpload;
      };

      if (tx) {
        return createPendingDocumentAndDocument(tx);
      }
      return prisma().$transaction(async (transaction) => {
        return createPendingDocumentAndDocument(transaction);
      });
    },
  };
}
