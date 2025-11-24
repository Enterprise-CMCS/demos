import { S3Adapter } from "./S3Adapter.js";

const HOST = "http://localhost:4566";
const BUCKET_NAME = "local-demos-bucket";

/**
 * Creates a local in-memory adapter for simple local development.
 * Does not persist files - just tracks uploaded keys in memory.
 *
 * @returns S3Adapter implementation
 */
export function createLocalS3Adapter(): S3Adapter {
  const uploadedFiles = new Set<string>();

  return {
    async getPresignedUploadUrl(key: string): Promise<string> {
      uploadedFiles.add(key);
      return `${HOST}/${BUCKET_NAME}/${key}?upload=true&expires=3600`;
    },

    async getPresignedDownloadUrl(key: string): Promise<string> {
      if (uploadedFiles.has(key)) {
        return `${HOST}/${BUCKET_NAME}/${key}?download=true&expires=3600`;
      }

      return `${key} does not exist!`;
    },

    async moveDocumentFromCleanToDeleted(key: string): Promise<void> {
      uploadedFiles.delete(key);
    },
  };
}
