import path from "node:path";
import os from "node:os";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { SQSEvent } from "aws-lambda";
import { GetObjectCommand, S3Client, type GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { fileTypeFromFile } from "file-type";
import { log, reqIdChild, als, store } from "./log";
import { runDocumentUnderstanding } from "./runDocumentUnderstanding";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true,
});

const UIPATH_DOCUMENT_BUCKET = process.env.UIPATH_DOCUMENT_BUCKET ?? "uipath-documents";

type UipathMessage = {
  s3Bucket: string;
  s3Key: string;
  documentId?: string;
};

type DownloadedObject = {
  localPath: string;
};

function decodeS3Key(key: string): string {
  return decodeURIComponent(key.replaceAll("+", " "));
}

function parseUiPathMessage(body: string): UipathMessage {
  const parsed = JSON.parse(body) as Record<string, unknown>;
  const records = parsed?.Records as Array<any> | undefined;

  if (Array.isArray(records) && records[0]?.s3?.bucket?.name && records[0]?.s3?.object?.key) {
    const record = records[0];
    return {
      s3Bucket: record.s3.bucket.name,
      s3Key: decodeS3Key(record.s3.object.key),
    };
  }

  const s3Key = (parsed?.s3Key as string | undefined) ?? (parsed?.s3FileName as string | undefined);
  const s3Bucket = (parsed?.s3Bucket as string | undefined) ?? UIPATH_DOCUMENT_BUCKET;
  const documentId = parsed?.documentId as string | undefined;

  return { s3Bucket, s3Key: s3Key ?? "", documentId };
}

async function resolveUploadFileNameWithExtension(
  s3Bucket: string,
  s3Key: string,
  downloadedObject: DownloadedObject
): Promise<string> {
  const keyBaseName = path.basename(s3Key) || "uipath-document";
  const keyNameWithoutExtension = path.parse(keyBaseName).name || "uipath-document";
  const detectedType = await fileTypeFromFile(downloadedObject.localPath);

  if (!detectedType) {
    throw new Error(`Unable to infer file extension for s3://${s3Bucket}/${s3Key} from file content.`);
  }

  return `${keyNameWithoutExtension}.${detectedType.ext}`;
}

async function downloadFromS3(bucket: string, key: string): Promise<DownloadedObject> {
  const destination = path.join(os.tmpdir(), path.basename(key) || "uipath-document");
  const response: GetObjectCommandOutput = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  const { Body } = response;
  if (!Body) {
    throw new Error(`No body returned when fetching s3://${bucket}/${key}`);
  }

  await pipeline(Body as Readable, createWriteStream(destination));
  return {
    localPath: destination,
  };
}

export const handler = async (event: SQSEvent) =>
  als.run(store, async () => {
    log.info({ recordCount: event.Records.length }, "UiPath lambda invoked");
    const firstRecord = event.Records[0];
    reqIdChild(firstRecord?.messageId ?? "n/a");

    const parsedBody = firstRecord?.body ? parseUiPathMessage(firstRecord.body) : null;
    const s3Bucket = parsedBody?.s3Bucket ?? UIPATH_DOCUMENT_BUCKET;
    const s3Key = parsedBody?.s3Key;
    const documentId = parsedBody?.documentId;

    if (!s3Key) {
      throw new Error("Missing s3Key/s3FileName in SQS message body.");
    }

    const downloadedObject = await downloadFromS3(s3Bucket, s3Key);
    const { localPath } = downloadedObject;
    const uploadFileNameWithExtension = await resolveUploadFileNameWithExtension(
      s3Bucket,
      s3Key,
      downloadedObject
    );
    log.info(
      { s3Bucket, s3Key, localPath, uploadFileNameWithExtension },
      "Downloaded document from S3"
    );

    const status = await runDocumentUnderstanding(localPath, {
      pollIntervalMs: 5_000,
      requestId: firstRecord?.messageId ?? "n/a",
      fileNameWithExtension: uploadFileNameWithExtension,
      documentId,
    });

    log.info({ status }, "UiPath extraction completed");
    return status;
  }
);
