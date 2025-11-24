import { promises as fs } from "node:fs";
import * as path from "node:path";
import { S3Adapter } from "./S3Adapter.js";
import { log } from "../../../log.js";

/**
 * Ensure the directory for a given bucket exists
 */
async function ensureBucketDir(
  baseDir: string,
  bucket: string,
): Promise<string> {
  const bucketPath = path.join(baseDir, bucket);
  await fs.mkdir(bucketPath, { recursive: true });
  return bucketPath;
}

/**
 * Get the full file path for a bucket and key
 */
async function getFilePath(
  baseDir: string,
  bucket: string,
  key: string,
): Promise<string> {
  const bucketPath = await ensureBucketDir(baseDir, bucket);
  const filePath = path.join(bucketPath, key);

  // Ensure the directory for the file exists
  const fileDir = path.dirname(filePath);
  await fs.mkdir(fileDir, { recursive: true });

  return filePath;
}

/**
 * Creates a local filesystem adapter that stores files in a tmp directory instead of S3.
 * Useful for local development and testing.
 *
 * @param baseDir - Base directory for file storage (default: /tmp/demos-local-s3)
 * @param baseUrl - Base URL for mock presigned URLs (default: http://localhost:4566)
 * @returns S3Adapter implementation
 */
export function createLocalS3Adapter(
  baseDir: string = "/tmp/demos-local-s3",
  baseUrl: string = "http://localhost:4566",
): S3Adapter {
  const uploadBucket = process.env.UPLOAD_BUCKET ?? "local-upload-bucket";
  const cleanBucket = process.env.CLEAN_BUCKET ?? "local-clean-bucket";
  const deletedBucket = process.env.DELETED_BUCKET ?? "local-deleted-bucket";

  return {
    async getPresignedUploadUrl(key: string): Promise<string> {
      const url = `${baseUrl}/${uploadBucket}/${key}?upload=true&expires=3600`;

      log.debug("LocalS3Adapter: Generated upload URL", undefined, {
        bucket: uploadBucket,
        key,
        url,
        localPath: await getFilePath(baseDir, uploadBucket, key),
      });

      return url;
    },

    async getPresignedDownloadUrl(key: string): Promise<string> {
      const url = `${baseUrl}/${cleanBucket}/${key}?download=true&expires=3600`;

      log.debug("LocalS3Adapter: Generated download URL", undefined, {
        bucket: cleanBucket,
        key,
        url,
        localPath: await getFilePath(baseDir, cleanBucket, key),
      });

      return url;
    },

    async moveDocumentFromCleanToDeleted(key: string): Promise<void> {
      const sourcePath = await getFilePath(baseDir, cleanBucket, key);
      const destPath = await getFilePath(baseDir, deletedBucket, key);

      try {
        await fs.copyFile(sourcePath, destPath);
        log.debug("LocalS3Adapter: Copied file", undefined, {
          from: sourcePath,
          to: destPath,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          log.warn(
            "LocalS3Adapter: Source file not found, skipping copy",
            undefined,
            {
              sourcePath,
            },
          );
          // For local development, we'll just create an empty file
          await fs.writeFile(destPath, "");
        } else {
          throw new Error(`Failed to copy file: ${error}`);
        }
      }

      try {
        await fs.unlink(sourcePath);
        log.debug("LocalS3Adapter: Deleted file", undefined, {
          filePath: sourcePath,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          log.warn(
            "LocalS3Adapter: File not found, skipping delete",
            undefined,
            {
              filePath: sourcePath,
            },
          );
          // File doesn't exist, which is fine for delete operation
          return;
        }
        throw new Error(`Failed to delete file: ${error}`);
      }
    },
  };
}
