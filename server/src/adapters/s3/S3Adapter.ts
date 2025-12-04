import { UploadDocumentInput, UploadDocumentResponse } from "../../types.js";
import { createAWSS3Adapter } from "./AwsS3Adapter.js";
import { createLocalS3Adapter } from "./LocalS3Adapter.js";

export interface S3Adapter {
  getPresignedDownloadUrl(key: string): Promise<string>;
  moveDocumentFromCleanToDeleted(key: string): Promise<void>;
  uploadDocument(
    { input }: { input: UploadDocumentInput },
    ownerUserId: string
  ): Promise<UploadDocumentResponse>;
}

let s3AdapterInstance: S3Adapter | null = null;

export function createS3Adapter(): S3Adapter {
  if (s3AdapterInstance) {
    return s3AdapterInstance;
  }

  if (process.env.LOCAL_SIMPLE_UPLOAD === "true") {
    s3AdapterInstance = createLocalS3Adapter();
  } else {
    s3AdapterInstance = createAWSS3Adapter();
  }

  return s3AdapterInstance;
}
