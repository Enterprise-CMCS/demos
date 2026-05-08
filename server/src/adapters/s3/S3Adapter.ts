import { PrismaTransactionClient } from "../../prismaClient";
import { createAWSS3Adapter } from "./AwsS3Adapter";
import { createLocalS3Adapter } from "./LocalS3Adapter";
import { Prisma, Document as PrismaDocument } from "@prisma/client";
export interface S3Adapter {
  getPresignedUploadUrl(key: string): Promise<string>;
  getPresignedDownloadUrl(key: string): Promise<string>;
  moveDocumentFromCleanToDeleted(key: string): Promise<void>;
  uploadDocument(
    documentData: Prisma.DocumentPendingUploadCreateArgs["data"],
    tx?: PrismaTransactionClient
  ): Promise<{
    presignedURL: string;
    documentId: string;
  }>;
}

let s3AdapterInstance: S3Adapter | null = null;

export function getS3Adapter(): S3Adapter {
  if (s3AdapterInstance === null) {
    if (process.env.LOCAL_SIMPLE_UPLOAD === "true") {
      s3AdapterInstance = createLocalS3Adapter();
    } else {
      s3AdapterInstance = createAWSS3Adapter();
    }
  }
  return s3AdapterInstance;
}
