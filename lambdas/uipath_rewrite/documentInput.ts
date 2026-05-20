import path from "node:path";
import os from "node:os";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { GetObjectCommand, S3Client, type GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { fileTypeFromFile } from "file-type";
import { AWS_REGION, getCleanBucket } from "./config";
import { getDbPool, getDbSchema } from "./db";
import { log } from "./log";

type UiPathMessage = {
  s3Key?: string;
  documentId?: string;
  applicationId?: string;
};

type DocumentRow = {
  id: string;
  application_id: string;
  s3_path: string;
};

type DocumentS3Location = {
  key: string;
  documentId: string;
  applicationId: string;
};

export type PreparedDocumentInput = {
  s3Bucket: string;
  s3Key: string;
  localPath: string;
  uploadFileNameWithExtension: string;
  documentId: string;
  applicationId: string;
};

const s3 = new S3Client({
  region: AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true
});

function decodeS3Key(key: string): string {
  return decodeURIComponent(key.replaceAll("+", " "));
}

function parseUiPathMessage(body: string): UiPathMessage {
  const parsed = JSON.parse(body) as Record<string, unknown>;
  const records = parsed?.Records as Array<any> | undefined;

  if (Array.isArray(records) && records[0]?.s3?.object?.key) {
    const record = records[0];
    return {
      s3Key: decodeS3Key(record.s3.object.key)
    };
  }

  const message: UiPathMessage = {};
  if (typeof parsed.s3Key === "string") {
    message.s3Key = parsed.s3Key;
  }
  if (typeof parsed.documentId === "string") {
    message.documentId = parsed.documentId;
  }
  if (typeof parsed.applicationId === "string") {
    message.applicationId = parsed.applicationId;
  }

  return message;
}

function parseDocumentS3Path(s3Path: string): { key: string } {
  if (s3Path.startsWith("s3://")) {
    const pathWithoutScheme = s3Path.slice(5);
    const separatorIndex = pathWithoutScheme.indexOf("/");
    if (separatorIndex <= 0 || separatorIndex === pathWithoutScheme.length - 1) {
      throw new Error(`Invalid document s3_path value: ${s3Path}`);
    }

    return {
      key: pathWithoutScheme.slice(separatorIndex + 1)
    };
  }

  return { key: s3Path.replace(/^\/+/, "") };
}

async function resolveDocumentLocation(
  documentId: string,
  expectedApplicationId?: string
): Promise<DocumentS3Location> {
  const pool = await getDbPool();
  const result = await pool.query<DocumentRow>(
    `select id, application_id, s3_path from ${getDbSchema()}.document where id = $1 limit 1;`,
    [documentId]
  );

  const row = result.rows[0];
  if (!row?.s3_path) {
    throw new Error(`No document found for id ${documentId}.`);
  }

  if (expectedApplicationId && row.application_id !== expectedApplicationId) {
    throw new Error(
      `Document ${documentId} is associated with application ${row.application_id}, not ${expectedApplicationId}.`
    );
  }

  return {
    ...parseDocumentS3Path(row.s3_path),
    documentId: row.id,
    applicationId: row.application_id
  };
}

async function downloadFromS3(bucket: string, key: string): Promise<string> {
  const destination = path.join(os.tmpdir(), path.basename(key));
  const response: GetObjectCommandOutput = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  if (!response.Body) {
    throw new Error(`No body returned when fetching s3://${bucket}/${key}`);
  }

  await pipeline(response.Body as Readable, createWriteStream(destination));
  return destination;
}

async function getUploadFileName(s3Bucket: string, s3Key: string, localPath: string): Promise<string> {
  const keyBaseName = path.basename(s3Key);
  const keyNameWithoutExtension = path.parse(keyBaseName).name;
  const detectedType = await fileTypeFromFile(localPath);

  if (!detectedType) {
    throw new Error(`Unable to infer file extension for s3://${s3Bucket}/${s3Key} from file content.`);
  }

  return `${keyNameWithoutExtension}.${detectedType.ext}`;
}

export async function prepareDocumentInput(messageBody: string): Promise<PreparedDocumentInput> {
  const message = parseUiPathMessage(messageBody);
  if (!message.documentId) {
    throw new Error("Missing documentId in SQS message body.");
  }

  const s3Bucket = getCleanBucket();
  const location = await resolveDocumentLocation(message.documentId, message.applicationId);
  const localPath = await downloadFromS3(s3Bucket, location.key);
  const uploadFileNameWithExtension = await getUploadFileName(s3Bucket, location.key, localPath);

  log.info(
    {
      s3Bucket,
      s3Key: location.key,
      localPath,
      uploadFileNameWithExtension
    },
    "Downloaded document from S3"
  );

  return {
    s3Bucket,
    s3Key: location.key,
    localPath,
    uploadFileNameWithExtension,
    documentId: location.documentId,
    applicationId: location.applicationId
  };
}
