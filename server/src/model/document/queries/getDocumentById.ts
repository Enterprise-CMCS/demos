import { Document as PrismaDocument } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";

export async function getDocumentById(
  tx: PrismaTransactionClient,
  documentId: string
): Promise<PrismaDocument | null> {
  return await tx.document.findUnique({
    where: { id: documentId },
  });
}
