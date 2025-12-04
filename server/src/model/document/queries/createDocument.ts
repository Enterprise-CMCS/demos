import { Document as PrismaDocument } from "@prisma/client";
import { UploadDocumentInput } from "../documentSchema";
import { PrismaTransactionClient } from "../../../prismaClient";

export async function createDocument(
  tx: PrismaTransactionClient,
  input: UploadDocumentInput,
  ownerUserId: string,
  documentId: string,
  s3Path: string
): Promise<PrismaDocument> {
  return await tx.document.create({
    data: {
      id: documentId,
      name: input.name,
      description: input.description ?? "",
      ownerUserId: ownerUserId,
      documentTypeId: input.documentType,
      applicationId: input.applicationId,
      phaseId: input.phaseName,
      s3Path,
    },
  });
}
