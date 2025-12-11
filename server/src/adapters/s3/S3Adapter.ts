import { PrismaTransactionClient } from "../../prismaClient";
import { UploadDocumentInput } from "../../types";
import { createAWSS3Adapter } from "./AwsS3Adapter";
import { createLocalS3Adapter } from "./LocalS3Adapter";

export interface S3Adapter {
  getPresignedUploadUrl(key: string): Promise<string>;
  getPresignedDownloadUrl(key: string): Promise<string>;
  moveDocumentFromCleanToDeleted(key: string): Promise<void>;
  uploadDocument(
    tx: PrismaTransactionClient,
    input: UploadDocumentInput,
    userId: string
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
