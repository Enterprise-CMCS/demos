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
  return {
    async getPresignedUploadUrl(
      bucket: string,
      key: string,
      expiresIn: number,
    ): Promise<string> {
      const url = `${baseUrl}/${bucket}/${key}?upload=true&expires=${expiresIn}`;

      log.debug("LocalS3Adapter: Generated upload URL", undefined, {
        bucket,
        key,
        url,
        localPath: await getFilePath(baseDir, bucket, key),
      });

      return url;
    },

    async getPresignedDownloadUrl(
      bucket: string,
      key: string,
      expiresIn: number,
    ): Promise<string> {
      const url = `${baseUrl}/${bucket}/${key}?download=true&expires=${expiresIn}`;

      log.debug("LocalS3Adapter: Generated download URL", undefined, {
        bucket,
        key,
        url,
        localPath: await getFilePath(baseDir, bucket, key),
      });

      return url;
    },

    async copyObject(
      sourceBucket: string,
      sourceKey: string,
      destBucket: string,
      destKey: string,
    ): Promise<void> {
      const sourcePath = await getFilePath(baseDir, sourceBucket, sourceKey);
      const destPath = await getFilePath(baseDir, destBucket, destKey);

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
    },

    async deleteObject(bucket: string, key: string): Promise<void> {
      const filePath = await getFilePath(baseDir, bucket, key);

      try {
        await fs.unlink(filePath);
        log.debug("LocalS3Adapter: Deleted file", undefined, { filePath });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          log.warn(
            "LocalS3Adapter: File not found, skipping delete",
            undefined,
            {
              filePath,
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
