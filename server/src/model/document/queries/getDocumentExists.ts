import { PrismaTransactionClient } from "../../../prismaClient";

export async function getDocumentExists(
  tx: PrismaTransactionClient,
  documentId: string
): Promise<boolean> {
  const document = await tx.document.findUnique({
    where: { id: documentId },
  });

  if (document) return true;
  return false;
}
