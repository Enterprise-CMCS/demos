import path from "node:path";
import os from "node:os";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { GetObjectCommand, S3Client, type GetObjectCommandOutput } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true,
});

export type ResolvedS3Location = {
  bucket: string;
  key: string;
};

export function resolveS3Location(s3Path: string): ResolvedS3Location {
  if (s3Path.startsWith("s3://")) {
    const pathWithoutScheme = s3Path.slice(5);
    const separatorIndex = pathWithoutScheme.indexOf("/");
    if (separatorIndex <= 0 || separatorIndex === pathWithoutScheme.length - 1) {
      throw new Error(`Invalid document s3_path value: ${s3Path}`);
    }

    return {
      bucket: pathWithoutScheme.slice(0, separatorIndex),
      key: pathWithoutScheme.slice(separatorIndex + 1),
    };
  }

  const bucket = process.env.CLEAN_BUCKET ?? "clean-bucket";
  return {
    bucket,
    key: s3Path.replace(/^\/+/, ""),
  };
}

export async function downloadDocumentFromS3(s3Path: string): Promise<string> {
  const { bucket, key } = resolveS3Location(s3Path);
  const destination = path.join(os.tmpdir(), path.basename(key));
  const response: GetObjectCommandOutput = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  const { Body } = response;
  if (!Body) {
    throw new Error(`No body returned when fetching s3://${bucket}/${key}`);
  }

  await pipeline(Body as Readable, createWriteStream(destination));
  return destination;
}
