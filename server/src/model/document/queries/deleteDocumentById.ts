import { Document as PrismaDocument } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";

export async function deleteDocumentById(
  tx: PrismaTransactionClient,
  documentId: string
): Promise<PrismaDocument> {
  return await tx.document.delete({
    where: { id: documentId },
  });
}
