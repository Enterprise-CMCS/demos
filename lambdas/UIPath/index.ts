import path from "node:path";
import os from "node:os";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { SQSEvent } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
  fileNameWithExtension?: string;
};

function decodeS3Key(key: string): string {
  return decodeURIComponent(key.replace(/\+/g, " "));
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
  const fileNameWithExtension = parsed?.fileNameWithExtension as string | undefined;

  return { s3Bucket, s3Key: s3Key ?? "", fileNameWithExtension };
}

async function downloadFromS3(bucket: string, key: string): Promise<string> {
  const destination = path.join(os.tmpdir(), path.basename(key) || "uipath-document");
  const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!Body) {
    throw new Error(`No body returned when fetching s3://${bucket}/${key}`);
  }

  await pipeline(Body as Readable, createWriteStream(destination));
  return destination;
}

export const handler = async (event: SQSEvent) =>
  als.run(store, async () => {
    log.info({ recordCount: event.Records.length }, "UiPath lambda invoked");
    const firstRecord = event.Records[0];
    reqIdChild(firstRecord?.messageId ?? "n/a");

    const parsedBody = firstRecord?.body ? parseUiPathMessage(firstRecord.body) : null;
    const s3Bucket = parsedBody?.s3Bucket ?? UIPATH_DOCUMENT_BUCKET;
    const s3Key = parsedBody?.s3Key;
    const fileNameWithExtension = parsedBody?.fileNameWithExtension;

    if (!s3Key) {
      throw new Error("Missing s3Key/s3FileName in SQS message body.");
    }

    const inputFile = await downloadFromS3(s3Bucket, s3Key);
    log.info({ s3Bucket, s3Key, localPath: inputFile }, "Downloaded document from S3");

    const status = await runDocumentUnderstanding(inputFile, {
      pollIntervalMs: 5_000,
      logFullResult: false,
      requestId: firstRecord?.messageId ?? "n/a",
      fileNameWithExtension,
    });

    log.info({ status }, "UiPath extraction completed");
    return status;
  }
);
