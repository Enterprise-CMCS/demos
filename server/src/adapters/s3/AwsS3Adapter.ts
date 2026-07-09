import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { create as createContentDisposition } from "content-disposition";
import { extension as extensionForContentType } from "mime-types";
import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { CleanBucketObject, GetPresignedDownloadUrlOptions, S3Adapter } from "../";
import { sanitizeDownloadFileName } from "./sanitizeDownloadFileName";
import { Prisma, DocumentPendingUpload as PrismaDocumentPendingUpload } from "@prisma/client";

const EXPIRATION_TIME_SECONDS = 10;

const createS3Client = () => {
  const endpoint = process.env.S3_ENDPOINT_LOCAL;
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

/** Maps the object's stored S3 Content-Type to a file extension (e.g. "pdf"), or "" if unknown. */
async function getExtensionForObject(
  s3Client: S3Client,
  bucket: string,
  key: string
): Promise<string> {
  const head = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  const contentType = head.ContentType ?? "";
  return contentType ? extensionForContentType(contentType) || "" : "";
}

/** Builds a Content-Disposition with a sanitized name plus the extension derived from Content-Type. */
async function buildContentDisposition(
  s3Client: S3Client,
  bucket: string,
  key: string,
  fileName: string,
  options?: GetPresignedDownloadUrlOptions
): Promise<string> {
  const safeName = sanitizeDownloadFileName(fileName, key.split("/").pop() ?? key);

  const extension = await getExtensionForObject(s3Client, bucket, key);
  const finalName = extension ? `${safeName}.${extension}` : safeName;

  return createContentDisposition(finalName, { type: options?.disposition ?? "inline" });
}

/**
 * Creates an AWS S3 adapter that uses the AWS SDK to interact with S3 buckets.
 * Automatically configures the S3Client and bucket names based on environment variables.
 */
export function createAWSS3Adapter(): S3Adapter {
  const s3Client = createS3Client();

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

    async getPresignedDownloadUrl(
      key: string,
      fileName?: string,
      options?: GetPresignedDownloadUrlOptions
    ): Promise<string> {
      const getObjectCommand = new GetObjectCommand({
        Bucket: cleanBucket,
        Key: key,
        ResponseContentDisposition: fileName
          ? await buildContentDisposition(s3Client, cleanBucket, key, fileName, options)
          : undefined,
      });
      return await getSignedUrl(s3Client, getObjectCommand, {
        expiresIn: EXPIRATION_TIME_SECONDS,
      });
    },

    async getCleanBucketObject(key: string): Promise<CleanBucketObject> {
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: cleanBucket, Key: key })
      );
      if (!response.Body) {
        throw new Error(`Object ${key} in the clean bucket has no body.`);
      }
      return {
        bytes: await response.Body.transformToByteArray(),
        contentType: response.ContentType ?? "",
      };
    },

    async putCleanBucketObject(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: cleanBucket,
          Key: key,
          Body: bytes,
          // Kept so the download URL can still derive the file extension from it.
          ContentType: contentType || undefined,
        })
      );
    },

    async moveDocumentFromCleanToDeleted(key: string): Promise<void> {
      try {
        const copyResponse = await s3Client.send(
          new CopyObjectCommand({
            CopySource: `${process.env.CLEAN_BUCKET}/${key}`,
            Bucket: deletedBucket,
            Key: key,
          })
        );
        if (
          !copyResponse.$metadata.httpStatusCode ||
          copyResponse.$metadata.httpStatusCode !== 200
        ) {
          throw new Error(
            `Response from copy operation returned with a non-200 status: ${copyResponse.$metadata.httpStatusCode}`
          );
        }
      } catch (error) {
        throw new Error(`Error while copying document to deleted bucket: ${error}`);
      }

      try {
        const deleteResponse = await s3Client.send(
          new DeleteObjectCommand({
            Bucket: cleanBucket,
            Key: key,
          })
        );
        if (
          !deleteResponse.$metadata.httpStatusCode ||
          (deleteResponse.$metadata.httpStatusCode !== 200 &&
            deleteResponse.$metadata.httpStatusCode !== 204)
        ) {
          throw new Error(
            `Response from delete operation returned with a non-200 status: ${deleteResponse.$metadata.httpStatusCode}`
          );
        }
      } catch (error) {
        throw new Error(`Failed to delete document from clean bucket: ${error}`);
      }
    },

    async uploadDocument(
      documentData: Prisma.DocumentPendingUploadCreateArgs["data"],
      tx?: PrismaTransactionClient
    ): Promise<PrismaDocumentPendingUpload> {
      return tx
        ? tx.documentPendingUpload.create({
            data: documentData,
          })
        : prisma().$transaction((transaction) =>
            transaction.documentPendingUpload.create({
              data: documentData,
            })
          );
    },

    async uploadOnDemandReport(reportId: string, reportFileData: Buffer): Promise<string> {
      const key = `reports/on-demand/${reportId}.xlsx`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: cleanBucket,
          Key: key,
          Body: reportFileData,
          ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      );

      return key;
    },

    async deleteOnDemandReport(reportId: string): Promise<string> {
      const key = `reports/on-demand/${reportId}.xlsx`;

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: cleanBucket,
          Key: key,
        })
      );

      return key;
    },
  };
}
