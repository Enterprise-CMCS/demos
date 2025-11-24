import { createAWSS3Adapter } from "./AWSS3Adapter.js";
import { createLocalS3Adapter } from "./LocalS3Adapter.js";

export interface S3Adapter {
  getPresignedUploadUrl(key: string): Promise<string>;
  getPresignedDownloadUrl(key: string): Promise<string>;
  moveDocumentFromCleanToDeleted(key: string): Promise<void>;
}

export function createS3Adapter(): S3Adapter {
  if (process.env.LOCAL_SIMPLE_UPLOAD === "true") return createLocalS3Adapter();
  return createAWSS3Adapter();
}
