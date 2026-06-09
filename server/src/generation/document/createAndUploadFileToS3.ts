import { generatePdf } from "./generatePdf";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client(
  process.env.S3_ENDPOINT_LOCAL
    ? {
        region: "us-east-1",
        endpoint: process.env.S3_ENDPOINT_LOCAL,
        forcePathStyle: true,
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test", // pragma: allowlist secret
        },
      }
    : {}
);

export const createAndUploadFileToS3 = async ({
  s3Path,
  fileContentText,
}: {
  s3Path: string;
  fileContentText: string;
}) => {
  const file = await generatePdf(fileContentText);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.CLEAN_BUCKET,
      Key: s3Path,
      Body: file,
    })
  );
};
