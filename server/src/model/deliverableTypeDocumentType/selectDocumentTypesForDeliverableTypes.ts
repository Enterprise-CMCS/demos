import { prisma, PrismaTransactionClient } from "../../prismaClient";

export interface DeliverableTypeDocumentTypeRow {
  deliverableTypeId: string;
  documentTypeId: string;
}

/**
 * Batched sibling of {@link selectDocumentTypesForDeliverableType}: returns the
 * allowed document types for many deliverable types in a single query. Each row
 * carries its `deliverableTypeId` so callers (DataLoaders) can group the results
 * back to the key that requested them.
 */
export async function selectDocumentTypesForDeliverableTypes(
  deliverableTypeIds: string[],
  tx?: PrismaTransactionClient
): Promise<DeliverableTypeDocumentTypeRow[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.deliverableTypeDocumentType.findMany({
    where: { deliverableTypeId: { in: deliverableTypeIds } },
    select: { deliverableTypeId: true, documentTypeId: true },
  });
}
