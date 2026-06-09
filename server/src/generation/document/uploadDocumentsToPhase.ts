import { DocumentType, PhaseName } from "../../constants";
import { createAndUploadFileToS3 } from "./createAndUploadFileToS3";
import { DocumentsInput } from "../types";
import { prisma } from "../../prismaClient";
import { faker } from "@faker-js/faker";

/*
 * Manually uploading documents takes too long, so this bypasses the procedure by uploading to the s3 clean bucket directly
 */
export const uploadDocumentsToPhase = async <TDocumentType extends DocumentType>({
  documents,
  applicationId,
  phaseName,
  ownerUserId,
}: {
  documents: DocumentsInput<TDocumentType>;
  applicationId: string;
  phaseName: PhaseName;
  ownerUserId: string;
}) => {
  for (const documentType in documents) {
    await prisma().$transaction(async (tx) => {
      const documentId = faker.string.uuid();
      const document = await tx.document.create({
        data: {
          id: documentId,
          name: documents[documentType].name,
          description: documents[documentType].description,
          documentTypeId: documentType as DocumentType,
          applicationId,
          ownerUserId,
          s3Path: `${applicationId}/${documentId}`,
          phaseId: phaseName,
        },
      });

      await createAndUploadFileToS3({
        s3Path: document.s3Path,
        fileContentText: documents[documentType].documentContentText,
      });
    });
  }
};
