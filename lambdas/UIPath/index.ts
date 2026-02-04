import path from "node:path";
import os from "node:os";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { SQSEvent } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { log, reqIdChild, als, store } from "./log";
import { runDocumentUnderstanding } from "./runDocumentUnderstanding";

interface UipathMessage {
  s3FileName: string;
  s3Bucket?: string;
  modelGuid?: string;
}

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true,
});

const UIPATH_DOCUMENT_BUCKET = process.env.UIPATH_DOCUMENT_BUCKET ?? "uipath-documents";

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

    const parsedBody = firstRecord?.body ? (JSON.parse(firstRecord.body) as Partial<UipathMessage>) : null;
    const s3FileName = parsedBody?.s3FileName;
    const s3Bucket = parsedBody?.s3Bucket ?? UIPATH_DOCUMENT_BUCKET;
    if (!s3FileName) {
      throw new Error("Missing s3FileName in SQS message body.");
    }

    const inputFile = await downloadFromS3(s3Bucket, s3FileName);
    log.info({ s3Bucket, s3FileName, localPath: inputFile }, "Downloaded document from S3");

    const status = await runDocumentUnderstanding(inputFile, {
      pollIntervalMs: 5_000,
      logFullResult: false,
      requestId: firstRecord?.messageId ?? "n/a",
    });

    log.info({ status }, "UiPath extraction completed");
    return status;
  }
);
