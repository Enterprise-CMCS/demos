import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DocumentType, PhaseName } from "../constants";
import { prisma } from "../prismaClient";
import { generatePdf } from "./generatePdf";
import { faker } from "@faker-js/faker";

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

export const uploadDocumentsToPhase = async ({
  applicationId,
  documentOwnerUserId,
  phaseName,
  documentTypes,
}: {
  applicationId: string;
  documentOwnerUserId: string;
  phaseName: PhaseName;
  documentTypes: DocumentType[];
}) => {
  const name = `${applicationId} Document`;

  for (const documentType of documentTypes) {
    try {
      const documentId = faker.string.uuid();

      await prisma().document.create({
        data: {
          id: documentId,
          name: name,
          description: faker.lorem.sentence(5),
          s3Path: "tmp",
          ownerUserId: documentOwnerUserId,
          documentTypeId: documentType,
          applicationId: applicationId,
          phaseId: phaseName,
        },
      });
      const s3Path = `${applicationId}/${documentId}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.CLEAN_BUCKET,
          Key: s3Path,
          Body: await generatePdf(
            `This is an automatically generated placeholder PDF for document "${name}" of type ${documentType} for ${phaseName} phase on application ${applicationId}.`
          ),
          ContentType: "application/pdf",
        })
      );
    } catch (error) {
      console.error(`Could not seed document. ${error}`);
    }
  }
};
