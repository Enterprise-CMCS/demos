import { createAWSS3Adapter } from "./AWSS3Adapter.js";
import { createLocalS3Adapter } from "./LocalS3Adapter.js";

/**
 * S3 storage operations interface.
 * This abstraction allows for different implementations (AWS S3, local filesystem, etc.)
 * to be injected based on the environment.
 */
export interface S3Adapter {
  getPresignedUploadUrl(
    bucket: string,
    key: string,
    expiresIn: number,
  ): Promise<string>;

  getPresignedDownloadUrl(
    bucket: string,
    key: string,
    expiresIn: number,
  ): Promise<string>;

  copyObject(
    sourceBucket: string,
    sourceKey: string,
    destBucket: string,
    destKey: string,
  ): Promise<void>;

  deleteObject(bucket: string, key: string): Promise<void>;
}

/**
 * Creates the appropriate S3Adapter based on environment
 * */
export function createS3Adapter(): S3Adapter {
  if (process.env.LOCAL_SIMPLE_UPLOAD === "true") {
    return createLocalS3Adapter();
  }

  return createAWSS3Adapter();
}
