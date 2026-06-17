import { FINAL_DELIVERABLE_STATUSES, FinalDeliverableStatus } from "../../constants";
import { prisma } from "../../prismaClient";

export async function validateDocumentCanBeUpdated(documentId: string) {
  const document = await prisma().document.findUniqueOrThrow({
    where: { id: documentId },
    select: {
      deliverable: true,
    },
  });

  if (document.deliverable) {
    if (
      FINAL_DELIVERABLE_STATUSES.includes(document.deliverable.statusId as FinalDeliverableStatus)
    ) {
      throw new Error(
        `Document with ID ${documentId} cannot be updated because its deliverable is in a finalized status of ${document.deliverable.statusId}.`
      );
    }
  }
}
