import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import type { WrittenFile } from "../types";
import { successKey } from "../util/keys";

const awsClientConfig = {
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL,
};

export const s3 = new S3Client(
  process.env.AWS_ENDPOINT_URL ? { ...awsClientConfig, forcePathStyle: true } : awsClientConfig
);

// Read lazily, not at module scope, so a test can set the variable after importing this module.
function exportBucket(): string {
  const bucket = process.env.EXPORT_BUCKET;
  if (!bucket) {
    throw new Error("EXPORT_BUCKET is required to publish the export.");
  }
  return bucket;
}

export async function uploadParquet(localPath: string, key: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: exportBucket(),
      Key: key,
      Body: createReadStream(localPath),
      ContentLength: (await stat(localPath)).size,
      ContentType: "application/vnd.apache.parquet",
    })
  );
}

export async function uploadSuccessMarker(runDate: Date, written: WrittenFile[]): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: exportBucket(),
      Key: successKey(runDate),
      Body: JSON.stringify(
        {
          runDate: runDate.toISOString(),
          relations: written.map(({ relation, rowCount }) => ({ relation, rowCount })),
        },
        null,
        2
      ),
      ContentType: "application/json",
    })
  );
}
