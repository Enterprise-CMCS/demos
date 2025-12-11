import { Document as PrismaDocument } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { UpdateDocumentInput } from "../../../types";

export async function updateDocument(
  tx: PrismaTransactionClient,
  id: string,
  input: UpdateDocumentInput
): Promise<PrismaDocument> {
  return await tx.document.update({
    where: { id: id },
    data: {
      name: input.name,
      description: input.description,
      documentTypeId: input.documentType,
      applicationId: input.applicationId,
      phaseId: input.phaseName,
    },
  });
}
