import { S3Adapter } from "./S3Adapter.js";

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
  };
}
