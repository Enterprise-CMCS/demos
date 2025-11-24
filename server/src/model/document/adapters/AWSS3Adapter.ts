import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Adapter } from "./S3Adapter.js";

const LOCAL_SIMPLE_UPLOAD_ENDPOINT = "http://localhost:4566";

/**
 * Resolve the S3 endpoint based on environment variables
 */
const resolveS3Endpoint = (): string | undefined => {
  if (process.env.LOCAL_SIMPLE_UPLOAD === "true") {
    return LOCAL_SIMPLE_UPLOAD_ENDPOINT;
  }
  return process.env.S3_ENDPOINT_LOCAL;
};

/**
 * Create an S3Client configured for the current environment
 */
const createS3Client = (): S3Client => {
  const endpoint = resolveS3Endpoint();
  const s3ClientConfig = endpoint
    ? {
        region: "us-east-1",
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test", // pragma: allowlist secret
        },
      }
    : {};

  return new S3Client(s3ClientConfig);
};

/**
 * Creates an AWS S3 adapter that uses the AWS SDK to interact with S3 buckets.
 * Automatically configures the S3Client and bucket names based on environment variables.
 *
 * @returns S3Adapter implementation
 */
export function createAWSS3Adapter(): S3Adapter {
  const s3Client = createS3Client();

  const uploadBucket = process.env.UPLOAD_BUCKET;
  const cleanBucket = process.env.CLEAN_BUCKET;
  const deletedBucket = process.env.DELETED_BUCKET;

  if (!uploadBucket) {
    throw new Error("UPLOAD_BUCKET environment variable is required");
  }
  if (!cleanBucket) {
    throw new Error("CLEAN_BUCKET environment variable is required");
  }
  if (!deletedBucket) {
    throw new Error("DELETED_BUCKET environment variable is required");
  }

  return {
    async getPresignedUploadUrl(
      key: string,
      expiresIn: number,
    ): Promise<string> {
      const command = new PutObjectCommand({
        Bucket: uploadBucket,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn });
    },

    async getPresignedDownloadUrl(
      key: string,
      expiresIn: number,
    ): Promise<string> {
      const command = new GetObjectCommand({
        Bucket: cleanBucket,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn });
    },

    async moveDocumentFromCleanToDeleted(key: string): Promise<void> {
      try {
        const copyResponse = await s3Client.send(
          new CopyObjectCommand({
            CopySource: `${cleanBucket}/${key}`,
            Bucket: deletedBucket,
            Key: key,
          }),
        );

        if (
          !copyResponse.$metadata.httpStatusCode ||
          copyResponse.$metadata.httpStatusCode !== 200
        ) {
          throw new Error(
            `Response from copy operation returned with a non-200 status: ${copyResponse.$metadata.httpStatusCode}`,
          );
        }
      } catch (error) {
        throw new Error(
          `Error while copying document to deleted bucket: ${error}`,
        );
      }

      try {
        const deleteResponse = await s3Client.send(
          new DeleteObjectCommand({
            Bucket: cleanBucket,
            Key: key,
          }),
        );

        if (
          !deleteResponse.$metadata.httpStatusCode ||
          (deleteResponse.$metadata.httpStatusCode !== 200 &&
            deleteResponse.$metadata.httpStatusCode !== 204)
        ) {
          throw new Error(
            `Response from delete operation returned with a non-200 status: ${deleteResponse.$metadata.httpStatusCode}`,
          );
        }
      } catch (error) {
        throw new Error(
          `Failed to delete document from clean bucket: ${error}`,
        );
      }
    },
  };
}
