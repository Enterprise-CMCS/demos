import { PrismaTransactionClient } from "../../prismaClient";

export async function checkTagNameDoesntAlreadyExist(
  tagName: string,
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const deliverableDocuments = await selectManyDocuments(
    { deliverableId: deliverable.id, deliverableIsCmsAttachedFile: false },
    tx
  );

  if (deliverableDocuments.length === 0) {
    return `Cannot submit deliverable ${deliverable.id} because it has no state documents attached.`;
  }
}
