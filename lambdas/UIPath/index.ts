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
import { parseDocumentFromId, parseUiPathMessage } from "./parseDocumentFromId";
import { region } from "./uipathClient";

const s3 = new S3Client({
  region,
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true,
});

const DOCUMENT_BUCKET = "clean-bucket";

type DownloadedObject = {
  localPath: string;
};

type ResolvedS3Input = {
  s3Key: string;
  documentId?: string;
};

async function resolveS3InputFromMessage(body: string): Promise<ResolvedS3Input> {
  const parsedBody = parseUiPathMessage(body);
  const { s3Key: messageKey, documentId } = parsedBody;

  if (messageKey) {
    return {
      s3Key: messageKey,
      documentId,
    };
  }

  const documentLookup = await parseDocumentFromId(documentId);
  if (!documentLookup || !documentLookup.key) {
    throw new Error("Missing s3Key and documentId in SQS message body.");
  }

  return {
    s3Key: documentLookup.key,
    documentId,
  };
}

async function resolveUploadFileNameWithExtension(
  s3Bucket: string,
  s3Key: string,
  downloadedObject: DownloadedObject
): Promise<string> {
  const keyBaseName = path.basename(s3Key);
  const keyNameWithoutExtension = path.parse(keyBaseName).name;
  const detectedType = await fileTypeFromFile(downloadedObject.localPath);

  if (!detectedType) {
    throw new Error(`Unable to infer file extension for s3://${s3Bucket}/${s3Key} from file content.`);
  }

  return `${keyNameWithoutExtension}.${detectedType.ext}`;
}

async function downloadFromS3(bucket: string, key: string): Promise<DownloadedObject> {
  const destination = path.join(os.tmpdir(), path.basename(key));
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
    if (!firstRecord) {
      throw new Error("No SQS records provided.");
    }
    reqIdChild(firstRecord.messageId);

    const { s3Key, documentId } = await resolveS3InputFromMessage(firstRecord.body);

    const downloadedObject = await downloadFromS3(DOCUMENT_BUCKET, s3Key);
    const { localPath } = downloadedObject;
    const uploadFileNameWithExtension = await resolveUploadFileNameWithExtension(
      DOCUMENT_BUCKET,
      s3Key,
      downloadedObject
    );
    log.info(
      { s3Bucket: DOCUMENT_BUCKET, s3Key, localPath, uploadFileNameWithExtension },
      "Downloaded document from S3"
    );

    const status = await runDocumentUnderstanding(localPath, {
      pollIntervalMs: 5000,
      requestId: firstRecord.messageId,
      fileNameWithExtension: uploadFileNameWithExtension,
      documentId,
    });

    log.info("UiPath extraction completed successfully");
    return status;
  }
);
