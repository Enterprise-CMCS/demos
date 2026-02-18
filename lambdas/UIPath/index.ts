import path from "node:path";
import os from "node:os";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { SQSEvent } from "aws-lambda";
import { GetObjectCommand, S3Client, type GetObjectCommandOutput } from "@aws-sdk/client-s3";
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

type DownloadedObject = {
  localPath: string;
  contentType?: string;
  contentDisposition?: string;
  metadata?: Record<string, string>;
};

// Exact same one as in constants, not sure if i have access to that file.
const CONTENT_TYPE_TO_EXTENSION: Readonly<Record<string, string>> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/plain": ".txt",
  "application/rtf": ".rtf",
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
  const fileNameWithExtension = parsed?.fileNameWithExtension as string | undefined;

  return { s3Bucket, s3Key: s3Key ?? "", fileNameWithExtension };
}

/**
 * Extracts the file extension from a given file name.
 * But in our code we do not store the file name with an extension, but JIC this changes. we got it covered.
 * @param fileName
 * @returns
 */
function extensionFromFileName(fileName?: string): string | null {
  if (!fileName) return null;
  const ext = path.extname(fileName).trim();
  return ext ?? null;
}

function extensionFromContentType(contentType?: string): string | null {
  if (!contentType) return null;
  const normalized = contentType.toLowerCase().split(";")[0].trim();
  return CONTENT_TYPE_TO_EXTENSION[normalized] ?? null;
}

function extractFileNameFromContentDisposition(contentDisposition?: string): string | null {
  if (!contentDisposition) return null;

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const simpleMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return simpleMatch?.[1] ?? null;
}

function resolveUploadFileNameWithExtension(
  s3Key: string,
  downloadedObject: DownloadedObject,
  providedFileNameWithExtension?: string
): string | undefined {
  if (providedFileNameWithExtension?.trim()) {
    return providedFileNameWithExtension.trim();
  }

  const keyBaseName = path.basename(s3Key) || "uipath-document";
  if (extensionFromFileName(keyBaseName)) {
    return keyBaseName;
  }

  const metadata = downloadedObject.metadata ?? {};
  const metadataFileName =
    metadata.filename ??
    metadata["file-name"] ??
    metadata.originalfilename ??
    metadata["original-file-name"];

  const inferredExtension =
    extensionFromFileName(metadataFileName) ??
    extensionFromFileName(
      extractFileNameFromContentDisposition(downloadedObject.contentDisposition)
    ) ??
    extensionFromContentType(downloadedObject.contentType);

  return inferredExtension ? `${keyBaseName}${inferredExtension}` : undefined;
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
    contentType: response.ContentType,
    contentDisposition: response.ContentDisposition,
    metadata: response.Metadata,
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
    const fileNameWithExtension = parsedBody?.fileNameWithExtension;

    if (!s3Key) {
      throw new Error("Missing s3Key/s3FileName in SQS message body.");
    }

    const downloadedObject = await downloadFromS3(s3Bucket, s3Key);
    const { localPath } = downloadedObject;
    const uploadFileNameWithExtension = resolveUploadFileNameWithExtension(
      s3Key,
      downloadedObject,
      fileNameWithExtension
    );
    log.info(
      { s3Bucket, s3Key, localPath, uploadFileNameWithExtension },
      "Downloaded document from S3"
    );

    const status = await runDocumentUnderstanding(localPath, {
      pollIntervalMs: 5_000,
      logFullResult: false,
      requestId: firstRecord?.messageId ?? "n/a",
      fileNameWithExtension: uploadFileNameWithExtension,
    });

    log.info({ status }, "UiPath extraction completed");
    return status;
  }
);
