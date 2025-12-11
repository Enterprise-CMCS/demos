import { DocumentPendingUpload as PrismaDocumentPendingUpload } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { UploadDocumentInput } from "../../document/documentSchema";

export async function createDocumentPendingUpload(
  tx: PrismaTransactionClient,
  input: UploadDocumentInput,
  ownerUserId: string
): Promise<PrismaDocumentPendingUpload> {
  return await tx.documentPendingUpload.create({
    data: {
      name: input.name,
      description: input.description,
      ownerUserId: ownerUserId,
      documentTypeId: input.documentType,
      applicationId: input.applicationId,
      phaseId: input.phaseName,
    },
  });
}
