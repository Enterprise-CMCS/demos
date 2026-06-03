import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { DocumentType } from "../../types";

export async function selectDocumentTypesForDeliverableType(
  deliverableTypeId: string,
  tx?: PrismaTransactionClient
): Promise<DocumentType[]> {
  const prismaClient = tx ?? prisma();
  const rows = await prismaClient.deliverableTypeDocumentType.findMany({
    where: { deliverableTypeId },
    select: { documentTypeId: true },
  });
  return rows.map((row) => row.documentTypeId as DocumentType);
}
