import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Options } from "nodemailer/lib/mailer";

import { getDbPool, getDbSchema } from "./db";

type EmailAttachment = NonNullable<Options["attachments"]>[number];

type ReferenceTermsRow = {
  referenceMaterialName: string;
  referenceAgreementId: string | null;
  referenceAgreementName: string | null;
  referenceAgreementS3Path: string | null;
};

export type ReferenceTermsEmailData = {
  referenceMaterialName: string;
  referenceAgreementName: string;
  attachment: EmailAttachment;
};

const s3Client = new S3Client(
  process.env.AWS_ENDPOINT_URL
    ? {
        region: process.env.AWS_REGION || "us-east-1",
        endpoint: process.env.AWS_ENDPOINT_URL,
        forcePathStyle: true,
      }
    : { region: process.env.AWS_REGION || "us-east-1" },
);

export async function getReferenceTermsEmailData(
  referenceConfigurationId: string,
): Promise<ReferenceTermsEmailData> {
  const pool = await getDbPool();
  const schema = getDbSchema();
  const result = await pool.query(
    `
      SELECT
        reference.name AS "referenceMaterialName",
        agreement.id AS "referenceAgreementId",
        agreement.name AS "referenceAgreementName",
        agreement.s3_path AS "referenceAgreementS3Path"
      FROM ${schema}.reference_configuration AS configuration
      INNER JOIN ${schema}.reference AS reference
        ON reference.id = configuration.reference_id
      LEFT JOIN ${schema}.reference_agreement AS agreement
        ON agreement.id = configuration.reference_agreement_id
      WHERE configuration.id = $1
    `,
    [referenceConfigurationId],
  );
  const row = result.rows[0] as ReferenceTermsRow | undefined;

  if (!row) {
    throw new Error(
      `Reference configuration not found: ${referenceConfigurationId}`,
    );
  }
  if (
    !row.referenceAgreementId ||
    !row.referenceAgreementName ||
    !row.referenceAgreementS3Path
  ) {
    throw new Error(
      `Reference configuration has no agreement: ${referenceConfigurationId}`,
    );
  }

  const bucket = process.env.CLEAN_BUCKET?.trim();
  if (!bucket) {
    throw new Error(
      "CLEAN_BUCKET is required to attach reference terms and conditions.",
    );
  }

  let response;
  try {
    response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: row.referenceAgreementS3Path,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to retrieve reference agreement ${row.referenceAgreementId} from ` +
        `s3://${bucket}/${row.referenceAgreementS3Path}: ${message}`,
      { cause: error },
    );
  }

  if (!response.Body) {
    throw new Error(
      `Reference agreement file is empty: ${row.referenceAgreementS3Path}`,
    );
  }

  return {
    referenceMaterialName: row.referenceMaterialName,
    referenceAgreementName: row.referenceAgreementName,
    attachment: {
      filename: row.referenceAgreementName,
      content: Buffer.from(await response.Body.transformToByteArray()),
      contentType: response.ContentType,
    },
  };
}
