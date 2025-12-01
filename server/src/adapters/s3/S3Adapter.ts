import { createAWSS3Adapter } from "./AwsS3Adapter.js";

export interface S3Adapter {
  getPresignedUploadUrl(key: string): Promise<string>;
  getPresignedDownloadUrl(key: string): Promise<string>;
  moveDocumentFromCleanToDeleted(key: string): Promise<void>;
}

export function createS3Adapter(): S3Adapter {
  return createAWSS3Adapter();
}
