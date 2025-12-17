import path from "node:path";
import os from "node:os";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { SQSEvent } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { log, reqIdChild, als, store } from "./log";
import { runDocumentUnderstanding } from "./runDocumentUnderstanding";
import { fetchQuestionPrompts } from "./db";

interface UipathMessage {
  s3Key: string;
  s3Bucket?: string;
  questions?: unknown;
}

const isLocal = () => process.env.ENVIRONMENT === "local" || process.env.RUN_LOCAL === "true";

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

async function runLocal() {
  const inputFile = process.env.INPUT_FILE ?? "ak-behavioral-health-demo-pa.pdf";
  reqIdChild("local-run");

  const status = await runDocumentUnderstanding(inputFile, {
    pollIntervalMs: 1_000,
    logFullResult: true,
  });

  log.info({ status }, "UiPath extraction completed (local)");
  return status;
}

export const handler = async (event: SQSEvent) =>
  als.run(store, async () => {
    if (isLocal()) {
      return runLocal();
    }
    log.info({ recordCount: event.Records.length }, "UiPath lambda invoked");
    const firstRecord = event.Records[0];
    reqIdChild(firstRecord?.messageId ?? "n/a");

    const parsedBody = firstRecord?.body ? (JSON.parse(firstRecord.body) as Partial<UipathMessage>) : null;
    const s3Key = parsedBody?.s3Key;
    const s3Bucket = parsedBody?.s3Bucket ?? UIPATH_DOCUMENT_BUCKET;
    if (!s3Key) {
      throw new Error("Missing s3Key in SQS message body.");
    }

    const inputFile = await downloadFromS3(s3Bucket, s3Key);
    log.info({ s3Bucket, s3Key, localPath: inputFile }, "Downloaded document from S3");

    const prompts = await fetchQuestionPrompts();
    if (prompts.length === 0) {
      throw new Error("No document understanding prompts available.");
    }

    const status = await runDocumentUnderstanding(inputFile, {
      pollIntervalMs: 5_000,
      logFullResult: false,
      prompts: prompts.length ? prompts.map((p) => ({
        id: p.id,
        question: p.question,
        fieldType: p.fieldType ?? "Text",
        multiValued: p.multiValued ?? false,
      })) : undefined,
    });

    log.info({ status }, "UiPath extraction completed");
    return status;
  });

if (isLocal()) {
  (async () => {
    await als.run(store, async () => {
      try {
        await runLocal();
      } catch (err) {
        log.error({ err });
        process.exitCode = 1;
      }
    });
  })();
}
