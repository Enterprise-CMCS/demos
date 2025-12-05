import { Document as PrismaDocument } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";

export async function getDocumentById(
  tx: PrismaTransactionClient,
  documentId: string
): Promise<PrismaDocument> {
  return await tx.document.findUniqueOrThrow({
    where: { id: documentId },
  });
}
