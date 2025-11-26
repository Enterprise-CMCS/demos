import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Adapter } from "./S3Adapter.js";

const LOCALSTACK_ENDPOINT = "http://localhost:4566";
const EXPIRATION_TIME_SECONDS = 3600; // 1 hour in seconds
const REQUIRED_ENV_VARS = ["UPLOAD_BUCKET", "CLEAN_BUCKET", "DELETED_BUCKET"];

const createS3Client = (): S3Client => {
  const endpoint = process.env.S3_ENDPOINT_LOCAL ?? LOCALSTACK_ENDPOINT;
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

const assertEnvironmentVariablesSet = (): void => {
  const missingVars = REQUIRED_ENV_VARS.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }
};

/**
 * Creates an AWS S3 adapter that uses the AWS SDK to interact with S3 buckets.
 * Automatically configures the S3Client and bucket names based on environment variables.
 *
 * @returns S3Adapter implementation
 */
export function createAWSS3Adapter(): S3Adapter {
  const s3Client = createS3Client();

  assertEnvironmentVariablesSet();

  const uploadBucket = process.env.UPLOAD_BUCKET!;
  const cleanBucket = process.env.CLEAN_BUCKET!;
  const deletedBucket = process.env.DELETED_BUCKET!;

  return {
    async getPresignedUploadUrl(key: string): Promise<string> {
      const command = new PutObjectCommand({
        Bucket: uploadBucket,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, {
        expiresIn: EXPIRATION_TIME_SECONDS,
      });
    },

    async getPresignedDownloadUrl(key: string): Promise<string> {
      const command = new GetObjectCommand({
        Bucket: cleanBucket,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, {
        expiresIn: EXPIRATION_TIME_SECONDS,
      });
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
