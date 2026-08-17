import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Options } from "nodemailer/lib/mailer";

type EmailAttachment = NonNullable<Options["attachments"]>[number];

const s3Client = new S3Client(
  process.env.AWS_ENDPOINT_URL
    ? {
        region: process.env.AWS_REGION || "us-east-1",
        endpoint: process.env.AWS_ENDPOINT_URL,
        forcePathStyle: true,
      }
    : { region: process.env.AWS_REGION || "us-east-1" },
);

export async function buildReferenceTermsAttachment(
  payload: unknown,
): Promise<EmailAttachment> {
  const termsAndConditions = getTermsAndConditions(payload);
  const bucket = process.env.CLEAN_BUCKET?.trim();
  if (!bucket) {
    throw new Error(
      "CLEAN_BUCKET is required to attach reference terms and conditions.",
    );
  }

  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: termsAndConditions.s3Path,
    }),
  );
  if (!response.Body) {
    throw new Error(
      `Reference terms and conditions file is empty: ${termsAndConditions.s3Path}`,
    );
  }

  return {
    filename: termsAndConditions.fileName,
    content: Buffer.from(await response.Body.transformToByteArray()),
    contentType: response.ContentType,
  };
}

function getTermsAndConditions(payload: unknown): {
  fileName: string;
  s3Path: string;
} {
  if (!payload || typeof payload !== "object") {
    throw new Error("Reference terms email payload is required.");
  }

  const termsAndConditions = (payload as Record<string, unknown>)
    .termsAndConditions;
  if (!termsAndConditions || typeof termsAndConditions !== "object") {
    throw new Error(
      "Reference terms email payload is missing termsAndConditions.",
    );
  }

  const { fileName, s3Path } = termsAndConditions as Record<string, unknown>;
  if (typeof fileName !== "string" || !fileName.trim()) {
    throw new Error(
      "Reference terms email payload is missing termsAndConditions.fileName.",
    );
  }
  if (typeof s3Path !== "string" || !s3Path.trim()) {
    throw new Error(
      "Reference terms email payload is missing termsAndConditions.s3Path.",
    );
  }

  return { fileName, s3Path };
}
